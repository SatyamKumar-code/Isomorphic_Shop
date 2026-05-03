import api from "../../services/api";

export const updateProfileDetails = (data) => api.put("/api/user/admin/profile", data);

export const changeProfilePassword = (data) => api.put("/api/user/admin/change-password", data);

export const updateProfileAvatar = (formData) => api.put("/api/user/admin/user-avatar", formData, {
    headers: {
        "Content-Type": "multipart/form-data",
    },
});
