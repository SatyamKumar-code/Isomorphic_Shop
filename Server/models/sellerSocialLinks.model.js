import mongoose from "mongoose";

const sellerSocialLinksSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    instagramLink: {
        type: String,
        default: "",
    },
    facebookLink: {
        type: String,
        default: "",
    },
    whatsappNumber: {
        type: String,
        default: "",
    },
}, { timestamps: true });

const SellerSocialLinksModel = mongoose.model("SellerSocialLinks", sellerSocialLinksSchema);

export default SellerSocialLinksModel;