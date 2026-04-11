import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    products: {
        type: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "product",
                    required: true
                },
                quantity: {
                    type: Number,
                    default: 1,
                    min: 1
                }
            }
        ],
        required: true,
        validate: {
            validator: function (arr) {
                return Array.isArray(arr) && arr.length > 0;
            },
            message: 'Order must have at least one product.'
        }
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"],
        default: "pending"
    },
    paymentMethod: {
        type: String,
        enum: ["Razorpay", "COD"],
        default: "COD"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending"
    },
    paymentId: {
        type: String,
        default: null
    },
    delivery_address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    refundStatus: {
        type: String,
        enum: ["none", "requested", "approved", "pickup_completed", "initiated", "processed", "rejected"],
        default: "none"
    },
    refundReason: {
        type: String,
        default: ""
    },
    refundAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    refundRequestedAt: {
        type: Date,
        default: null
    },
    refundProcessedAt: {
        type: Date,
        default: null
    },
    deliveredAt: {
        type: Date,
        default: null
    }

}, { timestamps: true });

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ refundStatus: 1, createdAt: -1 });
orderSchema.index({ "products.productId": 1 });
orderSchema.index({ createdAt: -1 });

const OrderModel = mongoose.model("Order", orderSchema);

export default OrderModel;