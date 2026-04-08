import api from "../../services/api";

export const getProductReviews = (params = {}) => api.get("/api/review", { params });

export const getProductReviewSummary = () => api.get("/api/review/summary");

export const updateProductReviewStatus = (reviewId, data) => api.patch(`/api/review/${reviewId}/status`, data);
