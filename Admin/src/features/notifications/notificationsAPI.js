import api from "../../services/api";

export const getNotifications = (params = {}) => api.get("/api/notification", { params });

export const markNotificationsAsRead = () => api.put("/api/notification/read");

export const deleteReadNotifications = () => api.delete("/api/notification/read");

export const deleteNotification = (id) => api.delete(`/api/notification/${id}`);