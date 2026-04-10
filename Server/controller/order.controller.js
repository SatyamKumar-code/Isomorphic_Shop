import express from "express";
import CartModel from "../models/cart.model.js";
import OrderModel from "../models/order.model.js";
import ProductModel from "../models/product.model.js";
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
        const { delivery_address, paymentId, paymentStatus } = req.body;

        if (!delivery_address || !paymentId) {
            return res.status(400).json({
                message: "Delivery address and paymentId are required",
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

        // Verify payment status with Razorpay
        let paymentVerified = false;
        let paymentStatusFetched = null;
        try {
            const payment = await razorpay.payments.fetch(paymentId);
            paymentStatusFetched = payment.status;
            if (payment.status === "captured") {
                paymentVerified = true;
            }
        } catch (err) {
            return res.status(400).json({
                message: "Payment verification failed: " + (err.error?.description || err.message),
                error: true,
                success: false
            });
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
            paymentStatus: paymentStatusFetched
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
        // Pagination parameters
        let { page = 1, limit = 20 } = req.query;
        const customerId = String(req.query?.customerId || "").trim();
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 20;
        const MAX_LIMIT = 100;
        if (limit > MAX_LIMIT) limit = MAX_LIMIT;
        const skip = (page - 1) * limit;

        const query = {};
        if (customerId) {
            query.userId = customerId;
        }

        // Query for paginated orders
        const orders = await OrderModel.find(query)
            .populate("userId")
            .populate("products.productId")
            .populate("delivery_address")
            .sort({ createdAt: -1 })
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
                page,
                limit
            });
        }

        return res.status(200).json({
            message: "All orders fetched successfully",
            error: false,
            success: true,
            orders,
            total,
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

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        if (!orderId || !status) {
            return res.status(400).json({
                message: "Order ID and status are required",
                error: true,
                success: false
            });
        }

        const statusOptions = ["pending", "shipped", "delivered", "cancelled"];
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
        const previousStatus = existingOrder.status;

        // Only update if status is actually changing
        if (previousStatus === status) {
            return res.status(200).json({
                message: "Order status is already set to the requested value.",
                error: false,
                success: true,
                order: existingOrder
            });
        }

        // Update the order status
        const updatedStatus = await OrderModel.findByIdAndUpdate(orderId, { status }, { new: true });

        // Only apply side-effects if status is changing to cancelled or delivered
        if (status === "cancelled" && previousStatus !== "cancelled") {
            for (const item of updatedStatus.products) {
                const product = await ProductModel.findById(item.productId);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
        }

        if (status === "delivered" && previousStatus !== "delivered") {
            for (const item of updatedStatus.products) {
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