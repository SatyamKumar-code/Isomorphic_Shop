import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
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
    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

faqSchema.index({ productId: 1 });
faqSchema.index({ sellerId: 1 });

const FAQModel = mongoose.model("faq", faqSchema);
export default FAQModel;
