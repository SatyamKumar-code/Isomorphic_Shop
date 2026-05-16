import { fetchDataFromApi, putData, deleteData } from "./api";

export const getNotifications = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/notification/user?${queryString}` : "/api/notification/user";
    return fetchDataFromApi(url);
};

export const markNotificationsAsRead = () => putData("/api/notification/user/read", {});

export const markNotificationAsRead = (id) => putData(`/api/notification/user/${id}/read`, {});

export const deleteReadNotifications = () => deleteData("/api/notification/user/read");

export const deleteNotification = (id) => deleteData(`/api/notification/user/${id}`);