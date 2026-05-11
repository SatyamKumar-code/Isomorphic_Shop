import mongoose from "mongoose";

const qaSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        default: "",
        trim: true
    },
    isAnswered: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

qaSchema.index({ productId: 1, isAnswered: -1 });
qaSchema.index({ sellerId: 1 });
qaSchema.index({ userId: 1 });

const QAModel = mongoose.model("qa", qaSchema);
export default QAModel;
