import express from "express";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import { getAllReviews, getReviewSummary, updateReviewStatus } from "../controller/review.controller.js";

const reviewRouter = express.Router();

reviewRouter.get("/", adminMiddleware, getAllReviews);
reviewRouter.get("/summary", adminMiddleware, getReviewSummary);
reviewRouter.patch("/:reviewId/status", adminMiddleware, updateReviewStatus);

export default reviewRouter;
