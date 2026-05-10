import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending"
    },
    editUnlockedAtOrderCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

const ReviewModel = mongoose.model("review", ReviewSchema)
export default ReviewModel;