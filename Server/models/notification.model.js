import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipientRole: {
            type: String,
            required: true,
            enum: ["admin", "seller", "user"],
        },
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        type: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        link: {
            type: String,
            default: "",
        },
        meta: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ recipientRole: 1, recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

const NotificationModel = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default NotificationModel;