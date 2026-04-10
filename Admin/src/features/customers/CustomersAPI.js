import api from "../../services/api";

export const getCustomersAnalytics = (params = {}) => {
    return api.get("/api/user/admin/customers", { params });
};

export const updateCustomerStatus = (id, status) => {
    return api.put(`/api/user/updateUserStatus/${id}`, { status });
};

export const sendCustomerResetPasswordLink = (id) => {
    return api.post(`/api/user/admin/send-reset-link/${id}`);
};

export const forceCustomerLogout = (id) => {
    return api.post(`/api/user/admin/force-logout/${id}`);
};

export const updateCustomerNote = (id, note) => {
    return api.put(`/api/user/admin/customer-note/${id}`, { note });
};
