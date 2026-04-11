import api from "../../services/api";

export const getPayoutDashboard = (params = {}) => api.get("/api/payout/dashboard", { params });

export const getSellerOrderPayoutRows = (params = {}) => api.get("/api/payout/orders", { params });

export const getSellerPayoutHistory = (params = {}) => api.get("/api/payout/history", { params });

export const getSellerPayoutPreview = (params = {}) => api.get("/api/payout/preview", { params });

export const getSellerPeriodAnalytics = (params = {}) => api.get("/api/payout/analytics", { params });

export const updateSellerPaidAmount = (sellerId, payload) => api.put(`/api/payout/admin/seller/${sellerId}/paid`, payload);
