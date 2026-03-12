import mongoose from "mongoose";

const  categorySchema = new mongoose.Schema({
    catName : {
        type : String,
        required : true
    },    
    image: {
        type : String,
        default : ""
    },

}, {timestamps : true})

categorySchema.index({ catName: "text" });

const categoryModel = mongoose.model("category", categorySchema)
export default categoryModel;