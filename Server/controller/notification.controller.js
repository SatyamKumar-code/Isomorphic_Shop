import NotificationModel from "../models/notification.model.js";

const getRecipientFilter = (req) => {
    if (req.userRole === "seller") {
        return {
            recipientRole: "seller",
            recipientId: req.userId,
        };
    }

    if (req.userRole === "user") {
        return {
            recipientRole: "user",
            recipientId: req.userId,
        };
    }

    return {
        recipientRole: "admin",
    };
};

export const getNotificationsController = async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(20, Number(req.query?.limit || 8)));
        const recipientFilter = getRecipientFilter(req);

        const [notifications, unreadCount] = await Promise.all([
            NotificationModel.find(recipientFilter).sort({ createdAt: -1 }).limit(limit).lean(),
            NotificationModel.countDocuments({ ...recipientFilter, isRead: false }),
        ]);

        return res.status(200).json({
            success: true,
            error: false,
            message: "Notifications fetched successfully",
            data: {
                notifications,
                unreadCount,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: error.message,
        });
    }
};

export const markNotificationsReadController = async (req, res) => {
    try {
        const recipientFilter = getRecipientFilter(req);
        const result = await NotificationModel.updateMany(
            { ...recipientFilter, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        return res.status(200).json({
            success: true,
            error: false,
            message: "Notifications marked as read",
            data: {
                modifiedCount: result.modifiedCount || 0,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: error.message,
        });
    }
};

export const deleteNotificationController = async (req, res) => {
    try {
        const { id } = req.params;
        const recipientFilter = getRecipientFilter(req);

        const deletedNotification = await NotificationModel.findOneAndDelete({
            _id: id,
            ...recipientFilter,
        });

        if (!deletedNotification) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Notification not found",
            });
        }

        return res.status(200).json({
            success: true,
            error: false,
            message: "Notification deleted successfully",
            data: {
                id: deletedNotification._id,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: error.message,
        });
    }
};

export const deleteReadNotificationsController = async (req, res) => {
    try {
        const recipientFilter = getRecipientFilter(req);
        const result = await NotificationModel.deleteMany({
            ...recipientFilter,
            isRead: true,
        });

        return res.status(200).json({
            success: true,
            error: false,
            message: "Read notifications deleted successfully",
            data: {
                deletedCount: result.deletedCount || 0,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: error.message,
        });
    }
};

export const markNotificationReadController = async (req, res) => {
    try {
        const { id } = req.params;
        const recipientFilter = getRecipientFilter(req);

        const updatedNotification = await NotificationModel.findOneAndUpdate(
            { _id: id, ...recipientFilter, isRead: false },
            { $set: { isRead: true, readAt: new Date() } },
            { new: true }
        );

        if (!updatedNotification) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Notification not found",
            });
        }

        return res.status(200).json({
            success: true,
            error: false,
            message: "Notification marked as read",
            data: {
                notification: updatedNotification,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: error.message,
        });
    }
};