import ReviewModel from "../models/review.model.js";
import ProductModel from "../models/product.model.js";
import UserModel from "../models/user.model.js";
import mongoose from "mongoose";

const normalizeStatus = (status) => {
    if (!status) return "Pending";
    const value = String(status).trim().toLowerCase();
    if (value === "approved") return "Approved";
    if (value === "rejected") return "Rejected";
    return "Pending";
};

const buildStatusQuery = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === "Pending") {
        return { $or: [{ status: "Pending" }, { status: { $exists: false } }, { status: null }] };
    }
    return { status: normalized };
};

const recalculateProductRating = async (productId) => {
    const reviews = await ReviewModel.find({
        productId,
        $or: [{ status: "Approved" }, { status: { $exists: false } }, { status: null }],
    }).select("rating");

    const averageRating = reviews.length
        ? reviews.reduce((acc, review) => acc + Number(review.rating || 0), 0) / reviews.length
        : 0;

    await ProductModel.findByIdAndUpdate(productId, { rating: Number(averageRating.toFixed(1)) });
};

export const getAllReviews = async (req, res) => {
    try {
        let { page = 1, limit = 10, search = "", status = "All reviews", sortBy = "latest", minRating = "all" } = req.query;

        page = Number(page);
        limit = Number(limit);

        if (!Number.isFinite(page) || page < 1) page = 1;
        if (!Number.isFinite(limit) || limit < 1) limit = 10;
        if (limit > 100) limit = 100;

        const query = {};
        if (status && String(status).toLowerCase() !== "all reviews") {
            Object.assign(query, buildStatusQuery(status));
        }

        if (minRating !== "all") {
            const parsedRating = Number(minRating);
            if (Number.isFinite(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
                query.rating = { $gte: parsedRating };
            }
        }

        const safeSearch = String(search).trim();
        if (safeSearch) {
            const regex = new RegExp(safeSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            const [matchedProducts, matchedUsers] = await Promise.all([
                ProductModel.find({ productName: regex }).select("_id"),
                UserModel.find({ name: regex }).select("_id"),
            ]);

            const searchOr = [
                { comment: regex },
                { productId: { $in: matchedProducts.map((item) => item._id) } },
                { userId: { $in: matchedUsers.map((item) => item._id) } },
            ];

            if (mongoose.Types.ObjectId.isValid(safeSearch)) {
                searchOr.push({ _id: new mongoose.Types.ObjectId(safeSearch) });
            }

            query.$or = [
                ...searchOr,
            ];
        }

        const skip = (page - 1) * limit;
        let sortOption = { createdAt: -1 };
        if (sortBy === "oldest") sortOption = { createdAt: 1 };
        if (sortBy === "ratingHigh") sortOption = { rating: -1, createdAt: -1 };
        if (sortBy === "ratingLow") sortOption = { rating: 1, createdAt: -1 };

        const [reviews, total] = await Promise.all([
            ReviewModel.find(query)
                .populate("userId", "name avatar email")
                .populate("productId", "productName images")
                .sort(sortOption)
                .skip(skip)
                .limit(limit),
            ReviewModel.countDocuments(query),
        ]);

        const formattedReviews = reviews.map((review) => ({
            id: String(review._id),
            productId: review.productId?._id ? String(review.productId._id) : null,
            product: review.productId?.productName || "Unknown Product",
            image: Array.isArray(review.productId?.images) && review.productId.images.length ? review.productId.images[0] : null,
            customer: review.userId?.name || "Unknown User",
            rating: Number(review.rating || 0),
            comment: review.comment || "",
            status: normalizeStatus(review.status),
            createdAt: review.createdAt,
            date: new Date(review.createdAt).toLocaleDateString("en-GB"),
        }));

        const totalPages = Math.max(1, Math.ceil(total / limit));

        return res.status(200).json({
            message: "Reviews fetched successfully",
            success: true,
            error: false,
            data: {
                reviews: formattedReviews,
                total,
                page,
                limit,
                totalPages,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching reviews: " + error.message,
            success: false,
            error: true,
        });
    }
};

export const getReviewSummary = async (req, res) => {
    try {
        const [summary] = await ReviewModel.aggregate([
            {
                $project: {
                    status: { $ifNull: ["$status", "Pending"] },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    approved: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "Approved"] }, 1, 0],
                        },
                    },
                    pending: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "Pending"] }, 1, 0],
                        },
                    },
                    rejected: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0],
                        },
                    },
                },
            },
        ]);

        const total = summary?.total || 0;
        const approved = summary?.approved || 0;
        const pending = summary?.pending || 0;
        const rejected = summary?.rejected || 0;

        return res.status(200).json({
            message: "Review summary fetched successfully",
            success: true,
            error: false,
            data: {
                summaryCards: [
                    { title: "Total Reviews", value: String(total), change: "--", changeDirection: "up", changeColor: "#4EA674" },
                    { title: "Pending Reviews", value: String(pending), change: "--", changeDirection: "up", changeColor: "#4EA674" },
                    { title: "Approved Reviews", value: String(approved), change: "--", changeDirection: "up", changeColor: "#4EA674" },
                    { title: "Rejected Reviews", value: String(rejected), change: "--", changeDirection: "down", changeColor: "#EF4444" },
                ],
                tabs: [
                    { label: "All reviews", count: total },
                    { label: "Approved", count: approved },
                    { label: "Pending", count: pending },
                    { label: "Rejected", count: rejected },
                ],
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching review summary: " + error.message,
            success: false,
            error: true,
        });
    }
};

export const updateReviewStatus = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { status } = req.body;

        if (!reviewId || !status) {
            return res.status(400).json({
                message: "Review ID and status are required",
                success: false,
                error: true,
            });
        }

        const normalized = normalizeStatus(status);
        if (!["Approved", "Pending", "Rejected"].includes(normalized)) {
            return res.status(400).json({
                message: "Invalid status value",
                success: false,
                error: true,
            });
        }

        const review = await ReviewModel.findByIdAndUpdate(
            reviewId,
            { status: normalized },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                message: "Review not found",
                success: false,
                error: true,
            });
        }

        await recalculateProductRating(review.productId);

        return res.status(200).json({
            message: "Review status updated successfully",
            success: true,
            error: false,
            data: {
                id: String(review._id),
                status: review.status,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error updating review status: " + error.message,
            success: false,
            error: true,
        });
    }
};
