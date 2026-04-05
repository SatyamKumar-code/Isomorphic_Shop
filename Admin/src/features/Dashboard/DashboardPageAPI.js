import api from "../../services/api";

export const getDashboardPageData = () => api.get("/api/dashboard");
