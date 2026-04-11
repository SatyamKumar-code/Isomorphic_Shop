import mongoose from "mongoose";

const sellerPayoutTransactionSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    deltaAmount: {
        type: Number,
        default: 0,
    },
    action: {
        type: String,
        enum: ["add", "set"],
        default: "add",
    },
    entryType: {
        type: String,
        enum: ["payout", "adjustment"],
        default: "payout",
    },
    previousPaidAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    newPaidAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    currency: {
        type: String,
        default: "INR",
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null,
    },
    orderIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
    }],
    payoutWindowDays: {
        type: Number,
        enum: [7, 15, 30, 90, null],
        default: null,
    },
    note: {
        type: String,
        default: "",
    },
    processedBy: {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        adminName: {
            type: String,
            default: "",
        },
        adminEmail: {
            type: String,
            default: "",
        },
    },
}, { timestamps: true });

sellerPayoutTransactionSchema.index({ sellerId: 1, createdAt: -1 });
sellerPayoutTransactionSchema.index({ orderId: 1, createdAt: -1 });
sellerPayoutTransactionSchema.index({ orderIds: 1, createdAt: -1 });

const SellerPayoutTransactionModel = mongoose.model("seller_payout_transaction", sellerPayoutTransactionSchema);

export default SellerPayoutTransactionModel;
