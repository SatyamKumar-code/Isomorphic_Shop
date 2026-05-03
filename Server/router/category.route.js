import { Router } from "express";
import upload from "../middlewares/multer.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import { createCategoryController, deleteCategoryController, deleteSubCategoryController, getAllCategoriesController, getAllSubCategoriesController, getAllSubCategoriesByCategoryIdController, getCategoryByIdController, removeImageFromCloudinary, uploadImages, CreateSubCategoryController, updateCategoryController, updateSubCategoryController } from "../controller/category.controller.js";

const categoryRouter = Router();

categoryRouter.post("/upload-images", adminMiddleware, upload.array('images'), uploadImages);
categoryRouter.delete("/deleteImage", adminMiddleware, removeImageFromCloudinary);
categoryRouter.post("/", adminMiddleware, createCategoryController);
categoryRouter.get("/", getAllCategoriesController);
categoryRouter.get("/subcategories", getAllSubCategoriesController);
categoryRouter.get("/subcategories/:id", getAllSubCategoriesByCategoryIdController);
categoryRouter.post("/subcategory", adminMiddleware, CreateSubCategoryController);
categoryRouter.put("/:id", adminMiddleware, updateCategoryController);
categoryRouter.put("/subcategory/:id", adminMiddleware, updateSubCategoryController);
categoryRouter.get("/:id", getCategoryByIdController);
categoryRouter.delete("/subcategory/:id", adminMiddleware, deleteSubCategoryController);
categoryRouter.delete("/:id", adminMiddleware, deleteCategoryController);

export default categoryRouter;