import api from "../../services/api";

export const loginUser = (data) => api.post("/api/user/login", data);
export const logoutUser = () => api.get("/api/user/admin/logout");
export const getProfile = () => api.get("/api/user/admin/userData");
