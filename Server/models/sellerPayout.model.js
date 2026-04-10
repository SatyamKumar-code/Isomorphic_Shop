import mongoose from "mongoose";

const sellerPayoutSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    grossSales: {
        type: Number,
        default: 0,
        min: 0,
    },
    commissionRate: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
    },
    commissionAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    netPayout: {
        type: Number,
        default: 0,
        min: 0,
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    payoutDue: {
        type: Number,
        default: 0,
        min: 0,
    },
    currency: {
        type: String,
        default: "INR",
    },
    lastCalculatedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

sellerPayoutSchema.index({ sellerId: 1 }, { unique: true });
sellerPayoutSchema.index({ payoutDue: -1, updatedAt: -1 });

const SellerPayoutModel = mongoose.model("seller_payout", sellerPayoutSchema);

export default SellerPayoutModel;
