import ProductModel from "../models/product.model.js";
import ProductViewModel from "../models/productView.model.js";
import OrderModel from "../models/order.model.js";
import mongoose from "mongoose";

const MINUTE_MS = 60 * 1000;
const REPORT_WINDOW_MINUTES = 30;

const COUNTRY_NAMES = {
    US: "United States",
    GB: "United Kingdom",
    IN: "India",
    BR: "Brazil",
    AU: "Australia",
    CA: "Canada",
    DE: "Germany",
    FR: "France",
    AE: "United Arab Emirates",
    SA: "Saudi Arabia",
    SG: "Singapore",
    NL: "Netherlands",
    PK: "Pakistan",
    BD: "Bangladesh",
    LK: "Sri Lanka",
    NP: "Nepal",
    ZA: "South Africa",
    NG: "Nigeria",
    KE: "Kenya",
};

const normalizeCountryCode = (value) => {
    const code = String(value || "").trim().toUpperCase();

    if (code.length === 2) {
        return code;
    }

    return "unknown";
};

const getCountryName = (countryCode) => {
    const normalizedCode = normalizeCountryCode(countryCode);

    if (normalizedCode === "unknown") {
        return "Unknown";
    }

    if (COUNTRY_NAMES[normalizedCode]) {
        return COUNTRY_NAMES[normalizedCode];
    }

    try {
        const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
        return displayNames.of(normalizedCode) || normalizedCode;
    } catch {
        return normalizedCode;
    }
};

const getFlagUrl = (countryCode) => {
    const normalizedCode = normalizeCountryCode(countryCode);

    if (normalizedCode === "unknown") {
        return "https://flagcdn.com/un.svg";
    }

    return `https://flagcdn.com/${normalizedCode.toLowerCase()}.svg`;
};

const toMinuteKey = (date) => {
    const minuteDate = new Date(date);
    minuteDate.setSeconds(0, 0);
    return minuteDate.getTime();
};

const getViewerKey = (view) => String(view?.viewerKey || view?._id || "");

const buildUniqueCountMap = (views) => {
    const map = new Map();

    for (const view of views) {
        const viewerKey = getViewerKey(view);
        if (!viewerKey) {
            continue;
        }

        const countryCode = normalizeCountryCode(view?.countryCode);
        if (!map.has(countryCode)) {
            map.set(countryCode, new Set());
        }

        map.get(countryCode).add(viewerKey);
    }

    return map;
};

const buildCountryChange = (currentCount, previousCount) => {
    if (!previousCount) {
        return currentCount > 0
            ? { percentageChange: 100, changeDirection: "up" }
            : { percentageChange: 0, changeDirection: "up" };
    }

    const rawChange = ((currentCount - previousCount) / previousCount) * 100;
    return {
        percentageChange: Math.abs(Number(rawChange.toFixed(1))),
        changeDirection: rawChange < 0 ? "down" : "up",
    };
};

const getProductScopeFilter = async (req) => {
    if (req.userRole !== "seller") {
        return {};
    }

    return { productOwnerId: req.userId };
};

const SETTLED_REFUND_STATUSES = new Set(["approved", "pickup_completed", "initiated", "processed"]);

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveSellerObjectId = (sellerId) => {
    const trimmedSellerId = String(sellerId || "").trim();

    if (!trimmedSellerId) {
        return null;
    }

    return mongoose.Types.ObjectId.isValid(trimmedSellerId)
        ? new mongoose.Types.ObjectId(trimmedSellerId)
        : trimmedSellerId;
};

export const getTopProductsController = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 15, 1), 20);
        const search = String(req.query.search || "").trim();
        const pipeline = [];

        if (req.userRole === "seller") {
            pipeline.push({
                $match: {
                    createdBy: mongoose.Types.ObjectId.isValid(req.userId)
                        ? new mongoose.Types.ObjectId(req.userId)
                        : req.userId,
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
                    pipeline: [{ $project: { catName: 1, image: 1 } }],
                },
            },
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } }
        );

        if (search) {
            const searchRegex = new RegExp(escapeRegex(search), "i");
            pipeline.push({
                $match: {
                    $or: [
                        { productName: searchRegex },
                        { "category.catName": searchRegex },
                    ],
                },
            });
        }

        pipeline.push(
            { $sort: { sales: -1, createdAt: -1, _id: -1 } },
            { $limit: limit },
            {
                $project: {
                    productName: 1,
                    price: 1,
                    images: 1,
                    sales: 1,
                    category: 1,
                    brand: 1,
                    createdBy: 1,
                },
            }
        );

        const topProducts = await ProductModel.aggregate(pipeline);

        return res.status(200).json({
            message: "Top products fetched successfully",
            error: false,
            success: true,
            data: {
                topProducts,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching top products: " + error.message,
            error: true,
            success: false,
        });
    }
};

export const getBestSellingProductsController = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
        const requestedSellerId = String(req.query.sellerId || "").trim();
        const isAdmin = req.userRole === "admin";
        const isSeller = req.userRole === "seller";

        if (requestedSellerId && !isAdmin) {
            return res.status(403).json({
                message: "Only admins can filter best selling products by seller",
                error: true,
                success: false,
            });
        }

        const sellerObjectId = isSeller
            ? resolveSellerObjectId(req.userId)
            : resolveSellerObjectId(requestedSellerId);

        if (requestedSellerId && isAdmin && !sellerObjectId) {
            return res.status(400).json({
                message: "Invalid sellerId",
                error: true,
                success: false,
            });
        }

        const pipeline = [
            {
                $match: {
                    status: { $ne: "cancelled" },
                    refundStatus: { $nin: Array.from(SETTLED_REFUND_STATUSES) },
                },
            },
            {
                $unwind: "$products",
            },
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "product",
                    pipeline: [
                        {
                            $project: {
                                productName: 1,
                                price: 1,
                                images: 1,
                                stock: 1,
                                createdBy: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: "$product",
            },
            {
                $lookup: {
                    from: "users",
                    localField: "product.createdBy",
                    foreignField: "_id",
                    as: "seller",
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: "$seller",
                    preserveNullAndEmptyArrays: true,
                },
            },
        ];

        if (sellerObjectId) {
            pipeline.push({
                $match: {
                    "product.createdBy": sellerObjectId,
                },
            });
        }

        pipeline.push(
            {
                $group: {
                    _id: {
                        productId: "$product._id",
                        orderId: "$_id",
                    },
                    productId: { $first: "$product._id" },
                    productName: { $first: "$product.productName" },
                    image: {
                        $first: {
                            $ifNull: [{ $arrayElemAt: ["$product.images", 0] }, ""],
                        },
                    },
                    price: { $first: "$product.price" },
                    stock: { $first: "$product.stock" },
                    sellerId: { $first: "$product.createdBy" },
                    sellerName: { $first: "$seller.name" },
                    orderStatus: { $first: "$status" },
                    quantity: { $first: "$products.quantity" },
                },
            },
            {
                $group: {
                    _id: "$productId",
                    productName: { $first: "$productName" },
                    image: { $first: "$image" },
                    price: { $first: "$price" },
                    stock: { $first: "$stock" },
                    sellerId: { $first: "$sellerId" },
                    totalOrders: { $sum: 1 },
                    totalSales: {
                        $sum: {
                            $cond: [
                                { $eq: ["$orderStatus", "delivered"] },
                                "$quantity",
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $match: {
                    totalSales: { $gt: 0 },
                },
            },
            {
                $sort: {
                    totalSales: -1,
                    totalOrders: -1,
                    productName: 1,
                },
            },
            {
                $limit: limit,
            }
        );

        const bestSellingProducts = await OrderModel.aggregate(pipeline);

        return res.status(200).json({
            message: "Best selling products fetched successfully",
            error: false,
            success: true,
            data: {
                bestSellingProducts: bestSellingProducts.map((product) => ({
                    id: product._id?.toString?.() || String(product._id || ""),
                    product: product.productName || "Unknown Product",
                    img: product.image || "",
                    sellerName: product.sellerName || "Unknown Seller",
                    totalSales: Number(product.totalSales || 0),
                    totalOrder: Number(product.totalOrders || 0),
                    status: Number(product.stock || 0) > 0 ? "Stock" : "Stock out",
                    price: `₹${Number(product.price || 0).toLocaleString("en-IN")}`,
                    sellerId: product.sellerId ? String(product.sellerId) : "",
                })),
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching best selling products: " + error.message,
            error: true,
            success: false,
        });
    }
};

export const recordProductViewController = async (req, res) => {
    try {
        const productId = String(req.body?.productId || req.query?.productId || "").trim();
        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                error: true,
                success: false,
            });
        }

        const product = await ProductModel.findById(productId).select("createdBy").lean();
        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                error: true,
                success: false,
            });
        }

        const viewerKey = String(
            req.body?.viewerKey ||
            req.headers["x-viewer-id"] ||
            req.headers["x-session-id"] ||
            req.ip ||
            `anonymous-${Date.now()}`
        ).trim();

        const countryCode = normalizeCountryCode(
            req.body?.countryCode ||
            req.headers["x-country-code"] ||
            req.headers["cf-ipcountry"] ||
            req.headers["x-vercel-ip-country"]
        );

        await ProductViewModel.create({
            productId,
            productOwnerId: product.createdBy || null,
            viewerKey,
            countryCode,
        });

        return res.status(201).json({
            message: "Product view recorded successfully",
            error: false,
            success: true,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error recording product view: " + error.message,
            error: true,
            success: false,
        });
    }
};

export const getUserReportController = async (req, res) => {
    try {
        const scopeFilter = await getProductScopeFilter(req);
        const reportEnd = new Date();
        const reportStart = new Date(reportEnd.getTime() - REPORT_WINDOW_MINUTES * MINUTE_MS);
        const previousReportStart = new Date(reportStart.getTime() - REPORT_WINDOW_MINUTES * MINUTE_MS);

        const [currentViews, previousViews] = await Promise.all([
            ProductViewModel.find({
                ...scopeFilter,
                createdAt: { $gte: reportStart, $lt: reportEnd },
            })
                .select("viewerKey countryCode createdAt")
                .lean(),
            ProductViewModel.find({
                ...scopeFilter,
                createdAt: { $gte: previousReportStart, $lt: reportStart },
            })
                .select("viewerKey countryCode createdAt")
                .lean(),
        ]);

        const uniqueCurrentViewers = new Set(currentViews.map(getViewerKey).filter(Boolean));
        const totalProductViewersLast30Min = uniqueCurrentViewers.size;

        const bucketEnd = new Date(reportEnd);
        bucketEnd.setSeconds(0, 0);
        const bucketStart = new Date(bucketEnd.getTime() - (REPORT_WINDOW_MINUTES - 1) * MINUTE_MS);
        const minuteBuckets = Array.from({ length: REPORT_WINDOW_MINUTES }, () => new Set());
        const bucketIndexByMinute = new Map();

        minuteBuckets.forEach((_, index) => {
            bucketIndexByMinute.set(bucketStart.getTime() + index * MINUTE_MS, index);
        });

        for (const view of currentViews) {
            const viewerKey = getViewerKey(view);
            if (!viewerKey) {
                continue;
            }

            const minuteKey = toMinuteKey(view.createdAt);
            const bucketIndex = bucketIndexByMinute.get(minuteKey);

            if (typeof bucketIndex === "number") {
                minuteBuckets[bucketIndex].add(viewerKey);
            }
        }

        const productViewersPerMinute = minuteBuckets.map((bucket) => bucket.size);

        const currentCountryMap = buildUniqueCountMap(currentViews);
        const previousCountryMap = buildUniqueCountMap(previousViews);
        const countryCodes = new Set([
            ...currentCountryMap.keys(),
            ...previousCountryMap.keys(),
        ]);

        const maxCountryViewCount = Math.max(
            1,
            ...Array.from(currentCountryMap.values()).map((set) => set.size)
        );

        const viewsByCountry = Array.from(countryCodes).map((countryCode) => {
            const currentCount = currentCountryMap.get(countryCode)?.size || 0;
            const previousCount = previousCountryMap.get(countryCode)?.size || 0;
            const { percentageChange, changeDirection } = buildCountryChange(currentCount, previousCount);

            return {
                countryCode,
                countryName: getCountryName(countryCode),
                flagUrl: getFlagUrl(countryCode),
                viewCount: currentCount,
                percentageChange,
                changeDirection,
                progressPercent: Number(((currentCount / maxCountryViewCount) * 100).toFixed(2)),
            };
        }).sort((left, right) => right.viewCount - left.viewCount);

        return res.status(200).json({
            message: "User report fetched successfully",
            error: false,
            success: true,
            data: {
                totalProductViewersLast30Min,
                productViewersPerMinute,
                viewsByCountry,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching user report: " + error.message,
            error: true,
            success: false,
        });
    }
};

export const getTransactionsController = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const isAdmin = req.userRole === "admin";
        const userId = req.userId;

        // Build filter based on user role
        let filter = {};
        if (!isAdmin) {
            // For sellers, filter by orders containing their products
            filter = { "products.productId": { $in: [] } };
        }

        let orders;
        if (isAdmin) {
            // For admin: get all transactions with limit
            orders = await OrderModel.find()
                .populate({
                    path: "products.productId",
                    select: "createdBy"
                })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();
        } else {
            // For seller: get only their products' orders
            const sellerProducts = await ProductModel.find({ createdBy: userId }).select("_id").lean();
            const productIds = sellerProducts.map(p => p._id);

            orders = await OrderModel.find({
                "products.productId": { $in: productIds }
            })
                .populate({
                    path: "products.productId",
                    select: "createdBy"
                })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();
        }

        // Transform transactions for response
        const transactions = orders.map((order, index) => {
            // Get seller IDs from products in this order (only for admin)
            let sellerIds = [];
            if (isAdmin) {
                sellerIds = [...new Set(
                    order.products
                        .map(p => p.productId?.createdBy)
                        .filter(Boolean)
                        .map(id => id.toString())
                )];
            }

            return {
                id: order._id.toString(),
                no: index + 1,
                orderId: order._id.toString().substring(0, 6).toUpperCase(),
                customerId: order.userId.toString().substring(0, 6).toUpperCase(),
                date: new Date(order.createdAt).toLocaleString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                }),
                status: order.paymentStatus || order.status,
                amount: `₹${order.totalAmount}`,
                sellerId: sellerIds.length > 0 ? sellerIds[0].substring(0, 6).toUpperCase() : null,
                sellerIds: sellerIds
            };
        });

        return res.status(200).json({
            message: "Transactions fetched successfully",
            error: false,
            success: true,
            data: transactions,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching transactions: " + error.message,
            error: true,
            success: false,
        });
    }
};