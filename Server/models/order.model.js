import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required: true
    },
    products: {
        type: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
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
            validator: function(arr) {
                return Array.isArray(arr) && arr.length > 0;
            },
            message: 'Order must have at least one product.'
        }
    },
    status: {
        type: String,
        enum: ["pending", "shipped", "delivered", "cancelled"],
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
    }

} , { timestamps : true });

const OrderModel = mongoose.model("Order" , orderSchema);

export default OrderModel;