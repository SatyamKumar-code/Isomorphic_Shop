import express from "express";
import CartModel from "../models/cart.model.js";
import OrderModel from "../models/order.model.js";
import ProductModel from "../models/product.model.js";
import UserModel from "../models/user.model.js";
import AddressModel from "../models/address.model.js";
import razorpay from "../config/razorpay.js";


// Helper to validate, decrement stock, and clear cart atomically, returning a deep clone of products
import mongoose from "mongoose";
async function processCartItemsAndClearCart(poductInCart) {
    const session = await mongoose.startSession();
    let orderProducts;
    try {
        await session.withTransaction(async () => {
            // Validate stock for all items first
            for (const item of poductInCart.products) {
                const product = item.productId;
                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for product: ${product.productName}`);
                }
            }
            // Deep clone the products array for order creation
            orderProducts = poductInCart.products.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity
            }));
            // Decrement stock
            for (const item of poductInCart.products) {
                const product = item.productId;
                product.stock -= item.quantity;
                await product.save({ session });
            }
            // Clear cart
            poductInCart.products = [];
            await poductInCart.save({ session });
        });
    } finally {
        session.endSession();
    }
    return orderProducts;
}

const toRegex = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

const formatOrderStatus = (status) => {
    const labelMap = {
        pending: "Pending",
        confirmed: "Confirmed",
        packed: "Packed",
        shipped: "Shipped",
        out_for_delivery: "Out For Delivery",
        delivered: "Delivered",
        cancelled: "Cancelled",
    };

    return labelMap[status] || "Pending";
};

const formatRefundStatus = (status) => {
    const labelMap = {
        none: "Not Requested",
        requested: "Refund Requested",
        approved: "Refund Approved",
        pickup_completed: "Pickup Completed",
        initiated: "Refund Initiated",
        processed: "Refund Processed",
        rejected: "Refund Rejected",
    };

    return labelMap[status] || "Not Requested";
};

const getAdminOwnedProductIds = async (adminId) => {
    if (!adminId) {
        return [];
    }

    const products = await ProductModel.find({ createdBy: adminId }).select("_id").lean();
    return products.map((product) => product._id);
};

const getAdminOwnedProductIdSet = (productIds) => {
    return new Set((Array.isArray(productIds) ? productIds : []).map((id) => String(id)));
};

const formatOrderForAdmin = (orderDoc) => {
    const firstProduct = orderDoc?.products?.[0]?.productId;
    const productName = firstProduct?.productName || "Product unavailable";
    const hasMultipleProducts = (orderDoc?.products?.length || 0) > 1;
    const displayProduct = hasMultipleProducts
        ? `${productName} +${orderDoc.products.length - 1} more`
        : productName;

    return {
        id: orderDoc?._id,
        orderId: `#${String(orderDoc?._id || "").slice(-8).toUpperCase()}`,
        product: displayProduct,
        date: new Date(orderDoc.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }),
        price: `Rs ${Number(orderDoc.totalAmount || 0).toLocaleString("en-IN")}`,
        payment: orderDoc.paymentStatus === "completed" ? "Paid" : "Unpaid",
        status: formatOrderStatus(orderDoc.status),
        rawStatus: orderDoc.status,
        refundStatus: formatRefundStatus(orderDoc.refundStatus),
        rawRefundStatus: orderDoc.refundStatus || "none",
        refundAmount: Number(orderDoc.refundAmount || 0),
        refundReason: orderDoc.refundReason || "",
        image: firstProduct?.images?.[0] || "",
        customer: {
            id: orderDoc?.userId?._id || "",
            name: orderDoc?.userId?.name || "",
            email: orderDoc?.userId?.email || "",
            mobile: orderDoc?.userId?.mobile || null,
        },
        createdAt: orderDoc.createdAt,
    };
};

const getPercentageChange = (current, previous) => {
    if (!previous) {
        return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
};

const formatChange = (current, previous, options = {}) => {
    const { invertPositiveColor = false } = options;
    const percentage = getPercentageChange(current, previous);
    const safePercentage = Number.isFinite(percentage) ? percentage : 0;
    const direction = safePercentage >= 0 ? "up" : "down";
    const isPositive = direction === "up";
    const changeColor = invertPositiveColor
        ? (isPositive ? "#EF4444" : "#4EA674")
        : (isPositive ? "#4EA674" : "#EF4444");

    return {
        change: `${safePercentage >= 0 ? "+" : ""}${safePercentage.toFixed(1)}%`,
        changeDirection: direction,
        changeColor,
    };
};

export const getAdminOrderCustomerLookup = async (req, res) => {
    try {
        const adminId = req.userId;
        const ownedProductIds = await getAdminOwnedProductIds(adminId);
        if (!ownedProductIds.length) {
            return res.status(200).json({
                message: "Customers fetched successfully",
                error: false,
                success: true,
                data: [],
            });
        }

        const relatedCustomerIds = await OrderModel.distinct("userId", {
            "products.productId": { $in: ownedProductIds },
        });

        const q = String(req.query?.q || "").trim();
        const query = { role: "user", _id: { $in: relatedCustomerIds } };

        if (q) {
            const regex = toRegex(q);
            query.$or = [
                { name: regex },
                { email: regex },
            ];

            const numericMobile = Number(q);
            if (Number.isFinite(numericMobile)) {
                query.$or.push({ mobile: numericMobile });
            }
        }

        const customers = await UserModel.find(query)
            .select("name email mobile")
            .sort({ createdAt: -1 })
            .limit(20);

        const data = customers.map((customer) => ({
            id: customer._id,
            name: customer.name || "",
            email: customer.email || "",
            mobile: customer.mobile || "",
        }));

        return res.status(200).json({
            message: "Customers fetched successfully",
            error: false,
            success: true,
            data,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching customer lookup: " + error.message,
            error: true,
            success: false,
        });
    }
};

export const getAdminOrderProductLookup = async (req, res) => {
    try {
        const adminId = req.userId;
        const q = String(req.query?.q || "").trim();
        const query = q
            ? {
                createdBy: adminId,
                $or: [
                    { productName: toRegex(q) },
                    mongoose.Types.ObjectId.isValid(q) ? { _id: new mongoose.Types.ObjectId(q) } : null,
                ].filter(Boolean),
            }
            : { createdBy: adminId };

        const products = await ProductModel.find(query)
            .select("productName price stock images")
            .sort({ createdAt: -1 })
            .limit(20);

        const data = products.map((product) => ({
            id: product._id,
            productName: product.productName || "",
            price: Number(product.price || 0),
            stock: Number(product.stock || 0),
            image: product.images?.[0] || "",
        }));

        return res.status(200).json({
            message: "Products fetched successfully",
            error: false,
            success: true,
            data,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching product lookup: " + error.message,
            error: true,
            success: false,
        });
    }
};

export const getAdminOrderAddressLookup = async (req, res) => {
    try {
        const adminId = req.userId;
        const ownedProductIds = await getAdminOwnedProductIds(adminId);
        const userId = String(req.query?.userId || "").trim();

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Valid userId is required",
                error: true,
                success: false,
            });
        }

        if (!ownedProductIds.length) {
            return res.status(200).json({
                message: "Addresses fetched successfully",
                error: false,
                success: true,
                data: [],
            });
        }

        const relatedOrderCount = await OrderModel.countDocuments({
            userId,
            "products.productId": { $in: ownedProductIds },
        });

        if (!relatedOrderCount) {
            return res.status(403).json({
                message: "You can only access addresses of customers related to your products",
                error: true,
                success: false,
            });
        }

        const addresses = await AddressModel.find({ userId })
            .select("address_line1 city state pincode country landmark addressType")
            .sort({ createdAt: -1 })
            .limit(20);

        const data = addresses.map((address) => ({
            id: address._id,
            label: `${address.address_line1 || ""}, ${address.city || ""}, ${address.state || ""} ${address.pincode || ""}`.trim(),
            addressType: address.addressType || "",
        }));

        return res.status(200).json({
            message: "Addresses fetched successfully",
            error: false,
            success: true,
            data,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching address lookup: " + error.message,
            error: true,
            success: false,
        });
    }
};

export const createOrderByAdmin = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const adminId = req.userId;
        const {
            userId,
            delivery_address,
            products,
            paymentMethod = "COD",
            paymentStatus = "pending",
            status = "pending",
            paymentId = null,
        } = req.body;

        if (!userId || !delivery_address || !Array.isArray(products) || !products.length) {
            return res.status(400).json({
                message: "userId, delivery_address and products are required",
                error: true,
                success: false,
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(delivery_address)) {
            return res.status(400).json({
                message: "Invalid userId or delivery_address",
                error: true,
                success: false,
            });
        }

        const allowedStatuses = ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];
        const allowedPaymentMethods = ["COD", "Razorpay"];
        const allowedPaymentStatuses = ["pending", "completed", "failed"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status",
                error: true,
                success: false,
            });
        }

        if (!allowedPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({
                message: "Invalid payment method",
                error: true,
                success: false,
            });
        }

        if (!allowedPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({
                message: "Invalid payment status",
                error: true,
                success: false,
            });
        }

        const sanitizedProducts = products
            .map((item) => ({
                productId: String(item?.productId || "").trim(),
                quantity: Number(item?.quantity || 0),
            }))
            .filter((item) => item.productId && Number.isFinite(item.quantity) && item.quantity > 0);

        if (!sanitizedProducts.length) {
            return res.status(400).json({
                message: "At least one valid product with quantity is required",
                error: true,
                success: false,
            });
        }

        const invalidProductId = sanitizedProducts.find((item) => !mongoose.Types.ObjectId.isValid(item.productId));
        if (invalidProductId) {
            return res.status(400).json({
                message: "One or more product IDs are invalid",
                error: true,
                success: false,
            });
        }

        const [user, address] = await Promise.all([
            UserModel.findById(userId),
            AddressModel.findOne({ _id: delivery_address, userId }),
        ]);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false,
            });
        }

        if (!address) {
            return res.status(404).json({
                message: "Delivery address not found for this user",
                error: true,
                success: false,
            });
        }

        const productIds = sanitizedProducts.map((item) => new mongoose.Types.ObjectId(item.productId));
        const quantityMap = new Map(sanitizedProducts.map((item) => [item.productId, item.quantity]));

        let createdOrderDoc = null;

        await session.withTransaction(async () => {
            const productDocs = await ProductModel.find({ _id: { $in: productIds }, createdBy: adminId }).session(session);
            const productMap = new Map(productDocs.map((product) => [String(product._id), product]));

            if (productDocs.length !== productIds.length) {
                throw new Error("One or more products were not found or do not belong to this admin");
            }

            const orderProducts = [];
            let totalAmount = 0;

            for (const item of sanitizedProducts) {
                const productDoc = productMap.get(item.productId);
                const quantity = quantityMap.get(item.productId) || 0;

                if (!productDoc || quantity <= 0) {
                    throw new Error("Invalid product payload");
                }

                if (status !== "cancelled" && productDoc.stock < quantity) {
                    throw new Error(`Insufficient stock for product: ${productDoc.productName}`);
                }

                if (status !== "cancelled") {
                    productDoc.stock -= quantity;
                }

                if (status === "delivered") {
                    productDoc.sales += quantity;
                }

                await productDoc.save({ session });

                totalAmount += Number(productDoc.price || 0) * quantity;
                orderProducts.push({
                    productId: productDoc._id,
                    quantity,
                });
            }

            const created = await OrderModel.create([
                {
                    userId,
                    products: orderProducts,
                    delivery_address,
                    totalAmount,
                    paymentMethod,
                    paymentStatus,
                    paymentId,
                    status,
                },
            ], { session });

            createdOrderDoc = created[0];
        });

        const order = await OrderModel.findById(createdOrderDoc._id)
            .populate("userId")
            .populate("products.productId")
            .populate("delivery_address");

        return res.status(201).json({
            message: "Order created successfully by admin",
            error: false,
            success: true,
            order: order ? formatOrderForAdmin(order) : null,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error creating order by admin: " + error.message,
            error: true,
            success: false,
        });
    } finally {
        session.endSession();
    }
};

export const createOrderWithCOD = async (req, res) => {
    try {
        const userId = req.userId;
        const { delivery_address } = req.body;

        if (!delivery_address) {
            return res.status(400).json({
                message: "Delivery address is required",
                error: true,
                success: false
            });
        }

        const poductInCart = await CartModel.findOne({ userId }).populate("products.productId");

        if (!poductInCart) {
            return res.status(404).json({
                message: "Product not found in cart",
                error: true,
                success: false
            });
        }

        const sutotalAmount = poductInCart.products.reduce((total, product) => {
            return total + (product.productId.price * product.quantity);
        }, 0);


        // Validate, decrement stock, and clear cart, and get order products
        let orderProducts;
        try {
            orderProducts = await processCartItemsAndClearCart(poductInCart);
        } catch (err) {
            return res.status(400).json({
                message: err.message,
                error: true,
                success: false
            });
        }

        const order = new OrderModel({
            userId,
            products: orderProducts,
            delivery_address,
            totalAmount: sutotalAmount
        });
        await order.save();

        return res.status(201).json({
            message: "Order created successfully",
            error: false,
            success: true,
            order
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error creating order: " + error.message,
            error: true,
            success: false
        })
    }
}

export const createOrderWithRazorpay = async (req, res) => {
    try {
        const userId = req.userId;
        const { paymentId, delivery_address } = req.body;

        if (!paymentId || !delivery_address) {
            return res.status(400).json({
                message: "paymentId and delivery_address are required",
                error: true,
                success: false,
            });
        }

        const poductInCart = await CartModel.findOne({ userId }).populate("products.productId");

        if (!poductInCart || !Array.isArray(poductInCart.products) || !poductInCart.products.length) {
            return res.status(400).json({
                message: "Cart is empty",
                error: true,
                success: false,
            });
        }

        const sutotalAmount = poductInCart.products.reduce((total, product) => {
            return total + (Number(product?.productId?.price || 0) * Number(product?.quantity || 0));
        }, 0);

        let paymentVerified = false;
        let paymentStatusFetched = "pending";

        try {
            const fetchedPayment = await razorpay.payments.fetch(paymentId);
            paymentStatusFetched = fetchedPayment?.status || "pending";
            paymentVerified = ["captured", "authorized"].includes(paymentStatusFetched);
        } catch {
            paymentVerified = false;
        }

        if (!paymentVerified) {
            return res.status(400).json({
                message: `Payment not verified. Razorpay status: ${paymentStatusFetched}`,
                error: true,
                success: false
            });
        }


        // Validate, decrement stock, and clear cart, and get order products
        let orderProducts;
        try {
            orderProducts = await processCartItemsAndClearCart(poductInCart);
        } catch (err) {
            return res.status(400).json({
                message: err.message,
                error: true,
                success: false
            });
        }

        const order = new OrderModel({
            userId,
            products: orderProducts,
            delivery_address,
            totalAmount: sutotalAmount,
            paymentMethod: "Razorpay",
            paymentId,
            paymentStatus: paymentStatusFetched === "captured" ? "completed" : "pending"
        });
        await order.save();

        return res.status(201).json({
            message: "Order created successfully",
            error: false,
            success: true,
            order
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error creating order with Razorpay: " + error.message,
            error: true,
            success: false
        })
    }
}

export const getUserOrders = async (req, res) => {
    try {
        const userId = req.userId;

        const orders = await OrderModel.find({ userId }).populate("products.productId").populate("delivery_address").sort({ createdAt: -1 });

        if (!orders || orders.length === 0) {
            return res.status(404).json({
                message: "No orders found for this user",
                error: true,
                success: false
            });
        }

        return res.status(200).json({
            message: "Orders fetched successfully",
            error: false,
            success: true,
            orders
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error fetching user orders: " + error.message,
            error: true,
            success: false
        })
    }
}

export const getAllOrders = async (req, res) => {
    try {
        const adminId = req.userId;
        const ownedProductIds = await getAdminOwnedProductIds(adminId);
        const ownedProductIdSet = getAdminOwnedProductIdSet(ownedProductIds);
        let { page = 1, limit = 20 } = req.query;
        const search = String(req.query?.search || "").trim();
        const status = String(req.query?.status || "").trim().toLowerCase();
        const payment = String(req.query?.payment || "").trim().toLowerCase();
        const customerId = String(req.query?.customerId || "").trim();
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 20;
        const MAX_LIMIT = 100;
        if (limit > MAX_LIMIT) limit = MAX_LIMIT;
        const skip = (page - 1) * limit;

        if (!ownedProductIds.length) {
            return res.status(200).json({
                message: "No orders found",
                error: false,
                success: true,
                orders: [],
                total: 0,
                totalPages: 1,
                page,
                limit,
            });
        }

        const andFilters = [];
        andFilters.push({ "products.productId": { $in: ownedProductIds } });

        if (customerId) {
            andFilters.push({ userId: customerId });
        }

        if (status && status !== "all") {
            andFilters.push({ status });
        }

        if (payment && payment !== "all") {
            if (payment === "paid") {
                andFilters.push({ paymentStatus: "completed" });
            } else if (payment === "unpaid") {
                andFilters.push({ paymentStatus: { $in: ["pending", "failed"] } });
            }
        }

        if (search) {
            const searchRegex = toRegex(search);
            const searchOr = [];
            const normalizedOrderIdSearch = search.replace(/^#/, "").trim();
            const escapedOrderIdSearch = normalizedOrderIdSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            if (normalizedOrderIdSearch) {
                searchOr.push({
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$_id" },
                            regex: escapedOrderIdSearch,
                            options: "i",
                        },
                    },
                });
            }

            if (mongoose.Types.ObjectId.isValid(normalizedOrderIdSearch)) {
                searchOr.push({ _id: new mongoose.Types.ObjectId(normalizedOrderIdSearch) });
            }

            const [matchedUsers, matchedProducts] = await Promise.all([
                UserModel.find({
                    $or: [
                        { name: searchRegex },
                        { email: searchRegex },
                    ],
                }).select("_id"),
                ProductModel.find({ productName: searchRegex, createdBy: adminId }).select("_id"),
            ]);

            const numericMobile = Number(search);
            let mobileMatchedUsers = [];
            if (Number.isFinite(numericMobile)) {
                mobileMatchedUsers = await UserModel.find({ mobile: numericMobile }).select("_id");
            }

            const userIds = [...new Set([...matchedUsers, ...mobileMatchedUsers].map((user) => String(user._id)))];
            const productIds = [...new Set(matchedProducts.map((product) => String(product._id)))];

            if (userIds.length) {
                searchOr.push({ userId: { $in: userIds } });
            }

            if (productIds.length) {
                searchOr.push({ "products.productId": { $in: productIds } });
            }

            if (!searchOr.length) {
                return res.status(200).json({
                    message: "No orders found",
                    error: false,
                    success: true,
                    orders: [],
                    total: 0,
                    totalPages: 1,
                    page,
                    limit,
                });
            }

            andFilters.push({ $or: searchOr });
        }

        const query = andFilters.length ? { $and: andFilters } : {};

        const orders = await OrderModel.find(query)
            .populate("userId")
            .populate("products.productId")
            .populate("delivery_address")
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limit);

        const total = await OrderModel.countDocuments(query);

        if (!orders || orders.length === 0) {
            return res.status(200).json({
                message: "No orders found",
                error: false,
                success: true,
                orders: [],
                total: 0,
                totalPages: 1,
                page,
                limit
            });
        }

        const formattedOrders = orders.map((order) => {
            const ownItems = Array.isArray(order.products)
                ? order.products.filter((item) => ownedProductIdSet.has(String(item?.productId?._id || item?.productId)))
                : [];

            const ownTotalAmount = ownItems.reduce((accumulator, item) => {
                return accumulator + (Number(item?.productId?.price || 0) * Number(item?.quantity || 0));
            }, 0);

            const displayOrder = {
                ...order.toObject(),
                products: ownItems,
                totalAmount: ownTotalAmount,
            };

            return formatOrderForAdmin(displayOrder);
        });
        const totalPages = Math.max(1, Math.ceil(total / limit));

        return res.status(200).json({
            message: "All orders fetched successfully",
            error: false,
            success: true,
            orders: formattedOrders,
            total,
            totalPages,
            page,
            limit
        });


    } catch (error) {
        return res.status(500).json({
            message: "Error fetching all orders: " + error.message,
            error: true,
            success: false
        })
    }
}

export const getOrderSummary = async (req, res) => {
    try {
        const adminId = req.userId;
        const ownedProductIds = await getAdminOwnedProductIds(adminId);
        if (!ownedProductIds.length) {
            return res.status(200).json({
                message: "Order summary fetched successfully",
                error: false,
                success: true,
                data: {
                    summaryCards: [
                        { title: "Total Orders", value: "0", change: "0.0%", changeDirection: "up", changeColor: "#4EA674" },
                        { title: "New Orders", value: "0", change: "0.0%", changeDirection: "up", changeColor: "#4EA674" },
                        { title: "Completed Orders", value: "0", change: "0.0%", changeDirection: "up", changeColor: "#4EA674" },
                        { title: "Canceled Orders", value: "0", change: "0.0%", changeDirection: "up", changeColor: "#EF4444" },
                    ],
                    tabs: [
                        { label: "All order", count: 0 },
                        { label: "Pending", count: 0 },
                        { label: "Confirmed", count: 0 },
                        { label: "Packed", count: 0 },
                        { label: "Shipped", count: 0 },
                        { label: "Out For Delivery", count: 0 },
                        { label: "Delivered", count: 0 },
                        { label: "Cancelled", count: 0 },
                    ],
                    period: "7days",
                    periodLabel: "Last 7 days",
                    selectedYear: new Date().getFullYear(),
                    selectedMonth: new Date().getMonth() + 1,
                    availableYears: [new Date().getFullYear()],
                    availableMonths: [new Date().getMonth() + 1],
                },
            });
        }

        const orderScope = { "products.productId": { $in: ownedProductIds } };
        const period = ["7days", "daywise", "month"].includes(String(req.query?.period || "").trim())
            ? String(req.query.period).trim()
            : "7days";

        const now = new Date();
        const currentYear = now.getFullYear();
        const queryYear = Number(req.query?.year);
        const queryMonth = Number(req.query?.month);

        const selectedYear = Number.isInteger(queryYear) ? queryYear : currentYear;
        const selectedMonth = Number.isInteger(queryMonth) && queryMonth >= 1 && queryMonth <= 12
            ? queryMonth
            : (now.getMonth() + 1);

        let currentWindowStart;
        let currentWindowEnd;
        let previousWindowStart;
        let previousWindowEnd;
        let periodLabel = "Last 7 days";

        if (period === "month") {
            currentWindowStart = new Date(selectedYear, 0, 1);
            currentWindowEnd = new Date(selectedYear + 1, 0, 1);
            previousWindowStart = new Date(selectedYear - 1, 0, 1);
            previousWindowEnd = new Date(selectedYear, 0, 1);
            periodLabel = `${selectedYear} (Year-wise)`;
        } else if (period === "daywise") {
            currentWindowStart = new Date(selectedYear, selectedMonth - 1, 1);
            currentWindowEnd = new Date(selectedYear, selectedMonth, 1);
            previousWindowStart = new Date(selectedYear, selectedMonth - 2, 1);
            previousWindowEnd = new Date(selectedYear, selectedMonth - 1, 1);
            const monthLabel = currentWindowStart.toLocaleString("en-IN", { month: "short" });
            periodLabel = `${monthLabel} ${selectedYear} (Month-wise)`;
        } else {
            currentWindowEnd = now;
            currentWindowStart = new Date(now);
            currentWindowStart.setDate(currentWindowStart.getDate() - 7);
            previousWindowEnd = new Date(currentWindowStart);
            previousWindowStart = new Date(currentWindowStart);
            previousWindowStart.setDate(previousWindowStart.getDate() - 7);
        }

        const [
            availableYearsAgg,
            availableMonthsAgg,
            totalOrders,
            confirmedTotal,
            packedTotal,
            shippedTotal,
            outForDeliveryTotal,
            deliveredTotal,
            pendingTotal,
            cancelledTotal,
            currentPeriodTotal,
            previousPeriodTotal,
            currentPeriodCompleted,
            previousPeriodCompleted,
            currentPeriodCancelled,
            previousPeriodCancelled,
        ] = await Promise.all([
            OrderModel.aggregate([
                {
                    $match: orderScope,
                },
                {
                    $group: {
                        _id: { $year: "$createdAt" },
                    },
                },
                {
                    $sort: { _id: 1 },
                },
            ]),
            OrderModel.aggregate([
                {
                    $match: {
                        ...orderScope,
                        createdAt: {
                            $gte: new Date(selectedYear, 0, 1),
                            $lt: new Date(selectedYear + 1, 0, 1),
                        },
                    },
                },
                {
                    $group: {
                        _id: { $month: "$createdAt" },
                    },
                },
                {
                    $sort: { _id: 1 },
                },
            ]),
            OrderModel.countDocuments(orderScope),
            OrderModel.countDocuments({ ...orderScope, status: "confirmed" }),
            OrderModel.countDocuments({ ...orderScope, status: "packed" }),
            OrderModel.countDocuments({ ...orderScope, status: "shipped" }),
            OrderModel.countDocuments({ ...orderScope, status: "out_for_delivery" }),
            OrderModel.countDocuments({ ...orderScope, status: "delivered" }),
            OrderModel.countDocuments({ ...orderScope, status: "pending" }),
            OrderModel.countDocuments({ ...orderScope, status: "cancelled" }),
            OrderModel.countDocuments({ ...orderScope, createdAt: { $gte: currentWindowStart, $lt: currentWindowEnd } }),
            OrderModel.countDocuments({ ...orderScope, createdAt: { $gte: previousWindowStart, $lt: previousWindowEnd } }),
            OrderModel.countDocuments({ ...orderScope, status: "delivered", createdAt: { $gte: currentWindowStart, $lt: currentWindowEnd } }),
            OrderModel.countDocuments({ ...orderScope, status: "delivered", createdAt: { $gte: previousWindowStart, $lt: previousWindowEnd } }),
            OrderModel.countDocuments({ ...orderScope, status: "cancelled", createdAt: { $gte: currentWindowStart, $lt: currentWindowEnd } }),
            OrderModel.countDocuments({ ...orderScope, status: "cancelled", createdAt: { $gte: previousWindowStart, $lt: previousWindowEnd } }),
        ]);

        const availableYears = availableYearsAgg
            .map((item) => Number(item?._id))
            .filter((year) => Number.isInteger(year));

        const availableMonths = availableMonthsAgg
            .map((item) => Number(item?._id))
            .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12);

        const summaryCards = [
            {
                title: "Total Orders",
                value: Number(totalOrders || 0).toLocaleString("en-IN"),
                ...formatChange(currentPeriodTotal, previousPeriodTotal),
            },
            {
                title: "New Orders",
                value: Number(currentPeriodTotal || 0).toLocaleString("en-IN"),
                ...formatChange(currentPeriodTotal, previousPeriodTotal),
            },
            {
                title: "Completed Orders",
                value: Number(currentPeriodCompleted || 0).toLocaleString("en-IN"),
                ...formatChange(currentPeriodCompleted, previousPeriodCompleted),
            },
            {
                title: "Canceled Orders",
                value: Number(currentPeriodCancelled || 0).toLocaleString("en-IN"),
                ...formatChange(currentPeriodCancelled, previousPeriodCancelled, { invertPositiveColor: true }),
            },
        ];

        const tabs = [
            { label: "All order", count: totalOrders },
            { label: "Pending", count: pendingTotal },
            { label: "Confirmed", count: confirmedTotal },
            { label: "Packed", count: packedTotal },
            { label: "Shipped", count: shippedTotal },
            { label: "Out For Delivery", count: outForDeliveryTotal },
            { label: "Delivered", count: deliveredTotal },
            { label: "Cancelled", count: cancelledTotal },
        ];

        return res.status(200).json({
            message: "Order summary fetched successfully",
            error: false,
            success: true,
            data: {
                summaryCards,
                tabs,
                period,
                periodLabel,
                selectedYear,
                selectedMonth,
                availableYears,
                availableMonths,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching order summary: " + error.message,
            error: true,
            success: false,
        });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const adminId = req.userId;
        const ownedProductIds = await getAdminOwnedProductIds(adminId);
        const ownedProductIdSet = getAdminOwnedProductIdSet(ownedProductIds);
        const { orderId } = req.params;
        const { status } = req.body;
        if (!orderId || !status) {
            return res.status(400).json({
                message: "Order ID and status are required",
                error: true,
                success: false
            });
        }

        const statusOptions = ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];
        if (!statusOptions.includes(status)) {
            return res.status(400).json({
                message: "Invalid status value",
                error: true,
                success: false
            });
        }

        // Fetch the existing order to get previous status
        const existingOrder = await OrderModel.findById(orderId);
        if (!existingOrder) {
            return res.status(404).json({
                message: "Order not found",
                error: true,
                success: false
            });
        }

        const hasOwnedProductInOrder = Array.isArray(existingOrder.products)
            ? existingOrder.products.some((item) => ownedProductIdSet.has(String(item?.productId)))
            : false;

        if (!hasOwnedProductInOrder) {
            return res.status(403).json({
                message: "You can only update orders related to your products",
                error: true,
                success: false,
            });
        }
        const previousStatus = existingOrder.status;

        const allowedTransitions = {
            pending: ["pending", "confirmed", "cancelled"],
            confirmed: ["confirmed", "packed", "cancelled"],
            packed: ["packed", "shipped", "cancelled"],
            shipped: ["shipped", "out_for_delivery"],
            out_for_delivery: ["out_for_delivery", "delivered"],
            delivered: ["delivered"],
            cancelled: ["cancelled"],
        };

        // Only update if status is actually changing
        if (previousStatus === status) {
            return res.status(200).json({
                message: "Order status is already set to the requested value.",
                error: false,
                success: true,
                order: existingOrder
            });
        }

        if (!allowedTransitions[previousStatus]?.includes(status)) {
            return res.status(400).json({
                message: `Invalid status transition from ${previousStatus} to ${status}`,
                error: true,
                success: false
            });
        }

        // Update the order status
        const updatedStatus = await OrderModel.findByIdAndUpdate(orderId, { status }, { new: true });

        // Only apply side-effects if status is changing to cancelled or delivered
        if (status === "cancelled" && previousStatus !== "cancelled") {
            for (const item of updatedStatus.products) {
                if (!ownedProductIdSet.has(String(item.productId))) {
                    continue;
                }

                const product = await ProductModel.findById(item.productId);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
        }

        if (status === "delivered" && previousStatus !== "delivered") {
            for (const item of updatedStatus.products) {
                if (!ownedProductIdSet.has(String(item.productId))) {
                    continue;
                }

                const product = await ProductModel.findById(item.productId);
                if (product) {
                    product.sales += item.quantity;
                    await product.save();
                }
            }
        }

        return res.status(200).json({
            message: "Order status updated successfully",
            error: false,
            success: true,
            order: updatedStatus
        });



    } catch (error) {
        return res.status(500).json({
            message: "Error updating order status: " + error.message,
            error: true,
            success: false
        })
    }
}

export const updateOrderRefundStatus = async (req, res) => {
    try {
        const adminId = req.userId;
        const ownedProductIds = await getAdminOwnedProductIds(adminId);
        const ownedProductIdSet = getAdminOwnedProductIdSet(ownedProductIds);
        const { orderId } = req.params;
        const { refundStatus, refundReason = "" } = req.body;

        if (!orderId || !refundStatus) {
            return res.status(400).json({
                message: "Order ID and refundStatus are required",
                error: true,
                success: false,
            });
        }

        const allowedRefundStatuses = ["none", "requested", "approved", "pickup_completed", "initiated", "processed", "rejected"];
        if (!allowedRefundStatuses.includes(refundStatus)) {
            return res.status(400).json({
                message: "Invalid refund status value",
                error: true,
                success: false,
            });
        }

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                error: true,
                success: false,
            });
        }

        const hasOwnedProductInOrder = Array.isArray(order.products)
            ? order.products.some((item) => ownedProductIdSet.has(String(item?.productId)))
            : false;

        if (!hasOwnedProductInOrder) {
            return res.status(403).json({
                message: "You can only update refunds for orders related to your products",
                error: true,
                success: false,
            });
        }

        if (order.paymentStatus !== "completed") {
            return res.status(400).json({
                message: "Refund is allowed only for paid orders",
                error: true,
                success: false,
            });
        }

        const previousRefundStatus = order.refundStatus || "none";

        const refundFlowByOrderStatus = {
            delivered: {
                none: ["requested"],
                requested: ["approved", "rejected"],
                approved: ["pickup_completed", "rejected"],
                pickup_completed: ["initiated"],
                initiated: ["processed"],
                processed: ["processed"],
                rejected: ["rejected"],
            },
            cancelled: {
                none: ["initiated"],
                initiated: ["processed"],
                processed: ["processed"],
                rejected: ["rejected"],
            },
        };

        const statusFlow = refundFlowByOrderStatus[order.status];
        if (!statusFlow) {
            return res.status(400).json({
                message: "Refund flow is allowed only for delivered/cancelled orders",
                error: true,
                success: false,
            });
        }

        const allowedNextRefundStatuses = statusFlow[previousRefundStatus] || [];
        if (previousRefundStatus !== refundStatus && !allowedNextRefundStatuses.includes(refundStatus)) {
            return res.status(400).json({
                message: `Invalid refund transition from ${previousRefundStatus} to ${refundStatus}`,
                error: true,
                success: false,
            });
        }

        const shouldRestockOnPickup = order.status === "delivered"
            && previousRefundStatus !== "pickup_completed"
            && refundStatus === "pickup_completed";

        if (shouldRestockOnPickup) {
            for (const item of order.products) {
                if (!ownedProductIdSet.has(String(item.productId))) {
                    continue;
                }

                const product = await ProductModel.findById(item.productId);
                if (product) {
                    product.stock += item.quantity;
                    product.sales = Math.max(0, Number(product.sales || 0) - item.quantity);
                    await product.save();
                }
            }
        }

        if (previousRefundStatus === refundStatus) {
            return res.status(200).json({
                message: "Refund status is already set to the requested value.",
                error: false,
                success: true,
                order,
            });
        }

        order.refundStatus = refundStatus;
        order.refundReason = String(refundReason || "").trim();
        if (refundStatus === "requested" && !order.refundRequestedAt) {
            order.refundRequestedAt = new Date();
        }
        if (refundStatus === "processed") {
            order.refundProcessedAt = new Date();
            order.refundAmount = Number(order.totalAmount || 0);
        }

        await order.save();

        return res.status(200).json({
            message: "Order refund status updated successfully",
            error: false,
            success: true,
            order,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error updating order refund status: " + error.message,
            error: true,
            success: false,
        });
    }
};