import mongoose from "mongoose";

const returnRequestSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    reason: {
        type: String,
        required: true,
        enum: ["defective", "not_as_described", "changed_mind", "better_price", "other"],
        default: "other"
    },
    comment: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "pickup_completed", "refund_initiated", "refund_completed"],
        default: "pending"
    },
    bankDetails: {
        accountHolder: {
            type: String,
            default: ""
        },
        accountNumber: {
            type: String,
            default: ""
        },
        ifscCode: {
            type: String,
            default: ""
        },
        bankName: {
            type: String,
            default: ""
        }
    },
    pickupScheduledAt: {
        type: Date,
        default: null
    },
    pickupCompletedAt: {
        type: Date,
        default: null
    },
    refundInitiatedAt: {
        type: Date,
        default: null
    },
    refundCompletedAt: {
        type: Date,
        default: null
    },
    refundAmount: {
        type: Number,
        default: 0,
        min: 0
    }
}, { timestamps: true });

returnRequestSchema.index({ orderId: 1 });
returnRequestSchema.index({ userId: 1 });
returnRequestSchema.index({ status: 1 });
returnRequestSchema.index({ createdAt: -1 });

const ReturnRequestModel = mongoose.model("ReturnRequest", returnRequestSchema);

export default ReturnRequestModel;
