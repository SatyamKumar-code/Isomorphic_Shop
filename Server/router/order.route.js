
import express from "express";
import {
	createOrderWithCOD,
	createOrderWithRazorpay,
	initializeRazorpayPayment,
	getUserOrders,
	getAllOrders,
	getOrderSummary,
	createOrderByAdmin,
	getAdminOrderCustomerLookup,
	getAdminOrderProductLookup,
	getAdminOrderAddressLookup,
	updateOrderStatus,
	updateOrderRefundStatus,
	cancelOrderBeforeDelivery,
	initiateReturn,
	getReturnStatus,
	getReturnRequests,
	updateReturnStatus
} from "../controller/order.controller.js";
import userMiddleware from "../middlewares/userMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const orderRouter = express.Router();

// User routes
orderRouter.post("/cod", userMiddleware, createOrderWithCOD); // Create order with COD
orderRouter.post("/razorpay/initialize", userMiddleware, initializeRazorpayPayment); // Initialize Razorpay payment
orderRouter.post("/razorpay", userMiddleware, createOrderWithRazorpay); // Create order with Razorpay
orderRouter.get("/my-orders", userMiddleware, getUserOrders); // Get user's own orders
orderRouter.post("/:orderId/cancel", userMiddleware, cancelOrderBeforeDelivery); // Cancel order before delivery
orderRouter.post("/:orderId/return", userMiddleware, initiateReturn); // Initiate return after delivery
orderRouter.get("/:orderId/return-status", userMiddleware, getReturnStatus); // Get return/refund status

// Admin routes
orderRouter.get("/", adminMiddleware, getAllOrders); // Get all orders (paginated)
orderRouter.get("/summary", adminMiddleware, getOrderSummary); // Get order summary cards/tabs
orderRouter.get("/admin/lookups/customers", adminMiddleware, getAdminOrderCustomerLookup); // Customer lookup for admin order form
orderRouter.get("/admin/lookups/products", adminMiddleware, getAdminOrderProductLookup); // Product lookup for admin order form
orderRouter.get("/admin/lookups/addresses", adminMiddleware, getAdminOrderAddressLookup); // Address lookup by user for admin order form
orderRouter.get("/admin/returns", adminMiddleware, getReturnRequests); // Get all return requests
orderRouter.post("/admin/create", adminMiddleware, createOrderByAdmin); // Create order by admin
orderRouter.patch("/status/:orderId", adminMiddleware, updateOrderStatus); // Update order status
orderRouter.patch("/refund/:orderId", adminMiddleware, updateOrderRefundStatus); // Update order refund status
orderRouter.patch("/admin/return/:returnId", adminMiddleware, updateReturnStatus); // Update return status

export default orderRouter;
