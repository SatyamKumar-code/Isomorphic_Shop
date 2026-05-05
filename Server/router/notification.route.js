import express from "express";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import { deleteNotificationController, deleteReadNotificationsController, getNotificationsController, markNotificationsReadController } from "../controller/notification.controller.js";

const notificationRouter = express.Router();

notificationRouter.get("/", adminMiddleware, getNotificationsController);
notificationRouter.put("/read", adminMiddleware, markNotificationsReadController);
notificationRouter.delete("/read", adminMiddleware, deleteReadNotificationsController);
notificationRouter.delete("/:id", adminMiddleware, deleteNotificationController);

export default notificationRouter;