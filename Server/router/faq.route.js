import express from "express";
import {
    getFaqsByProduct,
    createFaq,
    updateFaq,
    deleteFaq,
    getSellerFaqsByProduct
} from "../controller/faq.controller.js";
import userMiddleware from "../middlewares/userMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const faqRouter = express.Router();

// Public route - get FAQs for a product
faqRouter.get("/product/:productId", getFaqsByProduct);

// Seller routes - require authentication
faqRouter.post("/create", adminMiddleware, createFaq);
faqRouter.patch("/:faqId", adminMiddleware, updateFaq);
faqRouter.delete("/:faqId", adminMiddleware, deleteFaq);

// Admin panel route - get all FAQs for seller's product
faqRouter.get("/seller/product/:productId", adminMiddleware, getSellerFaqsByProduct);

export default faqRouter;
