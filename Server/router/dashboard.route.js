import express from "express";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import { getUserReportController, recordProductViewController } from "../controller/dashboard.controller.js";

const dashboardRouter = express.Router();

dashboardRouter.post("/product-view", recordProductViewController);
dashboardRouter.get("/user-report", adminMiddleware, getUserReportController);

export default dashboardRouter;