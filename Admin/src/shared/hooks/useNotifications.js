import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../Context/auth/useAuth";
import { getNotifications, markNotificationsAsRead } from "../../features/notifications/notificationsAPI";

const useNotifications = () => {
    const { userData } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isMarkingRead, setIsMarkingRead] = useState(false);

    const userId = String(userData?._id || userData?.id || "").trim();
    const userRole = String(userData?.role || "").trim();

    const loadNotifications = useCallback(async () => {
        if (!userId || !["admin", "seller"].includes(userRole)) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        try {
            setIsLoading(true);
            const response = await getNotifications({ limit: 8 });
            const payload = response?.data?.data || {};
            const items = Array.isArray(payload.notifications) ? payload.notifications : [];

            setNotifications(items);
            setUnreadCount(Number(payload.unreadCount || 0));
        } catch {
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [userId, userRole]);

    const markAllAsRead = useCallback(async () => {
        if (!userId || !["admin", "seller"].includes(userRole) || unreadCount <= 0) {
            return;
        }

        try {
            setIsMarkingRead(true);
            await markNotificationsAsRead();
            await loadNotifications();
        } catch {
            // Ignore notification errors so the header stays usable.
        } finally {
            setIsMarkingRead(false);
        }
    }, [loadNotifications, unreadCount, userId, userRole]);

    useEffect(() => {
        loadNotifications();

        if (!userId || !["admin", "seller"].includes(userRole)) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            loadNotifications();
        }, 30000);

        return () => window.clearInterval(intervalId);
    }, [loadNotifications, userId, userRole]);

    return {
        notifications,
        unreadCount,
        isLoading,
        isMarkingRead,
        refreshNotifications: loadNotifications,
        markAllAsRead,
    };
};

export default useNotifications;