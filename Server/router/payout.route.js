import { Router } from "express";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import {
    getSellerOrderPayoutRowsController,
    getSellerPayoutByIdController,
    getSellerPayoutDashboardController,
    getSellerPayoutHistoryController,
    updateSellerPaidAmountController,
    getSellerPeriodAnalyticsController,
    getSellerPayoutPreviewController,
    getPayoutSettingsController,
    updatePayoutSettingsController,
} from "../controller/payout.controller.js";

const payoutRouter = Router();

payoutRouter.get("/dashboard", adminMiddleware, getSellerPayoutDashboardController);
payoutRouter.get("/orders", adminMiddleware, getSellerOrderPayoutRowsController);
payoutRouter.get("/history", adminMiddleware, getSellerPayoutHistoryController);
payoutRouter.get("/preview", adminMiddleware, getSellerPayoutPreviewController);
payoutRouter.get("/analytics", adminMiddleware, getSellerPeriodAnalyticsController);
payoutRouter.get("/admin/settings", adminMiddleware, getPayoutSettingsController);
payoutRouter.put("/admin/settings", adminMiddleware, updatePayoutSettingsController);
payoutRouter.get("/admin/seller/:sellerId", adminMiddleware, getSellerPayoutByIdController);
payoutRouter.put("/admin/seller/:sellerId/paid", adminMiddleware, updateSellerPaidAmountController);

export default payoutRouter;
