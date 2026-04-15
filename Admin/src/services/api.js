import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: apiUrl, // Set the base URL for your API
    withCredentials: true, // for sending cookies with requests
});

api.interceptors.request.use((config) => {
    const token = cookieStore.get("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

export default api;

// Add response interceptor to handle token expiration and refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        // If error is 401 and not already retried
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            error.response.data?.message?.toLowerCase().includes("access token expired")
        ) {
            originalRequest._retry = true;
            try {
                const refreshToken = cookieStore.get("refreshToken");
                if (!refreshToken) throw new Error("No refresh token");
                // Call refresh token endpoint
                const res = await axios.post(
                    `${apiUrl}/api/user/refresh-token`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${refreshToken}` },
                        withCredentials: true,
                    }
                );
                if (res.data?.data?.accessToken) {
                    cookieStore.set("accessToken", res.data.data.accessToken);
                    // Update Authorization header and retry original request
                    originalRequest.headers["Authorization"] = `Bearer ${res.data.data.accessToken}`;
                    return api(originalRequest);
                } else {
                    // If refresh fails, clear tokens and reload
                    cookieStore.remove("accessToken");
                    cookieStore.remove("refreshToken");
                    window.location.reload();
                }
            } catch (refreshError) {
                cookieStore.remove("accessToken");
                cookieStore.remove("refreshToken");
                window.location.reload();
            }
        }
        return Promise.reject(error);
    }
);