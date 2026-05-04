import mongoose from "mongoose";

const productViewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
    },
    productOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    viewerKey: {
        type: String,
        required: true,
        trim: true,
    },
    countryCode: {
        type: String,
        default: "unknown",
        trim: true,
    },
}, { timestamps: true });

productViewSchema.index({ createdAt: -1 });
productViewSchema.index({ productOwnerId: 1, createdAt: -1 });
productViewSchema.index({ viewerKey: 1, createdAt: -1 });
productViewSchema.index({ countryCode: 1, createdAt: -1 });

const ProductViewModel = mongoose.model("product_view", productViewSchema);

export default ProductViewModel;