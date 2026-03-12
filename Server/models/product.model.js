import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    productName : {
        type: String,
        required : true
    },
    price : {
        type : Number,
        required : true,
    },
    description : {
        type : String,
        default : ""
    },
    category : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "category",
    },
    subCategory : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "subcategory",
    },
    images : [
        {
            type : String,
            default : ""
        }
    ],
    size : {
        type : String,
        default : ""
    },
    weight : {
        type : String,
        default : ""
    },
    Ram : {
        type : String,
        default : ""
    },
    Rom : {
        type : String,
        default : ""
    },
    color : {
        type : String,
        default : ""
    },
    stock : {
        type : Number,
        default : 0
    },
    sales : {
        type : Number,
        default : 0,
        min: 0
    },
    rating : {
        type : Number,
        default : 0,
        min : 0,
        max : 5
    },
} , {timestamps : true})

productSchema.index({ productName: "text", description: "text", size: "text", weight: "text", Ram: "text", color: "text" });

const ProductModel = mongoose.model("product", productSchema)
export default ProductModel;