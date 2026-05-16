import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteNotification, deleteReadNotifications, getNotifications, markNotificationsAsRead, markNotificationAsRead } from '../notificationsAPI';

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMarkingRead, setIsMarkingRead] = useState(false);
    const [isDeletingRead, setIsDeletingRead] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const hasReadNotifications = notifications.some((notification) => notification.isRead);

    const loadNotifications = async () => {
        try {
            setIsLoading(true);
            const response = await getNotifications({ limit: 50 });
            const payload = response?.data?.data || {};
            setNotifications(Array.isArray(payload.notifications) ? payload.notifications : []);
        } catch {
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const handleMarkAllRead = async () => {
        try {
            setIsMarkingRead(true);
            await markNotificationsAsRead();
            await loadNotifications();
        } finally {
            setIsMarkingRead(false);
        }
    };

    const handleDeleteNotification = async (notificationId) => {
        const shouldDelete = window.confirm('Delete this notification?');
        if (!shouldDelete) {
            return;
        }

        try {
            await deleteNotification(notificationId);
            await loadNotifications();
        } catch {
            // Keep the inbox usable even if deletion fails.
        }
    };

    const handleDeleteReadNotifications = async () => {
        const shouldDelete = window.confirm('Delete all read notifications?');
        if (!shouldDelete) {
            return;
        }

        try {
            setIsDeletingRead(true);
            await deleteReadNotifications();
            await loadNotifications();
        } finally {
            setIsDeletingRead(false);
        }
    };

    return (
        <>
            <div className="w-full px-5 pb-6 pt-4 h-[calc(100vh-6.25rem)] overflow-x-auto scrollbarNone">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#23272E] dark:text-white">Notification Inbox</h1>
                        {/* <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Seller and admin notifications appear here.</p> */}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={loadNotifications}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-gray-950 dark:text-slate-200 dark:hover:bg-gray-900"
                        >
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            disabled={isMarkingRead}
                            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isMarkingRead ? 'Marking read...' : 'Mark all read'}
                        </button>
                        {hasReadNotifications ? (
                            <button
                                type="button"
                                onClick={handleDeleteReadNotifications}
                                disabled={isDeletingRead}
                                className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-900/60 dark:bg-gray-950 dark:text-red-400 dark:hover:bg-red-950/30"
                            >
                                {isDeletingRead ? 'Deleting...' : 'Delete read'}
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-gray-950">
                    <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                        <h2 className="text-[16px] font-semibold text-slate-900 dark:text-white">Recent notifications</h2>
                    </div>

                    {isLoading ? (
                        <div className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">Loading notifications...</div>
                    ) : notifications.length ? (
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between ${notification.isRead ? 'bg-white dark:bg-gray-950' : 'bg-emerald-50/60 dark:bg-emerald-950/20'}`}
                                >
                                    <div className="flex min-w-0 gap-3">
                                        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? 'bg-slate-300 dark:bg-slate-700' : 'bg-emerald-500'}`} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{notification.title}</p>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{notification.message}</p>
                                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatDate(notification.createdAt)}</p>
                                        </div>
                                    </div>

                                    {notification.link ? (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    await markNotificationAsRead(notification._id);
                                                    await loadNotifications();
                                                } catch {
                                                    // ignore
                                                }

                                                // If this notification is related to an order, navigate directly to order-management and focus the order
                                                try {
                                                    if (notification?.meta?.orderId) {
                                                        const id = String(notification.meta.orderId || "").trim();
                                                        if (id) {
                                                            navigate({ pathname: '/order-management', search: `search=${encodeURIComponent(id)}&focusOrder=${encodeURIComponent(id)}` });
                                                            return;
                                                        }
                                                    }
                                                } catch { }

                                                setSelectedNotification(notification);
                                                setIsDetailOpen(true);
                                            }}
                                            className="self-start rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-gray-900"
                                        >
                                            Open
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteNotification(notification._id)}
                                        className="self-start rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">No notifications yet.</div>
                    )}
                </div>
            </div>
            {isDetailOpen && selectedNotification ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-160 max-w-[95%] rounded-xl bg-white p-6 shadow-lg dark:bg-gray-950">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedNotification.title}</h3>
                                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{selectedNotification.message}</p>
                                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(selectedNotification.createdAt)}</p>
                            </div>
                            <div className="ml-4 flex items-start gap-2">
                                {selectedNotification.link ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsDetailOpen(false);
                                            try {
                                                if (selectedNotification?.meta?.orderId) {
                                                    const id = String(selectedNotification.meta.orderId || "").trim();
                                                    if (id) {
                                                        navigate({ pathname: '/order-management', search: `search=${encodeURIComponent(id)}&focusOrder=${encodeURIComponent(id)}` });
                                                        return;
                                                    }
                                                }
                                            } catch { }
                                            navigate(selectedNotification.link);
                                        }}
                                        className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                                    >
                                        Go to link
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => setIsDetailOpen(false)}
                                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
};

export default NotificationsPage;