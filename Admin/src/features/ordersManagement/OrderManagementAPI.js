import api from "../../services/api";

export const getOrders = (params = {}) => api.get("/api/order", { params });

export const getOrderSummary = (params = {}) => api.get("/api/order/summary", { params });

export const updateOrderStatus = (orderId, data) => api.patch(`/api/order/status/${orderId}`, data);

export const updateOrderRefundStatus = (orderId, data) => api.patch(`/api/order/refund/${orderId}`, data);

export const createAdminOrder = (data) => api.post("/api/order/admin/create", data);

export const searchOrderCustomers = (query) => api.get("/api/order/admin/lookups/customers", { params: { q: query } });

export const searchOrderProducts = (query) => api.get("/api/order/admin/lookups/products", { params: { q: query } });

export const getOrderAddressesByUser = (userId) => api.get("/api/order/admin/lookups/addresses", { params: { userId } });
