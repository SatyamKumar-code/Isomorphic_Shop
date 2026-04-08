import api from "../../services/api";

export const getCustomersAnalytics = (params = {}) => {
    return api.get("/api/user/admin/customers", { params });
};
