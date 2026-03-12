import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema({
    subCatName :{
        type: String,
        required : true
    },    
    categoryId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category"
    }
},{timestamps: true})

const subCatModel = mongoose.model('subcategory', subCategorySchema)

export default subCatModel;