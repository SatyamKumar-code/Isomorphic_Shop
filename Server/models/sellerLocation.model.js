import mongoose from "mongoose";

const sellerLocationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
    },
    location: {
        type: String,
        default: "",
    },
}, { timestamps: true });

sellerLocationSchema.index({ userId: 1 }, { unique: true });

const SellerLocationModel = mongoose.model("SellerLocation", sellerLocationSchema);

export default SellerLocationModel;