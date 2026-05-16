import express from "express";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import userMiddleware from "../middlewares/userMiddleware.js";
import { deleteNotificationController, deleteReadNotificationsController, getNotificationsController, markNotificationsReadController, markNotificationReadController } from "../controller/notification.controller.js";

const notificationRouter = express.Router();

// Admin and Seller routes
notificationRouter.get("/", adminMiddleware, getNotificationsController);
notificationRouter.put("/read", adminMiddleware, markNotificationsReadController);
notificationRouter.put("/:id/read", adminMiddleware, markNotificationReadController);
notificationRouter.delete("/read", adminMiddleware, deleteReadNotificationsController);
notificationRouter.delete("/:id", adminMiddleware, deleteNotificationController);

// User routes (same endpoints but with userMiddleware)
notificationRouter.get("/user", userMiddleware, getNotificationsController);
notificationRouter.put("/user/read", userMiddleware, markNotificationsReadController);
notificationRouter.put("/user/:id/read", userMiddleware, markNotificationReadController);
notificationRouter.delete("/user/read", userMiddleware, deleteReadNotificationsController);
notificationRouter.delete("/user/:id", userMiddleware, deleteNotificationController);

export default notificationRouter;