
import express from "express";
import {
	createOrderWithCOD,
	createOrderWithRazorpay,
	getUserOrders,
	getAllOrders,
	updateOrderStatus
} from "../controller/order.controller.js";
import userMiddleware from "../middlewares/userMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const orderRouter = express.Router();

// User routes
orderRouter.post("/cod", userMiddleware, createOrderWithCOD); // Create order with COD
orderRouter.post("/razorpay", userMiddleware, createOrderWithRazorpay); // Create order with Razorpay
orderRouter.get("/my-orders", userMiddleware, getUserOrders); // Get user's own orders

// Admin routes
orderRouter.get("/", adminMiddleware, getAllOrders); // Get all orders (paginated)
orderRouter.patch("/status/:orderId", adminMiddleware, updateOrderStatus); // Update order status

export default orderRouter;
