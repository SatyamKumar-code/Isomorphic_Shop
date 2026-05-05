import api from "../../services/api";

export const registerSeller = (data) => api.post("/api/user/register-seller", data);
export const loginUser = (data) => api.post("/api/user/login", data);
export const logoutUser = () => api.get("/api/user/admin/logout");
export const getProfile = () => api.get("/api/user/admin/userData");
export const socialLogin = (data) => api.post("/api/user/social-login", data);
export const forgotPasswordRequest = (data) => api.post("/api/user/forgot-password", data);
export const verifyForgotPasswordOtp = (data) => api.post("/api/user/verify-forgot-password-otp", data);
export const resetPasswordWithOtp = (data) => api.post("/api/user/reset-password-withOtp", data);
