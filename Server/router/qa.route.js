import express from "express";
import {
    getQaByProduct,
    createQuestion,
    answerQuestion,
    getSellerUnansweredQuestions,
    deleteQuestion,
    getProductsWithQACounts
} from "../controller/qa.controller.js";
import userMiddleware from "../middlewares/userMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const qaRouter = express.Router();

// Public routes - no authentication required
qaRouter.get("/product/:productId", getQaByProduct);

// User routes - require authentication
qaRouter.post("/ask", userMiddleware, createQuestion);
qaRouter.delete("/:qaId", userMiddleware, deleteQuestion);

// Seller/Admin routes
qaRouter.patch("/:qaId/answer", adminMiddleware, answerQuestion);
qaRouter.get("/seller/product/:productId", adminMiddleware, getSellerUnansweredQuestions);
qaRouter.get("/admin/products", adminMiddleware, getProductsWithQACounts);

export default qaRouter;
