import express from "express";
import {
	uploadImages,
	removeImageFromCloudinary,
	createProductController,
	getAllProductsController,
	getProductByIdController,
	updateProductController,
	deleteProductController,
	getProductsByCategoryIdController,
	getProductsBySubCategoryIdController,
	getTopRatedProductsController,
	getLatestProductsController,
	searchProductsController,
	filterProductsController,
	getRelatedProductsController,
	createProductReviewController,
	getProductReviewsController
} from "../controller/product.controller.js";

import upload from "../middlewares/multer.js";
import userAuth from "../middlewares/userMiddleware.js";
import adminAuth from "../middlewares/adminMiddleware.js";

const productRouter = express.Router();

// Image upload & remove
productRouter.post("/upload-images",adminAuth, upload.single("image"), uploadImages);
productRouter.delete("/remove-image", adminAuth, removeImageFromCloudinary);

// Top/Latest (static paths first)
productRouter.get("/top-rated", getTopRatedProductsController);
productRouter.get("/latest", getLatestProductsController);

// Search & Filter
productRouter.get("/search", searchProductsController);
productRouter.get("/filter", filterProductsController);

// Category & SubCategory
productRouter.get("/category/:categoryId", getProductsByCategoryIdController);
productRouter.get("/subcategory/:subCategoryId", getProductsBySubCategoryIdController);

// Related products
productRouter.get("/related/:id", getRelatedProductsController);

// Reviews (has additional path segment, so safe)
productRouter.post("/:id/review", userAuth, createProductReviewController);
productRouter.get("/:id/reviews", getProductReviewsController);

// CRUD (parameterized /:id routes last)
productRouter.post("/", adminAuth, createProductController);
productRouter.get("/", getAllProductsController);
productRouter.get("/:id", getProductByIdController);
productRouter.put("/:id", adminAuth, updateProductController);
productRouter.delete("/:id", adminAuth, deleteProductController);
export default productRouter;
