import mongoose from "mongoose";
import SellerPayoutModel from "../models/sellerPayout.model.js";
import UserModel from "../models/user.model.js";

const toTwoDecimals = (value) => Number(Number(value || 0).toFixed(2));

export const getSellerPayoutByIdController = async (req, res) => {
    try {
        const { sellerId } = req.params;

        if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({
                message: "Valid sellerId is required",
                error: true,
                success: false,
            });
        }

        const seller = await UserModel.findById(sellerId).select("_id role name email").lean();
        if (!seller || seller.role !== "seller") {
            return res.status(404).json({
                message: "Seller not found",
                error: true,
                success: false,
            });
        }

        const payout = await SellerPayoutModel.findOne({ sellerId })
            .select("sellerId grossSales commissionRate commissionAmount netPayout paidAmount payoutDue currency lastCalculatedAt updatedAt")
            .lean();

        return res.status(200).json({
            message: "Seller payout fetched successfully",
            error: false,
            success: true,
            data: {
                seller: {
                    id: String(seller._id),
                    name: seller.name || "",
                    email: seller.email || "",
                },
                payout: payout || {
                    sellerId: String(seller._id),
                    grossSales: 0,
                    commissionRate: 0,
                    commissionAmount: 0,
                    netPayout: 0,
                    paidAmount: 0,
                    payoutDue: 0,
                    currency: "INR",
                    lastCalculatedAt: null,
                    updatedAt: null,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false,
        });
    }
};

export const updateSellerPaidAmountController = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const action = String(req.body?.action || "add").trim().toLowerCase();
        const amount = Number(req.body?.amount);

        if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({
                message: "Valid sellerId is required",
                error: true,
                success: false,
            });
        }

        if (!["add", "set"].includes(action)) {
            return res.status(400).json({
                message: "action must be add or set",
                error: true,
                success: false,
            });
        }

        if (!Number.isFinite(amount) || amount < 0) {
            return res.status(400).json({
                message: "amount must be a valid non-negative number",
                error: true,
                success: false,
            });
        }

        const seller = await UserModel.findById(sellerId).select("_id role").lean();
        if (!seller || seller.role !== "seller") {
            return res.status(404).json({
                message: "Seller not found",
                error: true,
                success: false,
            });
        }

        let payoutDoc = await SellerPayoutModel.findOne({ sellerId });
        if (!payoutDoc) {
            payoutDoc = await SellerPayoutModel.create({
                sellerId,
                grossSales: 0,
                commissionRate: 0,
                commissionAmount: 0,
                netPayout: 0,
                paidAmount: 0,
                payoutDue: 0,
                currency: "INR",
                lastCalculatedAt: new Date(),
            });
        }

        const currentPaidAmount = Number(payoutDoc.paidAmount || 0);
        const netPayout = Number(payoutDoc.netPayout || 0);
        const nextPaidAmount = action === "set" ? amount : (currentPaidAmount + amount);

        if (nextPaidAmount > netPayout) {
            return res.status(400).json({
                message: "Paid amount cannot exceed net payout",
                error: true,
                success: false,
            });
        }

        payoutDoc.paidAmount = toTwoDecimals(nextPaidAmount);
        payoutDoc.payoutDue = toTwoDecimals(Math.max(0, netPayout - nextPaidAmount));
        await payoutDoc.save();

        return res.status(200).json({
            message: "Seller paid amount updated successfully",
            error: false,
            success: true,
            data: {
                sellerId: String(sellerId),
                grossSales: Number(payoutDoc.grossSales || 0),
                commissionRate: Number(payoutDoc.commissionRate || 0),
                commissionAmount: Number(payoutDoc.commissionAmount || 0),
                netPayout: Number(payoutDoc.netPayout || 0),
                paidAmount: Number(payoutDoc.paidAmount || 0),
                payoutDue: Number(payoutDoc.payoutDue || 0),
                currency: payoutDoc.currency || "INR",
                updatedAt: payoutDoc.updatedAt,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false,
        });
    }
};
