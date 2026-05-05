import mongoose from "mongoose";
import NotificationModel from "../models/notification.model.js";
import ProductModel from "../models/product.model.js";

const shortOrderId = (orderId) => `#${String(orderId || "").slice(-8).toUpperCase()}`;

const toObjectId = (value) => {
    if (!value) {
        return null;
    }

    return mongoose.Types.ObjectId.isValid(String(value)) ? new mongoose.Types.ObjectId(String(value)) : null;
};

export const createNotification = async ({ recipientRole, recipientId = null, type, title, message, link = "", meta = {} }) => {
    if (!recipientRole || !type || !title || !message) {
        return null;
    }

    return NotificationModel.create({
        recipientRole,
        recipientId: toObjectId(recipientId),
        type,
        title,
        message,
        link,
        meta,
    });
};

export const getOrderSellerIds = async (orderDoc) => {
    const productIds = Array.from(new Set((Array.isArray(orderDoc?.products) ? orderDoc.products : [])
        .map((item) => String(item?.productId?._id || item?.productId || "").trim())
        .filter(Boolean)));

    if (!productIds.length) {
        return [];
    }

    const products = await ProductModel.find({ _id: { $in: productIds } }).select("createdBy").lean();
    return Array.from(new Set(products.map((product) => String(product?.createdBy || "").trim()).filter(Boolean)));
};

export const notifyOrderParticipants = async ({
    orderDoc,
    type,
    title,
    message,
    link = "/order-management",
    notifyAdmin = false,
    sellerIds,
}) => {
    const orderId = String(orderDoc?._id || "");
    const meta = {
        orderId,
        shortOrderId: shortOrderId(orderId),
        status: orderDoc?.status || "",
        refundStatus: orderDoc?.refundStatus || "",
    };

    const resolvedSellerIds = Array.isArray(sellerIds) && sellerIds.length ? sellerIds : await getOrderSellerIds(orderDoc);
    const tasks = [];

    if (notifyAdmin) {
        tasks.push(createNotification({
            recipientRole: "admin",
            type,
            title,
            message,
            link,
            meta,
        }));
    }

    for (const sellerId of resolvedSellerIds) {
        tasks.push(createNotification({
            recipientRole: "seller",
            recipientId: sellerId,
            type,
            title,
            message,
            link,
            meta,
        }));
    }

    return Promise.all(tasks);
};

export const notifySellerPayoutUpdate = async ({ sellerId, type, title, message, link = "/transaction", meta = {} }) => {
    return createNotification({
        recipientRole: "seller",
        recipientId: sellerId,
        type,
        title,
        message,
        link,
        meta,
    });
};