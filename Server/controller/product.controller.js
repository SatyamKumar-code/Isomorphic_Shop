import express from "express";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import ProductModel from "../models/product.model.js";
import ProductViewModel from "../models/productView.model.js";
import mongoose from "mongoose";
import ReviewModel from "../models/review.model.js";
import UserModel from "../models/user.model.js";
import OrderModel from "../models/order.model.js";
import SellerLocationModel from "../models/sellerLocation.model.js";
import AddressModel from "../models/address.model.js";

const hashSeed = (seedText = '') => {
    let hash = 2166136261;

    for (let index = 0; index < seedText.length; index += 1) {
        hash ^= seedText.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
};

const getDeliveredProductOrderCount = async ({ userId, productId } = {}) => {
    return OrderModel.countDocuments({
        userId,
        status: 'delivered',
        paymentStatus: 'completed',
        'products.productId': productId,
    });
};

const getReviewEditState = async ({ review, userId, productId } = {}) => {
    if (!review || !userId || !productId) {
        return { deliveredCount: 0, canEdit: false };
    }

    const deliveredCount = await getDeliveredProductOrderCount({ userId, productId });
    const unlockedAtOrderCount = Number(review.editUnlockedAtOrderCount || 0);

    return {
        deliveredCount,
        canEdit: deliveredCount > unlockedAtOrderCount,
    };
};

const normalizeLocationText = (value = '') => String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isSameLocation = (sellerLocation = '', userLocation = '') => {
    const seller = normalizeLocationText(sellerLocation);
    const user = normalizeLocationText(userLocation);

    if (!seller || !user) {
        return false;
    }

    return seller === user || seller.includes(user) || user.includes(seller);
};

const getUserLocationText = async (userId) => {
    if (!userId) {
        return '';
    }

    const defaultAddress = await AddressModel.findOne({ userId, isDefault: true })
        .sort({ createdAt: -1 })
        .lean();

    const fallbackAddress = defaultAddress || await AddressModel.findOne({ userId })
        .sort({ createdAt: -1 })
        .lean();

    if (!fallbackAddress) {
        return '';
    }

    return [fallbackAddress.address_line1, fallbackAddress.city, fallbackAddress.state, fallbackAddress.pincode, fallbackAddress.country]
        .filter(Boolean)
        .join(' ');
};

const getSellerLocationText = async (sellerId) => {
    if (!sellerId) {
        return '';
    }

    const sellerLocation = await SellerLocationModel.findOne({ userId: sellerId }).select('location').lean();
    return sellerLocation?.location || '';
};

const getPreviousDeliveredDurationDays = async ({ userId, productId } = {}) => {
    if (!userId || !productId) {
        return 0;
    }

    const previousOrder = await OrderModel.findOne({
        userId,
        status: 'delivered',
        paymentStatus: 'completed',
        'products.productId': productId,
    })
        .sort({ deliveredAt: -1, createdAt: -1 })
        .select('createdAt deliveredAt')
        .lean();

    if (!previousOrder?.createdAt) {
        return 0;
    }

    const startTime = new Date(previousOrder.createdAt).getTime();
    const endTime = new Date(previousOrder.deliveredAt || previousOrder.createdAt).getTime();

    if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime < startTime) {
        return 0;
    }

    return Math.max(1, Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)));
};

const buildDeliveryEstimate = async ({ product, userId }) => {
    const sellerId = product?.createdBy?._id || product?.createdBy || null;
    const sellerLocation = await getSellerLocationText(sellerId);
    const userLocation = await getUserLocationText(userId);
    const sameLocation = isSameLocation(sellerLocation, userLocation);
    const previousDeliveryDays = sameLocation
        ? await getPreviousDeliveredDurationDays({ userId, productId: product?._id })
        : 0;

    const expectedDays = previousDeliveryDays > 0
        ? previousDeliveryDays + 2
        : 3;

    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + expectedDays);

    return {
        expectedDays,
        expectedDate: expectedDate.toISOString(),
        sameLocation,
        sellerLocation,
        userLocation,
        previousDeliveryDays,
    };
};

export const updateMyProductReviewController = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.userId;
        const { rating, comment } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required', success: false, error: true });
        }

        if (!rating) {
            return res.status(400).json({ message: 'Rating is required', success: false, error: true });
        }

        const review = await ReviewModel.findOne({ productId, userId });
        if (!review) {
            return res.status(404).json({ message: 'Review not found', success: false, error: true });
        }

        const { deliveredCount, canEdit } = await getReviewEditState({ review, userId, productId });
        if (!canEdit) {
            return res.status(403).json({ message: 'Not allowed to edit review yet', success: false, error: true });
        }

        review.rating = rating;
        review.comment = comment;
        review.editUnlockedAtOrderCount = deliveredCount;

        // if user reordered enough times, auto-approve
        if (deliveredCount >= 2) review.status = 'Approved';
        else review.status = 'Pending';

        await review.save();

        // if approved, recalc product rating
        if (String(review.status) === 'Approved') {
            const approvedReviews = await ReviewModel.find({ productId, $or: [{ status: 'Approved' }, { status: { $exists: false } }, { status: null }] }).select('rating');
            const averageRating = approvedReviews.length ? approvedReviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / approvedReviews.length : 0;
            await ProductModel.findByIdAndUpdate(productId, { rating: Number(averageRating.toFixed(1)) });
        }

        return res.status(200).json({ message: review.status === 'Approved' ? 'Review updated and approved' : 'Review updated and pending approval', success: true, error: false });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating review: ' + error.message, success: false, error: true });
    }
};

const createSeededRandom = (seedText = '') => {
    let state = hashSeed(seedText || 'products-random');

    return () => {
        state += 0x6D2B79F5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
};

const shuffleProducts = (products = [], seedText = '') => {
    const shuffled = [...products];
    const random = createSeededRandom(seedText);

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
};

const SEARCH_SYNONYM_GROUPS = [
    ["mobile", "mobiles", "phone", "phones", "smartphone", "smartphones", "cellphone", "cellphones", "handset", "handsets"],
    ["laptop", "laptops", "notebook", "notebooks"],
    ["earbud", "earbuds", "earphone", "earphones", "headphone", "headphones", "buds"],
    ["tv", "tvs", "television", "televisions", "smarttv", "smarttvs"],
    ["fridge", "fridges", "refrigerator", "refrigerators"],
    ["ac", "airconditioner", "airconditioners", "conditioner", "conditioners"],
];

const normalizeSearchText = (value = "") => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegex = (value = "") => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const levenshteinDistance = (left = "", right = "") => {
    const a = normalizeSearchText(left);
    const b = normalizeSearchText(right);

    if (!a) return b.length;
    if (!b) return a.length;

    const rows = a.length + 1;
    const cols = b.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let row = 0; row < rows; row += 1) {
        matrix[row][0] = row;
    }
    for (let col = 0; col < cols; col += 1) {
        matrix[0][col] = col;
    }

    for (let row = 1; row < rows; row += 1) {
        for (let col = 1; col < cols; col += 1) {
            const cost = a[row - 1] === b[col - 1] ? 0 : 1;
            matrix[row][col] = Math.min(
                matrix[row - 1][col] + 1,
                matrix[row][col - 1] + 1,
                matrix[row - 1][col - 1] + cost,
            );
        }
    }

    return matrix[rows - 1][cols - 1];
};

const pickClosestWord = (word = "", dictionary = []) => {
    const source = normalizeSearchText(word);
    if (!source || source.length < 3 || !Array.isArray(dictionary) || dictionary.length === 0) {
        return "";
    }

    let best = "";
    let bestDistance = Number.POSITIVE_INFINITY;

    dictionary.forEach((candidateRaw) => {
        const candidate = normalizeSearchText(candidateRaw);
        if (!candidate || candidate === source) {
            return;
        }

        const distance = levenshteinDistance(source, candidate);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = candidate;
        }
    });

    const allowedDistance = source.length <= 4 ? 1 : (source.length <= 8 ? 2 : 3);
    return bestDistance <= allowedDistance ? best : "";
};

const getSynonymExpandedTerms = (query = "") => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) {
        return [];
    }

    const tokens = normalizedQuery.split(" ").filter(Boolean);
    const expanded = new Set([normalizedQuery]);

    tokens.forEach((token, tokenIndex) => {
        const group = SEARCH_SYNONYM_GROUPS.find((synonymGroup) => synonymGroup.includes(token));
        if (!group) {
            return;
        }

        group.forEach((word) => {
            if (word !== token) {
                const replaced = [...tokens];
                replaced[tokenIndex] = word;
                expanded.add(replaced.join(" "));
            }
        });
    });

    return Array.from(expanded).slice(0, 12);
};

const getCorrectionDictionary = async () => {
    const products = await ProductModel.find({}, "productName brand")
        .populate("category", "catName")
        .populate("subCategory", "subCatName")
        .limit(600)
        .lean();

    const dictionary = new Set();

    products.forEach((item) => {
        [
            item?.productName,
            item?.brand,
            item?.category?.catName,
            item?.subCategory?.subCatName,
        ].forEach((textValue) => {
            const normalized = normalizeSearchText(textValue);
            if (!normalized) {
                return;
            }

            normalized.split(" ").forEach((word) => {
                if (word && word.length >= 3) {
                    dictionary.add(word);
                }
            });
        });
    });

    SEARCH_SYNONYM_GROUPS.forEach((group) => {
        group.forEach((word) => dictionary.add(word));
    });

    return Array.from(dictionary);
};

const getAutocorrectedQuery = async (query = "") => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) {
        return "";
    }

    const dictionary = await getCorrectionDictionary();
    const tokens = normalizedQuery.split(" ").filter(Boolean);

    const correctedTokens = tokens.map((token) => {
        const closest = pickClosestWord(token, dictionary);
        return closest || token;
    });

    const correctedQuery = correctedTokens.join(" ").trim();
    return correctedQuery && correctedQuery !== normalizedQuery ? correctedQuery : "";
};

const buildSearchQueryForTerm = async ({ term, requesterRole, requesterId }) => {
    const safePattern = escapeRegex(term);
    const searchRegex = new RegExp(safePattern, "i");

    const [matchingCategories, matchingSubCategories] = await Promise.all([
        mongoose.model("category").find({ catName: searchRegex }, { _id: 1 }).lean(),
        mongoose.model("subcategory").find({ subCatName: searchRegex }, { _id: 1 }).lean(),
    ]);

    const categoryIds = matchingCategories.map((item) => item._id);
    const subCategoryIds = matchingSubCategories.map((item) => item._id);

    const searchConditions = [
        { $text: { $search: term } },
        { productName: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { size: searchRegex },
        { color: searchRegex },
    ];

    if (categoryIds.length > 0) {
        searchConditions.push({ category: { $in: categoryIds } });
    }

    if (subCategoryIds.length > 0) {
        searchConditions.push({ subCategory: { $in: subCategoryIds } });
    }

    const searchQuery = { $or: searchConditions };
    if (requesterRole === "seller" && mongoose.Types.ObjectId.isValid(requesterId)) {
        searchQuery.createdBy = new mongoose.Types.ObjectId(requesterId);
    }

    return searchQuery;
};

const fetchProductsByTerm = async ({ term, sortOption, requesterRole, requesterId }) => {
    const searchRegex = new RegExp(escapeRegex(term), "i");

    const pipeline = [];

    if (requesterRole === "seller" && mongoose.Types.ObjectId.isValid(requesterId)) {
        pipeline.push({
            $match: {
                createdBy: new mongoose.Types.ObjectId(requesterId),
            },
        });
    }

    pipeline.push(
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category",
                pipeline: [{ $project: { catName: 1 } }],
            },
        },
        {
            $lookup: {
                from: "subcategories",
                localField: "subCategory",
                foreignField: "_id",
                as: "subCategory",
                pipeline: [{ $project: { subCatName: 1 } }],
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [{ $project: { name: 1, email: 1 } }],
            },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
        {
            $match: {
                $or: [
                    { productName: searchRegex },
                    { description: searchRegex },
                    { brand: searchRegex },
                    { size: searchRegex },
                    { weight: searchRegex },
                    { RAM: searchRegex },
                    { ROM: searchRegex },
                    { color: searchRegex },
                    { "category.catName": searchRegex },
                    { "subCategory.subCatName": searchRegex },
                ],
            },
        },
    );

    if (sortOption && Object.keys(sortOption).length > 0) {
        pipeline.push({ $sort: sortOption });
    }

    return await ProductModel.aggregate(pipeline);
};

const toSafeNumericValue = (value) => {
    if (value === null || value === undefined || value === '') {
        return 0;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'object' && typeof value.$numberDecimal === 'string') {
        return Number.parseFloat(value.$numberDecimal) || 0;
    }

    const parsed = Number.parseFloat(typeof value === 'object' && typeof value.toString === 'function' ? value.toString() : value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const applySearchFilter = (products = [], filterBy = '') => {
    const normalizedFilter = String(filterBy || '').trim();

    if (!normalizedFilter) {
        return products;
    }

    return products.filter((product) => {
        if (normalizedFilter === 'featured') {
            return product?.featured === true;
        }

        if (normalizedFilter === 'discounted') {
            return toSafeNumericValue(product?.discountPercentage) > 0;
        }

        if (normalizedFilter === 'best-selling') {
            return toSafeNumericValue(product?.sales) > 0;
        }

        if (normalizedFilter === 'high-rated') {
            return toSafeNumericValue(product?.rating) >= 4;
        }

        return true;
    });
};

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
});

// image upload
var imagesArr = [];

const hasGlobalAdminAccess = async (adminId) => {
    if (!adminId) {
        return false;
    }

    const admin = await UserModel.findById(adminId).select("role").lean();
    return Boolean(admin?.role === "admin");
};

export async function uploadImages(req, res) {
    try {
        imagesArr = [];

        const files = Array.isArray(req.files)
            ? req.files
            : req.file
                ? [req.file]
                : [];

        if (!files.length) {
            return res.status(400).json({
                message: "No image file uploaded",
                error: true,
                success: false,
            });
        }

        const option = {
            use_filename: true,
            unique_filename: false,
            overwrite: false,
        };

        for (let i = 0; i < files.length; i++) {
            const result = await cloudinary.uploader.upload(files[i].path, option);
            imagesArr.push(result.secure_url);
            if (fs.existsSync(files[i].path)) {
                fs.unlinkSync(files[i].path);
            }
        }


        return res.status(200).json({
            images: imagesArr,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function removeImageFromCloudinary(request, response) {
    try {
        const imgUrl = request.query.img;
        if (!imgUrl) {
            return response.status(400).json({
                message: "Image URL is required",
                error: true,
                success: false
            });
        }

        const urlArr = imgUrl.split("/");
        const image = urlArr[urlArr.length - 1];
        const imageName = image.split(".")[0];

        if (!imageName) {
            return response.status(400).json({
                message: "Invalid image name parsed from URL",
                error: true,
                success: false
            });
        }

        // Use promise form for better error handling
        try {
            const result = await cloudinary.uploader.destroy(imageName);
            if (result && (result.result === "ok" || result.result === "not found")) {
                return response.status(200).json({
                    error: false,
                    success: true,
                    message: "Image deleted successfully"
                });
            } else {
                return response.status(500).json({
                    message: result && result.result ? result.result : "Failed to delete image",
                    error: true,
                    success: false
                });
            }
        } catch (err) {
            return response.status(500).json({
                message: err.message || err,
                error: true,
                success: false
            });
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export const createProductController = async (req, res) => {
    try {
        const adminId = req.userId;
        const currentUser = await UserModel.findById(adminId).select("role sellerApprovalStatus").lean();

        if (currentUser?.role === "seller" && String(currentUser.sellerApprovalStatus || "Pending") !== "Approved") {
            return res.status(403).json({
                message: "Your seller account is waiting for admin approval",
                success: false,
                error: true
            });
        }

        const {
            productName,
            price,
            oldPrice,
            productPrice,
            discountPercentage,
            discount,
            description,
            brand,
            category,
            subCategory,
            size,
            weight,
            RAM,
            ROM,
            color,
            featured,
            stock,
            images,
            expirationStart,
            expirationEnd,
            returnDays,
            warranty,
        } = req.body;
        const requestImages = Array.isArray(images) ? images : [];
        const parsedOldPrice = Number(oldPrice ?? productPrice ?? price ?? 0);
        const parsedDiscountPercentage = Math.min(Math.max(Number(discountPercentage ?? discount ?? 0), 0), 99);
        const parsedSalePrice = Number(price ?? 0);
        const parsedExpirationStart = expirationStart ? new Date(expirationStart) : null;
        const parsedExpirationEnd = expirationEnd ? new Date(expirationEnd) : null;
        const parsedRAM = RAM ?? req.body.Ram ?? '';
        const parsedROM = ROM ?? req.body.Rom ?? '';

        // Validate required fields
        if (!productName || !description || !stock || !parsedOldPrice || !parsedSalePrice) {
            return res.status(400).json({
                message: "Product name, price, description, and stock are required",
                success: false,
                error: true
            });
        }
        // Create a new product object
        const newProduct = new ProductModel({
            productName,
            price: parsedSalePrice,
            oldPrice: parsedOldPrice,
            discountPercentage: parsedDiscountPercentage,
            description,
            brand,
            category,
            subCategory,
            images: requestImages.length ? requestImages : imagesArr,
            size,
            weight,
            RAM: parsedRAM,
            ROM: parsedROM,
            color,
            featured: Boolean(featured),
            stock,
            expirationStart: parsedExpirationStart,
            expirationEnd: parsedExpirationEnd,
            returnDays: Number.isFinite(Number(returnDays)) ? Number(returnDays) : 7,
            warranty: String(warranty || '').trim(),
            createdBy: adminId || null,
        });

        if (!newProduct) {
            imagesArr = []; // Clear the images array if product creation fails
            return res.status(400).json({
                message: "Failed to create product",
                success: false,
                error: true
            });
        }

        // Save the product to the database
        await newProduct.save();
        imagesArr = []; // Clear the images array after saving the product

        return res.status(201).json({
            message: "Product created successfully",
            success: true,
            error: false
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in creating product: " + error.message,
            success: false,
            error: true
        })
    }
}

export const getAdminProductsController = async (req, res) => {
    try {
        const adminId = req.userId;
        const requesterRole = String(req.userRole || '').toLowerCase();
        if (!adminId) {
            return res.status(401).json({
                message: "Unauthorized access",
                success: false,
                error: true,
            });
        }

        const globalAccess = await hasGlobalAdminAccess(adminId);
        const previousCreatedBy = req.query.createdBy;
        req.query.createdBy = requesterRole === "seller"
            ? String(adminId)
            : (globalAccess ? "" : String(adminId));
        await getAllProductsController(req, res);
        req.query.createdBy = previousCreatedBy;
    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching admin products: " + error.message,
            success: false,
            error: true,
        });
    }
};

export const getAllProductsController = async (req, res) => {
    try {
        const sortBy = req.query.sortBy;
        const randomSeed = String(req.query.seed || '').trim();
        const requesterRole = String(req.userRole || '').toLowerCase();
        const requesterId = String(req.userId || '').trim();
        const requestedCreatedBy = String(req.query.createdBy || "").trim();
        const createdBy = requesterRole === 'seller' && requesterId ? requesterId : requestedCreatedBy;
        const rawPage = Number(req.query.page || 1);
        const rawLimit = Number(req.query.limit || 10);
        const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
        const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 10;
        const search = String(req.query.search || '').trim();
        const paginate = req.query.paginate === 'true' || Boolean(req.query.page) || Boolean(req.query.limit) || Boolean(search);

        let sortStage = null;
        let filterStage = null;
        switch (sortBy) {
            case "a-z": sortStage = { $sort: { productName: 1 } }; break;
            case "z-a": sortStage = { $sort: { productName: -1 } }; break;
            case "priceLow": sortStage = { $sort: { price: 1 } }; break;
            case "priceHigh": sortStage = { $sort: { price: -1 } }; break;
            case "ratingLow": sortStage = { $sort: { rating: 1 } }; break;
            case "ratingHigh": sortStage = { $sort: { rating: -1 } }; break;
            case "latest": sortStage = { $sort: { createdAt: -1, _id: -1 } }; break;
            case "oldest": sortStage = { $sort: { createdAt: 1, _id: 1 } }; break;
            case "stockHigh": sortStage = { $sort: { stock: -1, _id: -1 } }; break;
            case "stockLow": sortStage = { $sort: { stock: 1, _id: 1 } }; break;
            case "salesHigh": sortStage = { $sort: { sales: -1, _id: -1 } }; break;
            case "salesLow": sortStage = { $sort: { sales: 1, _id: 1 } }; break;
            case "outOfStock":
                filterStage = { $match: { stock: { $lte: 0 } } };
                sortStage = { $sort: { createdAt: -1, _id: -1 } };
                break;
            case "featured":
                filterStage = { $match: { featured: true } };
                sortStage = { $sort: { createdAt: -1, _id: -1 } };
                break;
            case "random":
                break;
        }

        const basePipeline = [];

        if (createdBy && mongoose.Types.ObjectId.isValid(createdBy)) {
            basePipeline.push({
                $match: {
                    createdBy: new mongoose.Types.ObjectId(createdBy),
                },
            });
        }

        basePipeline.push(
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category",
                    pipeline: [{ $project: { catName: 1 } }]
                }
            },
            {
                $lookup: {
                    from: "subcategories",
                    localField: "subCategory",
                    foreignField: "_id",
                    as: "subCategory",
                    pipeline: [{ $project: { subCatName: 1 } }]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy",
                    pipeline: [{ $project: { name: 1, email: 1 } }],
                }
            },
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } }
        );

        if (search) {
            const safePattern = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchRegex = new RegExp(safePattern, 'i');
            basePipeline.push({
                $match: {
                    $or: [
                        { productName: searchRegex },
                        { description: searchRegex },
                        { "category.catName": searchRegex },
                        { "subCategory.subCatName": searchRegex },
                    ]
                }
            });
        }

        if (filterStage) {
            basePipeline.push(filterStage);
        }

        if (sortBy === 'random') {
            const products = await ProductModel.aggregate(basePipeline);
            const shuffledProducts = shuffleProducts(products, randomSeed);

            if (!paginate) {
                return res.status(200).json({
                    message: "Products fetched successfully",
                    success: true,
                    error: false,
                    products: shuffledProducts,
                });
            }

            const skip = (page - 1) * limit;
            const paginatedProducts = shuffledProducts.slice(skip, skip + limit);

            return res.status(200).json({
                message: "Products fetched successfully",
                success: true,
                error: false,
                products: paginatedProducts,
                pagination: {
                    page,
                    limit,
                    totalCount: shuffledProducts.length,
                    totalPages: Math.max(1, Math.ceil(shuffledProducts.length / limit)),
                    hasNextPage: skip + limit < shuffledProducts.length,
                    hasPrevPage: page > 1,
                },
            });
        }

        if (sortStage) {
            basePipeline.push(sortStage);
        } else if (paginate) {
            // Stable default sort is required for deterministic pagination.
            basePipeline.push({ $sort: { createdAt: -1, _id: -1 } });
        } else {
            basePipeline.push({ $sample: { size: await ProductModel.countDocuments() } });
        }

        if (!paginate) {
            const products = await ProductModel.aggregate(basePipeline);
            return res.status(200).json({
                message: "Products fetched successfully",
                success: true,
                error: false,
                products
            });
        }

        const skip = (page - 1) * limit;
        const paginatedPipeline = [
            ...basePipeline,
            {
                $facet: {
                    products: [
                        { $skip: skip },
                        { $limit: limit },
                    ],
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            }
        ];

        const result = await ProductModel.aggregate(paginatedPipeline);
        const products = result?.[0]?.products || [];
        const totalCount = result?.[0]?.totalCount?.[0]?.count || 0;
        const totalPages = Math.max(1, Math.ceil(totalCount / limit));

        return res.status(200).json({
            message: "Products fetched successfully",
            success: true,
            error: false,
            products,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching products: " + error.message,
            success: false,
            error: true
        })
    }
}

export const getAdminProductByIdController = async (req, res) => {
    try {
        const productId = req.params.id;
        const adminId = req.userId;
        const globalAccess = await hasGlobalAdminAccess(adminId);

        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true,
            });
        }

        const query = globalAccess ? { _id: productId } : { _id: productId, createdBy: adminId };
        const product = await ProductModel.findOne(query)
            .populate("category", "catName")
            .populate("subCategory", "subCatName");

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                success: false,
                error: true,
            });
        }

        return res.status(200).json({
            message: "Product fetched successfully",
            success: true,
            error: false,
            product,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching admin product: " + error.message,
            success: false,
            error: true,
        });
    }
};

export const getProductByIdController = async (req, res) => {
    try {
        const productId = req.params.id;
        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }

        const product = await ProductModel.findById(productId)
            .populate("category", "catName")
            .populate("subCategory", "subCatName")
            .populate("createdBy", "name email");

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                success: false,
                error: true
            });
        }

        const deliveryEstimate = await buildDeliveryEstimate({ product, userId: req.userId });

        return res.status(200).json({
            message: "Product fetched successfully",
            success: true,
            error: false,
            product: {
                ...product.toObject(),
                deliveryEstimate,
            }
        });


    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching product: " + error.message,
            success: false,
            error: true
        })
    }
}

export const updateProductController = async (req, res) => {
    try {
        const productId = req.params.id;
        const adminId = req.userId;
        const globalAccess = await hasGlobalAdminAccess(adminId);
        const {
            productName,
            price,
            oldPrice,
            productPrice,
            discountPercentage,
            discount,
            description,
            brand,
            category,
            subCategory,
            size,
            weight,
            RAM,
            ROM,
            color,
            featured,
            stock,
            images,
            expirationStart,
            expirationEnd,
            returnDays,
            warranty,
        } = req.body;
        const parsedOldPrice = Number(oldPrice ?? productPrice ?? 0);
        const parsedDiscountPercentage = Math.min(Math.max(Number(discountPercentage ?? discount ?? 0), 0), 99);
        const parsedExpirationStart = expirationStart ? new Date(expirationStart) : null;
        const parsedExpirationEnd = expirationEnd ? new Date(expirationEnd) : null;
        const parsedRAM = RAM ?? req.body.Ram;
        const parsedROM = ROM ?? req.body.Rom;
        const requestImages = Array.isArray(images) ? images : [];

        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }

        // Build update object
        const updateObj = { productName, price, description, brand, category, subCategory, size, weight, color, stock };
        if (featured !== undefined) {
            updateObj.featured = Boolean(featured);
        }
        if (parsedOldPrice > 0) {
            updateObj.oldPrice = parsedOldPrice;
        }
        if (Number.isFinite(parsedDiscountPercentage)) {
            updateObj.discountPercentage = parsedDiscountPercentage;
        }
        if (parsedRAM !== undefined) {
            updateObj.RAM = parsedRAM;
        }
        if (parsedROM !== undefined) {
            updateObj.ROM = parsedROM;
        }
        updateObj.expirationStart = parsedExpirationStart;
        updateObj.expirationEnd = parsedExpirationEnd;
        if (returnDays !== undefined) {
            const parsedReturnDays = Number(returnDays);
            if (Number.isFinite(parsedReturnDays) && parsedReturnDays >= 0) {
                updateObj.returnDays = parsedReturnDays;
            }
        }
        if (warranty !== undefined) {
            updateObj.warranty = String(warranty || '').trim();
        }

        // Handle images: prioritize request body images, then use uploaded images
        let usedImagesArr = false;
        if (requestImages.length > 0) {
            updateObj.images = requestImages;
        } else if (imagesArr && imagesArr.length > 0) {
            updateObj.images = imagesArr;
            usedImagesArr = true;
        }

        const updatedProduct = await ProductModel.findOneAndUpdate(
            globalAccess ? { _id: productId } : { _id: productId, createdBy: adminId },
            { $set: updateObj },
            { new: true }
        );

        if (usedImagesArr) imagesArr = []; // Only clear if used

        if (!updatedProduct) {
            return res.status(404).json({
                message: "Product not found",
                success: false,
                error: true
            });
        }

        return res.status(200).json({
            message: "Product updated successfully",
            success: true,
            error: false,
            product: updatedProduct
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in updating product: " + error.message,
            success: false,
            error: true
        })
    }
}

export const deleteProductController = async (req, res) => {
    try {
        const productId = req.params.id;
        const adminId = req.userId;
        const globalAccess = await hasGlobalAdminAccess(adminId);
        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }

        const deletedProduct = await ProductModel.findOneAndDelete(globalAccess ? { _id: productId } : { _id: productId, createdBy: adminId });

        if (!deletedProduct) {
            return res.status(404).json({
                message: "Product not found",
                success: false,
                error: true
            });
        }

        await ReviewModel.deleteMany({ productId: productId });

        const images = deletedProduct.images;
        let img = "";
        for (img of images) {
            const imgUrl = img;
            const urlArr = imgUrl.split("/");
            const image = urlArr[urlArr.length - 1];

            const imageName = image.split(".")[0];

            if (imageName) {
                cloudinary.uploader.destroy(imageName, (error, result) => {
                    //console.log(result, error);
                });
            }
        }

        return res.status(200).json({
            message: "Product deleted successfully",
            success: true,
            error: false
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in deleting product: " + error.message,
            success: false,
            error: true
        })
    }
}

export const getProductsByCategoryIdController = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        if (!categoryId) {
            return res.status(400).json({
                message: "Category ID is required",
                success: false,
                error: true
            });
        }

        const sortBy = req.query.sortBy;
        let sortStage = null;
        switch (sortBy) {
            case "a-z": sortStage = { $sort: { productName: 1 } }; break;
            case "z-a": sortStage = { $sort: { productName: -1 } }; break;
            case "priceLow": sortStage = { $sort: { price: 1 } }; break;
            case "priceHigh": sortStage = { $sort: { price: -1 } }; break;
            case "ratingLow": sortStage = { $sort: { rating: 1 } }; break;
            case "ratingHigh": sortStage = { $sort: { rating: -1 } }; break;
        }

        const pipeline = [
            { $match: { category: new mongoose.Types.ObjectId(categoryId) } },
        ];
        if (sortStage) {
            pipeline.push(sortStage);
        } else {
            pipeline.push({ $sample: { size: await ProductModel.countDocuments({ category: categoryId }) } });
        }

        const products = await ProductModel.aggregate(pipeline);

        if (!products || products.length === 0) {
            return res.status(404).json({
                message: "No products found for this category",
                success: false,
                error: true
            });
        }

        return res.status(200).json({
            message: "Products fetched successfully",
            success: true,
            error: false,
            products
        });


    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching products by category: " + error.message,
            success: false,
            error: true
        })
    }
}

export const getProductsBySubCategoryIdController = async (req, res) => {
    try {
        const subCategoryId = req.params.subCategoryId;
        if (!subCategoryId) {
            return res.status(400).json({
                message: "Subcategory ID is required",
                success: false,
                error: true
            });
        }

        const sortBy = req.query.sortBy;
        let sortStage = null;
        switch (sortBy) {
            case "a-z": sortStage = { $sort: { productName: 1 } }; break;
            case "z-a": sortStage = { $sort: { productName: -1 } }; break;
            case "priceLow": sortStage = { $sort: { price: 1 } }; break;
            case "priceHigh": sortStage = { $sort: { price: -1 } }; break;
            case "ratingLow": sortStage = { $sort: { rating: 1 } }; break;
            case "ratingHigh": sortStage = { $sort: { rating: -1 } }; break;
        }

        const pipeline = [
            { $match: { subCategory: new mongoose.Types.ObjectId(subCategoryId) } },
        ];
        if (sortStage) {
            pipeline.push(sortStage);
        } else {
            pipeline.push({ $sample: { size: await ProductModel.countDocuments({ subCategory: subCategoryId }) } });
        }

        const products = await ProductModel.aggregate(pipeline);

        if (!products || products.length === 0) {
            return res.status(404).json({
                message: "No products found for this subcategory",
                success: false,
                error: true
            });
        }

        return res.status(200).json({
            message: "Products fetched successfully",
            success: true,
            error: false,
            products
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching products by subcategory: " + error.message,
            success: false,
            error: true
        })
    }
}

export const getTopRatedProductsController = async (req, res) => {
    try {
        const topRatedProducts = await ProductModel.find().sort({ rating: -1 }).limit(10);

        if (!topRatedProducts || topRatedProducts.length === 0) {
            return res.status(404).json({
                message: "No top-rated products found",
                success: false,
                error: true
            });
        }

        return res.status(200).json({
            message: "Top-rated products fetched successfully",
            success: true,
            error: false,
            products: topRatedProducts
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching top-rated products: " + error.message,
            success: false,
            error: true
        })

    }
}

export const getLatestProductsController = async (req, res) => {
    try {
        const latestProducts = await ProductModel.find().sort({ createdAt: -1 }).limit(10);

        if (!latestProducts || latestProducts.length === 0) {
            return res.status(404).json({
                message: "No latest products found",
                success: false,
                error: true
            });
        }

        return res.status(200).json({
            message: "Latest products fetched successfully",
            success: true,
            error: false,
            products: latestProducts
        });


    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching latest products: " + error.message,
            success: false,
            error: true
        })
    }
}

export const searchProductsController = async (req, res) => {
    try {
        const searchTerm = String(req.query.q || "").trim();
        const requesterRole = String(req.userRole || '').toLowerCase();
        const requesterId = String(req.userId || '').trim();
        const filterBy = String(req.query.filterBy || '').trim();
        const randomSeed = String(req.query.seed || '').trim();
        if (!searchTerm) {
            return res.status(400).json({
                message: "Search term is required",
                success: false,
                error: true
            });
        }

        const sortBy = req.query.sortBy;
        const isRandomSort = !sortBy || sortBy === 'random';
        let sortOption = {};
        switch (sortBy) {
            case "a-z": sortOption = { productName: 1 }; break;
            case "z-a": sortOption = { productName: -1 }; break;
            case "priceLow": sortOption = { price: 1 }; break;
            case "priceHigh": sortOption = { price: -1 }; break;
            case "ratingLow": sortOption = { rating: 1 }; break;
            case "ratingHigh": sortOption = { rating: -1 }; break;
            case "random":
                sortOption = {};
                break;
            default: sortOption = {};
        }

        const normalizedSearch = normalizeSearchText(searchTerm);
        const synonymTerms = getSynonymExpandedTerms(normalizedSearch).filter((term) => term !== normalizedSearch);
        const correctedQuery = await getAutocorrectedQuery(normalizedSearch);
        const correctedSynonymTerms = correctedQuery
            ? getSynonymExpandedTerms(correctedQuery).filter((term) => term !== correctedQuery)
            : [];

        const searchFlow = [
            { term: normalizedSearch, strategy: "exact" },
            ...synonymTerms.map((term) => ({ term, strategy: "synonym" })),
            ...(correctedQuery ? [{ term: correctedQuery, strategy: "autocorrect" }] : []),
            ...correctedSynonymTerms.map((term) => ({ term, strategy: "autocorrect+synonym" })),
        ];

        let products = [];
        let matchedTerm = normalizedSearch;
        let matchedStrategy = "exact";

        for (let index = 0; index < searchFlow.length; index += 1) {
            const candidate = searchFlow[index];
            const foundProducts = await fetchProductsByTerm({
                term: candidate.term,
                sortOption,
                requesterRole,
                requesterId,
            });

            const filteredProducts = applySearchFilter(foundProducts, filterBy);

            if (Array.isArray(filteredProducts) && filteredProducts.length > 0) {
                products = isRandomSort ? shuffleProducts(filteredProducts, randomSeed || normalizedSearch) : filteredProducts;
                matchedTerm = candidate.term;
                matchedStrategy = candidate.strategy;
                break;
            }
        }

        return res.status(200).json({
            message: "Products fetched successfully",
            success: true,
            error: false,
            products,
            searchMeta: {
                originalQuery: searchTerm,
                appliedQuery: matchedTerm,
                correctedQuery: correctedQuery || null,
                strategy: matchedStrategy,
                didFallback: matchedTerm !== normalizedSearch,
            },
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in searching products: " + error.message,
            success: false,
            error: true
        })
    }
}

export const filterProductsController = async (req, res) => {
    try {
        const { category, subCategory } = req.query;
        let { minPrice, maxPrice, minRating } = req.query;
        const filterConditions = {};

        if (category) {
            filterConditions.category = category;
        }
        if (subCategory) {
            filterConditions.subCategory = subCategory;
        }

        // Coerce to numbers and guard against NaN
        const minPriceNum = Number(minPrice);
        const maxPriceNum = Number(maxPrice);
        const minRatingNum = Number(minRating);

        if (Number.isFinite(minPriceNum) && Number.isFinite(maxPriceNum)) {
            filterConditions.price = { $gte: minPriceNum, $lte: maxPriceNum };
        }
        if (Number.isFinite(minRatingNum)) {
            filterConditions.rating = { $gte: minRatingNum };
        }

        // Sort options: a-z, z-a, priceLow, priceHigh, ratingLow, ratingHigh
        const sortBy = req.query.sortBy;
        let sortOption = {};
        switch (sortBy) {
            case "a-z": sortOption = { productName: 1 }; break;
            case "z-a": sortOption = { productName: -1 }; break;
            case "priceLow": sortOption = { price: 1 }; break;
            case "priceHigh": sortOption = { price: -1 }; break;
            case "ratingLow": sortOption = { rating: 1 }; break;
            case "ratingHigh": sortOption = { rating: -1 }; break;
            default: sortOption = {};
        }

        const products = await ProductModel.find(filterConditions)
            .populate("category", "catName")
            .populate("subCategory", "subCatName")
            .sort(sortOption);

        return res.status(200).json({
            message: "Products filtered successfully",
            success: true,
            error: false,
            products
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in filtering products: " + error.message,
            success: false,
            error: true
        })
    }
}

export const getRelatedProductsController = async (req, res) => {
    try {
        const productId = req.params.id;
        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }

        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                success: false,
                error: true
            });
        }

        const relatedProducts = await ProductModel.find({
            _id: { $ne: productId },
            $or: [
                { category: product.category },
                { subCategory: product.subCategory }
            ]
        });

        return res.status(200).json({
            message: "Related products fetched successfully",
            error: false,
            success: true,
            products: relatedProducts,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error fetching related products: ' + error.message, error: true, success: false
        });
    }
};

export const getRecentlyViewedProductsController = async (req, res) => {
    try {
        // viewerKey may be provided via query or headers; if not, fallback to latest products
        const viewerKey = String(req.query.viewerKey || req.headers['x-viewer-id'] || req.headers['x-session-id'] || '').trim();

        if (!viewerKey) {
            // return latest products as a sensible default
            const latest = await ProductModel.find({}).sort({ createdAt: -1 }).limit(10).lean();
            return res.status(200).json({ message: 'Recently viewed fetched (latest fallback)', error: false, success: true, products: latest });
        }

        // find most recent distinct productIds for this viewer

        // fetch recent view records and pick distinct product ids (most recent first)
        const views = await ProductViewModel.find({ viewerKey }).sort({ createdAt: -1 }).limit(200).lean();
        const seen = new Set();
        const productIds = [];
        for (const v of views) {
            const id = String(v.productId || '');
            if (id && !seen.has(id)) {
                seen.add(id);
                productIds.push(id);
            }
            if (productIds.length >= 10) break;
        }

        // preserve order: fetch each product by id in the same sequence
        const products = [];
        if (productIds.length > 0) {
            for (const pid of productIds) {
                try {
                    const p = await ProductModel.findById(pid).lean();
                    if (p) products.push(p);
                } catch (e) {
                    // ignore missing products
                }
            }
        }


        return res.status(200).json({
            message: 'Recently viewed fetched',
            error: false,
            success: true, products
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Error fetching recently viewed: ' + error.message, error: true, success: false
        });
    }
};

export const createProductReviewController = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.userId;
        const { rating, comment } = req.body;
        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }
        if (!rating) {
            return res.status(400).json({
                message: "Rating is required",
                success: false,
                error: true
            });
        }

        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                success: false,
                error: true
            });
        }

        const eligibleOrder = await OrderModel.findOne({
            userId,
            status: "delivered",
            paymentStatus: "completed",
            products: {
                $elemMatch: {
                    productId,
                },
            },
        }).select("_id");

        if (!eligibleOrder) {
            return res.status(403).json({
                message: "Only customers who have ordered and received this product can review it",
                success: false,
                error: true
            });
        }

        const existingReview = await ReviewModel.findOne({ productId, userId });
        if (existingReview) {
            const deliveredCount = await getDeliveredProductOrderCount({ userId, productId });
            const canEdit = deliveredCount > Number(existingReview.editUnlockedAtOrderCount || 0);

            // Allow editing the same review again only after a new delivered order unlocks it.
            if (!canEdit) {
                // If existing review has no comment and user provided a comment now, keep the old behavior limited to the first-order flow.
                if ((!existingReview.comment || String(existingReview.comment).trim() === '') && comment && String(comment).trim() !== '') {
                    existingReview.comment = comment;
                    existingReview.editUnlockedAtOrderCount = deliveredCount;
                    existingReview.status = 'Pending';

                    await existingReview.save();

                    return res.status(200).json({
                        message: 'Review updated with comment and is pending approval',
                        success: true,
                        error: false,
                    });
                }

                return res.status(400).json({
                    message: "You have already reviewed this product",
                    success: false,
                    error: true
                });
            }

            existingReview.rating = rating;
            existingReview.comment = comment;
            existingReview.editUnlockedAtOrderCount = deliveredCount;
            existingReview.status = 'Approved';
            await existingReview.save();

            const approvedReviews = await ReviewModel.find({
                productId,
                $or: [{ status: 'Approved' }, { status: { $exists: false } }, { status: null }],
            }).select('rating');
            const averageRating = approvedReviews.length
                ? approvedReviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / approvedReviews.length
                : 0;
            product.rating = Number(averageRating.toFixed(1));
            await product.save();

            return res.status(200).json({
                message: 'Review updated and approved',
                success: true,
                error: false,
            });
        }

        // Determine if this review should be auto-approved (user reordered product)
        const deliveredCount = await getDeliveredProductOrderCount({ userId, productId });

        const statusToSet = deliveredCount >= 2 ? 'Approved' : 'Pending';

        const newReview = new ReviewModel({
            userId,
            productId,
            rating,
            comment,
            status: statusToSet,
            editUnlockedAtOrderCount: deliveredCount,
        });
        await newReview.save();

        // If the review is approved immediately, recalculate product rating from approved reviews
        if (statusToSet === 'Approved') {
            const approvedReviews = await ReviewModel.find({
                productId,
                $or: [{ status: 'Approved' }, { status: { $exists: false } }, { status: null }],
            }).select('rating');
            const averageRating = approvedReviews.length
                ? approvedReviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / approvedReviews.length
                : 0;
            product.rating = Number(averageRating.toFixed(1));
            await product.save();
        } else {
            // Update product's average rating to include this new rating immediately for display
            const approvedReviews = await ReviewModel.find({
                productId,
                $or: [{ status: 'Approved' }, { status: { $exists: false } }, { status: null }],
            }).select('rating');
            const approvedSum = approvedReviews.reduce((acc, review) => acc + Number(review.rating || 0), 0);
            const approvedCount = approvedReviews.length;
            const combinedSum = approvedSum + Number(rating || 0);
            const combinedCount = approvedCount + 1;
            const combinedAvg = combinedCount ? (combinedSum / combinedCount) : 0;
            product.rating = Number(combinedAvg.toFixed(1));
            await product.save();
        }

        return res.status(201).json({
            message: statusToSet === 'Approved' ? 'Review created and approved' : 'Review created successfully and is pending approval',
            success: true,
            error: false,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in creating product review: " + error.message,
            success: false,
            error: true
        })
    }
}

export const getProductReviewsController = async (req, res) => {
    try {
        const productId = req.params.id;
        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }

        // fetch only approved reviews for display
        const reviews = await ReviewModel.find({
            productId,
            $or: [{ status: "Approved" }, { status: { $exists: false } }, { status: null }],
        })
            .populate("userId", "name avatar")
            .sort({ createdAt: -1 });

        // fetch current user's review (if authenticated) so they can edit/add comment later
        let myReview = null;
        try {
            const currentUserId = req.userId;
            if (currentUserId) {
                myReview = await ReviewModel.findOne({ productId, userId: currentUserId }).select('rating comment status createdAt editUnlockedAtOrderCount').lean();
                if (myReview) {
                    const { deliveredCount, canEdit } = await getReviewEditState({
                        review: myReview,
                        userId: currentUserId,
                        productId,
                    });
                    myReview.canEdit = canEdit;

                    // Once the customer has reordered the product, the latest review should no longer wait for seller approval.
                    if (canEdit && deliveredCount >= 2 && String(myReview.status || '') !== 'Approved') {
                        await ReviewModel.updateOne(
                            { _id: myReview._id },
                            { $set: { status: 'Approved', editUnlockedAtOrderCount: deliveredCount } },
                        );
                        myReview.status = 'Approved';
                        myReview.editUnlockedAtOrderCount = deliveredCount;

                        const approvedReviews = await ReviewModel.find({
                            productId,
                            $or: [{ status: 'Approved' }, { status: { $exists: false } }, { status: null }],
                        }).select('rating');
                        const averageRating = approvedReviews.length
                            ? approvedReviews.reduce((acc, review) => acc + Number(review.rating || 0), 0) / approvedReviews.length
                            : 0;
                        await ProductModel.findByIdAndUpdate(productId, { rating: Number(averageRating.toFixed(1)) });
                    }
                }
            }
        } catch (e) {
            myReview = myReview || null;
        }

        // aggregate counts and average from all submitted ratings (including pending)
        const allReviews = await ReviewModel.find({ productId }).select("rating");
        const counts = [0, 0, 0, 0, 0];
        let sum = 0;
        allReviews.forEach((r) => {
            const rating = Math.max(1, Math.min(5, Number(r.rating || 0)));
            counts[5 - rating] += 1; // index 0 => 5-star
            sum += Number(r.rating || 0);
        });
        const total = counts.reduce((a, b) => a + b, 0) || 0;
        const percent = counts.map((c) => total ? Math.round((c / total) * 100) : 0);
        const average = total ? Number((sum / total).toFixed(1)) : Number(product?.rating || 0 || 0);

        return res.status(200).json({
            message: "Product reviews fetched successfully",
            success: true,
            error: false,
            reviews,
            ratingSummary: { counts, percent, total, average },
            myReview
        });


    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching product reviews: " + error.message,
            success: false,
            error: true
        })
    }
}

