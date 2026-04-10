
import express from "express";
import {
	createOrderWithCOD,
	createOrderWithRazorpay,
	getUserOrders,
	getAllOrders,
	getOrderSummary,
	createOrderByAdmin,
	getAdminOrderCustomerLookup,
	getAdminOrderProductLookup,
	getAdminOrderAddressLookup,
	updateOrderStatus,
	updateOrderRefundStatus
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
orderRouter.get("/summary", adminMiddleware, getOrderSummary); // Get order summary cards/tabs
orderRouter.get("/admin/lookups/customers", adminMiddleware, getAdminOrderCustomerLookup); // Customer lookup for admin order form
orderRouter.get("/admin/lookups/products", adminMiddleware, getAdminOrderProductLookup); // Product lookup for admin order form
orderRouter.get("/admin/lookups/addresses", adminMiddleware, getAdminOrderAddressLookup); // Address lookup by user for admin order form
orderRouter.post("/admin/create", adminMiddleware, createOrderByAdmin); // Create order by admin
orderRouter.patch("/status/:orderId", adminMiddleware, updateOrderStatus); // Update order status
orderRouter.patch("/refund/:orderId", adminMiddleware, updateOrderRefundStatus); // Update order refund status

export default orderRouter;
