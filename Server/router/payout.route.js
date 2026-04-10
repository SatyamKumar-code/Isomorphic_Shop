import { Router } from "express";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import { getSellerPayoutByIdController, updateSellerPaidAmountController } from "../controller/payout.controller.js";

const payoutRouter = Router();

payoutRouter.get("/admin/seller/:sellerId", adminMiddleware, getSellerPayoutByIdController);
payoutRouter.put("/admin/seller/:sellerId/paid", adminMiddleware, updateSellerPaidAmountController);

export default payoutRouter;
