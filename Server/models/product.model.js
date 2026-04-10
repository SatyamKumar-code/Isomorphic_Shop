import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
    },
    oldPrice: {
        type: Number,
        default: 0,
    },
    discountPercentage: {
        type: Number,
        default: 0,
    },
    description: {
        type: String,
        default: ""
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subcategory",
    },
    images: [
        {
            type: String,
            default: ""
        }
    ],
    size: {
        type: String,
        default: ""
    },
    weight: {
        type: String,
        default: ""
    },
    RAM: {
        type: String,
        default: ""
    },
    ROM: {
        type: String,
        default: ""
    },
    color: {
        type: String,
        default: ""
    },
    featured: {
        type: Boolean,
        default: false,
    },
    stock: {
        type: Number,
        default: 0
    },
    expirationStart: {
        type: Date,
        default: null,
    },
    expirationEnd: {
        type: Date,
        default: null,
    },
    sales: {
        type: Number,
        default: 0,
        min: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
}, { timestamps: true })

productSchema.index({ productName: "text", description: "text", size: "text", weight: "text", RAM: "text", color: "text" });
productSchema.index({ productName: 1, createdAt: -1 });

const ProductModel = mongoose.model("product", productSchema)
export default ProductModel;