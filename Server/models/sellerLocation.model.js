import mongoose from "mongoose";

const sellerLocationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    location: {
        type: String,
        default: "",
    },
}, { timestamps: true });

const SellerLocationModel = mongoose.model("SellerLocation", sellerLocationSchema);

export default SellerLocationModel;