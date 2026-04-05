import api from "../../services/api";

export const getOrders = (params = {}) => api.get("/api/order", { params });

export const getOrderSummary = () => api.get("/api/order/summary");

export const updateOrderStatus = (orderId, data) => api.patch(`/api/order/${orderId}/status`, data);
