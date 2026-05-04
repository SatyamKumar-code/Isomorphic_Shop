import express from "express";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import { getBestSellingProductsController, getTopProductsController, getUserReportController, recordProductViewController, getTransactionsController } from "../controller/dashboard.controller.js";

const dashboardRouter = express.Router();

dashboardRouter.post("/product-view", recordProductViewController);
dashboardRouter.get("/user-report", adminMiddleware, getUserReportController);
dashboardRouter.get("/transactions", adminMiddleware, getTransactionsController);
dashboardRouter.get("/top-products", adminMiddleware, getTopProductsController);
dashboardRouter.get("/best-selling-products", adminMiddleware, getBestSellingProductsController);

export default dashboardRouter;