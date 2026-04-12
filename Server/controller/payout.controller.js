import mongoose from "mongoose";
import SellerPayoutModel from "../models/sellerPayout.model.js";
import SellerPayoutTransactionModel from "../models/sellerPayoutTransaction.model.js";
import UserModel from "../models/user.model.js";
import ProductModel from "../models/product.model.js";
import OrderModel from "../models/order.model.js";
import SettingsModel from "../models/settings.model.js";

const toTwoDecimals = (value) => Number(Number(value || 0).toFixed(2));
const FALLBACK_COMMISSION_RATE = 10;
const MIN_PAYOUT_HOLD_DAYS = 7;
const REFUND_SETTLED_STATUSES = new Set(["approved", "pickup_completed", "initiated", "processed"]);


// Fetch commission rate from DB, fallback to env/hardcoded
export const getCommissionRate = async () => {
    const doc = await SettingsModel.findOne({ key: "DEFAULT_COMMISSION_RATE" });
    if (doc && Number.isFinite(Number(doc.value))) {
        return Number(doc.value);
    }
    if (process.env.DEFAULT_COMMISSION_RATE && Number.isFinite(Number(process.env.DEFAULT_COMMISSION_RATE))) {
        return Number(process.env.DEFAULT_COMMISSION_RATE);
    }
    return FALLBACK_COMMISSION_RATE;
};

// Fetch return charge (fixed amount) from DB, fallback to env/hardcoded
export const getReturnChargeRate = async () => {
    const doc = await SettingsModel.findOne({ key: "RETURN_CHARGE_RATE" });
    if (doc && Number.isFinite(Number(doc.value))) {
        return Math.max(0, Number(doc.value));
    }
    const rawRate = Number.parseFloat(process.env.RETURN_CHARGE_RATE || "2");
    if (!Number.isFinite(rawRate)) {
        return 2;
    }
    return Math.max(0, rawRate);
};

// Admin: Get current payout settings
export const getPayoutSettingsController = async (req, res) => {
    try {
        const commissionRate = await getCommissionRate();
        const returnChargeRate = await getReturnChargeRate();
        return res.status(200).json({
            success: true,
            error: false,
            data: {
                commissionRate,
                returnChargeRate,
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

// Admin: Update payout settings
export const updatePayoutSettingsController = async (req, res) => {
    try {
        const { commissionRate, returnChargeRate } = req.body;
        const updates = [];
        if (commissionRate !== undefined) {
            updates.push(SettingsModel.findOneAndUpdate(
                { key: "DEFAULT_COMMISSION_RATE" },
                { value: Number(commissionRate) },
                { upsert: true, new: true }
            ));
        }
        if (returnChargeRate !== undefined) {
            updates.push(SettingsModel.findOneAndUpdate(
                { key: "RETURN_CHARGE_RATE" },
                { value: Math.max(0, Math.min(100, Number(returnChargeRate))) },
                { upsert: true, new: true }
            ));
        }
        await Promise.all(updates);
        return res.status(200).json({
            success: true,
            error: false,
            message: "Settings updated successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: error.message,
        });
    }
};

const getPayoutSettings = () => ({
    holdDaysAfterDelivery: MIN_PAYOUT_HOLD_DAYS,
    returnChargeRate: getReturnChargeRate(),
});

const toObjectIdString = (value) => String(value || "");

const parsePagination = (query = {}) => {
    let page = Number(query.page || 1);
    let limit = Number(query.limit || 20);

    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    return { page, limit, skip: (page - 1) * limit };
};

const formatDateLabel = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getShortOrderId = (orderId) => {
    const source = String(orderId || "");
    if (!source) return "";
    return `#${source.slice(-8).toUpperCase()}`;
};

const PAYOUT_WINDOW_DAYS = new Set([7, 15, 30, 90]);

const isValidDate = (value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
};

const toDateOrNull = (value) => {
    if (!isValidDate(value)) return null;
    return new Date(value);
};

const resolveDeliveredAt = (order) => {
    const status = String(order?.status || "").toLowerCase();
    if (status !== "delivered") return null;

    return toDateOrNull(order?.deliveredAt) || toDateOrNull(order?.updatedAt) || toDateOrNull(order?.createdAt);
};

const getPayoutAvailability = (deliveredAt, now = new Date()) => {
    if (!deliveredAt) {
        return {
            payoutAvailableAt: null,
            payoutUnlocked: false,
            payoutHoldDaysRemaining: MIN_PAYOUT_HOLD_DAYS,
        };
    }

    const payoutAvailableAt = new Date(deliveredAt);
    payoutAvailableAt.setDate(payoutAvailableAt.getDate() + MIN_PAYOUT_HOLD_DAYS);

    const msDiff = payoutAvailableAt.getTime() - now.getTime();
    const daysRemaining = msDiff > 0 ? Math.ceil(msDiff / (1000 * 60 * 60 * 24)) : 0;

    return {
        payoutAvailableAt,
        payoutUnlocked: daysRemaining <= 0,
        payoutHoldDaysRemaining: daysRemaining,
    };
};

const isRowPayoutEligible = (row) => {
    const orderStatus = String(row?.rawOrderStatus || "").toLowerCase();
    return orderStatus !== "cancelled"
        && Boolean(row?.userPaymentDone)
        && !Boolean(row?.isRefunded)
        && Boolean(row?.payoutUnlocked);
};

const getOrderTabCounts = (rows = []) => ({
    all: rows.length,
    userPaid: rows.filter((row) => row.userPaymentDone).length,
    paymentPending: rows.filter((row) => !row.userPaymentDone && String(row.rawOrderStatus || "").toLowerCase() !== "cancelled").length,
    refunded: rows.filter((row) => row.isRefunded).length,
    cancelled: rows.filter((row) => String(row.rawOrderStatus || "").toLowerCase() === "cancelled").length,
});

const applyOrdersTabFilter = (rows = [], tab = "all") => {
    const normalizedTab = String(tab || "all").trim().toLowerCase();

    if (normalizedTab === "user_paid") {
        return rows.filter((row) => row.userPaymentDone);
    }

    if (normalizedTab === "payment_pending") {
        return rows.filter((row) => !row.userPaymentDone && String(row.rawOrderStatus || "").toLowerCase() !== "cancelled");
    }

    if (normalizedTab === "refunded") {
        return rows.filter((row) => row.isRefunded);
    }

    if (normalizedTab === "cancelled") {
        return rows.filter((row) => String(row.rawOrderStatus || "").toLowerCase() === "cancelled");
    }

    return rows;
};

const applyOrdersSearchAndMethodFilters = (rows = [], method = "", searchTerm = "") => {
    const selectedMethod = String(method || "").trim();
    const term = String(searchTerm || "").trim().toLowerCase();

    let filtered = [...rows];

    if (selectedMethod) {
        filtered = filtered.filter((row) => String(row.paymentMethod || "") === selectedMethod);
    }

    if (term) {
        filtered = filtered.filter((row) => {
            const haystack = [
                row.orderId,
                row.customer?.name,
                row.customer?.email,
                row.paymentMethod,
                row.paymentStatus,
                row.refundStatus,
            ].filter(Boolean).join(" ").toLowerCase();

            return haystack.includes(term);
        });
    }

    return filtered;
};

const getPaidOrderIdSetForSeller = async (sellerId) => {
    const transactions = await SellerPayoutTransactionModel.find({
        sellerId,
        deltaAmount: { $gt: 0 },
    })
        .select("orderId orderIds")
        .lean();

    const set = new Set();
    for (const item of transactions) {
        if (item?.orderId) {
            set.add(String(item.orderId));
        }

        if (Array.isArray(item?.orderIds)) {
            for (const orderId of item.orderIds) {
                if (orderId) set.add(String(orderId));
            }
        }
    }

    return set;
};

const getPeriodStartDates = (now = new Date()) => {
    const last7Days = new Date(now);
    last7Days.setDate(last7Days.getDate() - 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    return { last7Days, monthStart, yearStart };
};

const ensureSellerAccess = async (req, requestedSellerId = "") => {
    const actorId = req.userId;
    const actorRole = req.userRole || (await UserModel.findById(actorId).select("role").lean())?.role;

    if (!actorRole || !["admin", "seller"].includes(actorRole)) {
        return {
            error: {
                status: 403,
                message: "admin or seller access only",
            },
        };
    }

    const requested = String(requestedSellerId || "").trim();
    if (requested && !mongoose.Types.ObjectId.isValid(requested)) {
        return {
            error: {
                status: 400,
                message: "Valid sellerId is required",
            },
        };
    }

    if (actorRole === "seller") {
        if (requested && requested !== String(actorId)) {
            return {
                error: {
                    status: 403,
                    message: "Seller can only access own payout data",
                },
            };
        }

        return {
            actorRole,
            actorId,
            targetSellerId: String(actorId),
        };
    }

    return {
        actorRole,
        actorId,
        targetSellerId: requested || "",
    };
};

const getSellerPayoutDoc = async (sellerId) => {
    const payout = await SellerPayoutModel.findOne({ sellerId }).lean();
    if (!payout) {
        return null;
    }

    return payout;
};

const getSellerOrderRows = async (sellerId, commissionRate) => {
    const sellerProducts = await ProductModel.find({ createdBy: sellerId }).select("_id").lean();
    const sellerProductIds = sellerProducts.map((item) => item._id);

    if (!sellerProductIds.length) {
        return [];
    }

    // Fetch orders with completed payment OR cancelled status (for analytics purposes)
    const orders = await OrderModel.find({
        "products.productId": { $in: sellerProductIds },
        $or: [
            { paymentStatus: "completed" },
            { status: "cancelled" }
        ]
    })
        .populate("userId", "name email")
        .populate({
            path: "products.productId",
            select: "productName price createdBy",
        })
        .sort({ createdAt: -1, _id: -1 })
        .lean();

    const rows = [];
    const now = new Date();
    const returnChargeRate = await getReturnChargeRate();

    for (const order of orders) {
        const items = Array.isArray(order.products) ? order.products : [];
        const sellerItems = items.filter((item) => {
            const createdBy = toObjectIdString(item?.productId?.createdBy);
            return createdBy && createdBy === String(sellerId);
        });

        if (!sellerItems.length) continue;

        const sellerGross = sellerItems.reduce((sum, item) => {
            const price = Number(item?.productId?.price || 0);
            const quantity = Number(item?.quantity || 0);
            return sum + (price * quantity);
        }, 0);

        const baseCommissionAmount = (sellerGross * Number(commissionRate || 0)) / 100;
        const totalAmount = Number(order?.totalAmount || 0);
        const rawRefundAmount = Number(order?.refundAmount || 0);
        const status = String(order?.status || "").toLowerCase();
        const isDelivered = status === "delivered";
        const isCancelled = status === "cancelled";
        const refundEligible = isDelivered && REFUND_SETTLED_STATUSES.has(String(order?.refundStatus || "").trim().toLowerCase());
        const refundShare = refundEligible && totalAmount > 0
            ? rawRefundAmount * (sellerGross / totalAmount)
            : 0;
        let commissionAmount = 0;
        let returnChargeAmount = 0;

        if (isCancelled) {
            commissionAmount = 0;
            returnChargeAmount = 0;
        } else if (refundEligible) {
            commissionAmount = 0;
            returnChargeAmount = returnChargeRate;
        } else {
            commissionAmount = baseCommissionAmount;
            returnChargeAmount = 0;
        }
        const totalCommissionAmount = commissionAmount + returnChargeAmount;
        const deliveredAt = resolveDeliveredAt(order);
        const { payoutAvailableAt, payoutUnlocked, payoutHoldDaysRemaining } = getPayoutAvailability(deliveredAt, now);

        let netAfterCommission = sellerGross - totalCommissionAmount;
        let netAfterRefund = Math.max(0, netAfterCommission - refundShare);
        if (isCancelled) {
            netAfterCommission = 0;
            netAfterRefund = 0;
        }

        let payoutBlockedReason = "";
        if (String(order?.status || "").toLowerCase() !== "delivered") {
            payoutBlockedReason = "Order not delivered yet";
        } else if (!payoutUnlocked) {
            payoutBlockedReason = `Payout hold active (${payoutHoldDaysRemaining} day${payoutHoldDaysRemaining === 1 ? "" : "s"} left)`;
        } else if (refundEligible) {
            payoutBlockedReason = "Refund settled on order";
        } else if (String(order?.paymentStatus || "").toLowerCase() !== "completed") {
            payoutBlockedReason = "Payment not completed";
        }

        rows.push({
            id: String(order?._id || ""),
            orderId: getShortOrderId(order?._id),
            rawOrderStatus: String(order?.status || "pending"),
            paymentMethod: String(order?.paymentMethod || "COD"),
            paymentStatus: String(order?.paymentStatus || "pending"),
            paymentId: String(order?.paymentId || ""),
            refundStatus: String(order?.refundStatus || "none"),
            refundAmount: toTwoDecimals(refundShare),
            customer: {
                id: String(order?.userId?._id || ""),
                name: String(order?.userId?.name || ""),
                email: String(order?.userId?.email || ""),
            },
            createdAt: order?.createdAt,
            date: formatDateLabel(order?.createdAt),
            grossSales: toTwoDecimals(sellerGross),
            commissionRate: Number(commissionRate || 0),
            commissionAmount: toTwoDecimals(commissionAmount),
            baseCommissionAmount: toTwoDecimals(baseCommissionAmount),
            returnChargeRate,
            returnChargeAmount: toTwoDecimals(returnChargeAmount),
            netAfterCommission: toTwoDecimals(netAfterCommission),
            netAfterRefund: toTwoDecimals(netAfterRefund),
            userPaymentDone: String(order?.paymentStatus || "").toLowerCase() === "completed",
            isRefunded: refundEligible,
            deliveredAt,
            payoutAvailableAt,
            payoutUnlocked,
            payoutHoldDaysRemaining,
            payoutBlockedReason,
        });
    }

    return rows;
};

const summarizeRows = (rows, paidAmount) => {
    // Exclude cancelled orders from payout calculation
    const payoutRows = rows.filter((item) => item.rawOrderStatus !== "cancelled");

    const grossSales = payoutRows.reduce((sum, item) => sum + Number(item.grossSales || 0), 0);
    const commissionAmount = payoutRows.reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0);
    const returnChargeTotal = payoutRows.reduce((sum, item) => sum + Number(item.returnChargeAmount || 0), 0);
    const netRevenue = payoutRows.reduce((sum, item) => sum + Number(item.netAfterRefund || 0), 0);
    const userPaidRevenue = payoutRows
        .filter((item) => item.userPaymentDone)
        .reduce((sum, item) => sum + Number(item.netAfterRefund || 0), 0);
    const refundTotal = payoutRows.reduce((sum, item) => sum + Number(item.refundAmount || 0), 0);
    const payoutDue = Math.max(0, netRevenue - Number(paidAmount || 0));

    // Return orders: delivered + refunded (not cancelled)
    const returnOrders = payoutRows.filter((item) => item.isRefunded).length;
    const returnTotal = payoutRows.filter((item) => item.isRefunded).reduce((sum, item) => sum + Number(item.refundAmount || 0), 0);

    return {
        totalOrders: payoutRows.length,
        userPaidOrders: payoutRows.filter((item) => item.userPaymentDone).length,
        refundOrders: payoutRows.filter((item) => item.isRefunded).length,
        grossSales: toTwoDecimals(grossSales),
        commissionAmount: toTwoDecimals(commissionAmount),
        returnChargeTotal: toTwoDecimals(returnChargeTotal),
        netRevenue: toTwoDecimals(netRevenue),
        userPaidRevenue: toTwoDecimals(userPaidRevenue),
        refundTotal: toTwoDecimals(refundTotal),
        paidAmount: toTwoDecimals(Number(paidAmount || 0)),
        payoutDue: toTwoDecimals(payoutDue),
        returnOrders,
        returnTotal: toTwoDecimals(returnTotal),
    };
};

const summarizePeriods = (rows) => {
    // Exclude cancelled orders from period summaries
    const payoutRows = rows.filter((item) => item.rawOrderStatus !== "cancelled");

    const now = new Date();
    const { last7Days, monthStart, yearStart } = getPeriodStartDates(now);

    const build = (startDate) => {
        const subset = payoutRows.filter((item) => new Date(item.createdAt) >= startDate);
        return {
            orders: subset.length,
            grossSales: toTwoDecimals(subset.reduce((sum, item) => sum + Number(item.grossSales || 0), 0)),
            netRevenue: toTwoDecimals(subset.reduce((sum, item) => sum + Number(item.netAfterRefund || 0), 0)),
            paidRevenue: toTwoDecimals(subset.filter((item) => item.userPaymentDone).reduce((sum, item) => sum + Number(item.netAfterRefund || 0), 0)),
        };
    };

    return {
        last7Days: build(last7Days),
        monthToDate: build(monthStart),
        yearToDate: build(yearStart),
    };
};

const upsertSellerPayout = async ({ sellerId, currency, commissionRate, summary }) => {
    const payload = {
        sellerId,
        grossSales: toTwoDecimals(summary.grossSales),
        commissionRate: Number(commissionRate || DEFAULT_COMMISSION_RATE),
        commissionAmount: toTwoDecimals(summary.commissionAmount),
        netPayout: toTwoDecimals(summary.netRevenue),
        paidAmount: toTwoDecimals(summary.paidAmount),
        payoutDue: toTwoDecimals(summary.payoutDue),
        currency: currency || "INR",
        lastCalculatedAt: new Date(),
    };

    await SellerPayoutModel.updateOne(
        { sellerId },
        { $set: payload },
        { upsert: true }
    );
};

const computeSellerPayoutSnapshot = async (sellerId) => {
    const seller = await UserModel.findById(sellerId).select("_id role name email").lean();
    if (!seller || seller.role !== "seller") {
        return { error: { status: 404, message: "Seller not found" } };
    }

    const payoutDoc = await getSellerPayoutDoc(sellerId);
    // Use DB commission rate if set, else fallback
    let commissionRate = Number(payoutDoc?.commissionRate);
    if (!Number.isFinite(commissionRate)) {
        commissionRate = await getCommissionRate();
    }
    const paidAmount = Number(payoutDoc?.paidAmount || 0);
    const currency = payoutDoc?.currency || "INR";

    const rows = await getSellerOrderRows(sellerId, commissionRate);
    const paidOrderIdSet = await getPaidOrderIdSetForSeller(sellerId);
    const rowsWithPayoutState = rows.map((row) => ({
        ...row,
        payoutMarked: paidOrderIdSet.has(String(row.id)),
    }));
    const summary = summarizeRows(rowsWithPayoutState, paidAmount);
    const periods = summarizePeriods(rowsWithPayoutState);

    await upsertSellerPayout({
        sellerId,
        currency,
        commissionRate,
        summary,
    });

    return {
        seller,
        commissionRate,
        currency,
        summary,
        periods,
        rows: rowsWithPayoutState,
    };
};

export const getSellerPayoutByIdController = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const access = await ensureSellerAccess(req, sellerId);
        if (access.error) {
            return res.status(access.error.status).json({
                message: access.error.message,
                error: true,
                success: false,
            });
        }

        const snapshot = await computeSellerPayoutSnapshot(access.targetSellerId);
        if (snapshot.error) {
            return res.status(snapshot.error.status).json({
                message: snapshot.error.message,
                error: true,
                success: false,
            });
        }

        return res.status(200).json({
            message: "Seller payout fetched successfully",
            error: false,
            success: true,
            data: {
                seller: {
                    id: String(snapshot.seller._id),
                    name: snapshot.seller.name || "",
                    email: snapshot.seller.email || "",
                },
                payout: {
                    sellerId: String(snapshot.seller._id),
                    grossSales: snapshot.summary.grossSales,
                    commissionRate: snapshot.commissionRate,
                    commissionAmount: snapshot.summary.commissionAmount,
                    netPayout: snapshot.summary.netRevenue,
                    paidAmount: snapshot.summary.paidAmount,
                    payoutDue: snapshot.summary.payoutDue,
                    currency: snapshot.currency,
                    lastCalculatedAt: new Date(),
                },
                periods: snapshot.periods,
                orderStats: {
                    totalOrders: snapshot.summary.totalOrders,
                    userPaidOrders: snapshot.summary.userPaidOrders,
                    refundOrders: snapshot.summary.refundOrders,
                    userPaidRevenue: snapshot.summary.userPaidRevenue,
                    refundTotal: snapshot.summary.refundTotal,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false,
        });
    }
};

export const updateSellerPaidAmountController = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const action = String(req.body?.action || "add").trim().toLowerCase();
        const amount = Number(req.body?.amount);
        const note = String(req.body?.note || "").trim();
        const orderId = String(req.body?.orderId || "").trim();
        const orderIds = Array.isArray(req.body?.orderIds)
            ? req.body.orderIds.map((value) => String(value || "").trim()).filter(Boolean)
            : [];
        const payoutWindowDays = Number(req.body?.payoutWindowDays || 0);

        const access = await ensureSellerAccess(req, sellerId);
        if (access.error) {
            return res.status(access.error.status).json({
                message: access.error.message,
                error: true,
                success: false,
            });
        }

        if (access.actorRole !== "admin") {
            return res.status(403).json({
                message: "Only admin can update payout amount",
                error: true,
                success: false,
            });
        }

        const targetSellerId = access.targetSellerId;

        if (!["add", "set"].includes(action)) {
            return res.status(400).json({
                message: "action must be add or set",
                error: true,
                success: false,
            });
        }

        const hasAutoComputedScope = Boolean(payoutWindowDays || orderIds.length > 0 || orderId);

        if (!hasAutoComputedScope && (!Number.isFinite(amount) || amount < 0)) {
            return res.status(400).json({
                message: "amount must be a valid non-negative number",
                error: true,
                success: false,
            });
        }

        if (orderId && orderIds.length > 0) {
            return res.status(400).json({
                message: "Use either orderId or orderIds, not both",
                error: true,
                success: false,
            });
        }

        if (payoutWindowDays && !PAYOUT_WINDOW_DAYS.has(payoutWindowDays)) {
            return res.status(400).json({
                message: "payoutWindowDays must be one of 7, 15, 30, 90",
                error: true,
                success: false,
            });
        }

        if (orderId && !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                message: "orderId must be a valid ObjectId when provided",
                error: true,
                success: false,
            });
        }

        for (const itemId of orderIds) {
            if (!mongoose.Types.ObjectId.isValid(itemId)) {
                return res.status(400).json({
                    message: "Each orderId in orderIds must be a valid ObjectId",
                    error: true,
                    success: false,
                });
            }
        }

        const seller = await UserModel.findById(targetSellerId).select("_id role").lean();
        if (!seller || seller.role !== "seller") {
            return res.status(404).json({
                message: "Seller not found",
                error: true,
                success: false,
            });
        }

        let effectiveAmount = amount;
        let effectiveOrderIds = [];

        const snapshot = await computeSellerPayoutSnapshot(targetSellerId);
        if (snapshot.error) {
            return res.status(snapshot.error.status).json({
                message: snapshot.error.message,
                error: true,
                success: false,
            });
        }

        const now = new Date();

        if (orderIds.length > 0) {
            const selectedRows = snapshot.rows.filter((row) => orderIds.includes(String(row.id)));

            if (selectedRows.length !== orderIds.length) {
                return res.status(400).json({
                    message: "Some selected orders are invalid for this seller",
                    error: true,
                    success: false,
                });
            }

            const invalidRows = selectedRows.filter((row) => !isRowPayoutEligible(row) || row.payoutMarked);
            if (invalidRows.length > 0) {
                return res.status(400).json({
                    message: "Some selected orders are not payout-eligible or already marked as paid",
                    error: true,
                    success: false,
                });
            }

            effectiveOrderIds = selectedRows.map((row) => String(row.id));
            effectiveAmount = toTwoDecimals(selectedRows.reduce((sum, row) => sum + Number(row.netAfterRefund || 0), 0));
        } else if (payoutWindowDays) {
            const startDate = new Date(now);
            startDate.setDate(startDate.getDate() - payoutWindowDays);

            const eligibleRows = snapshot.rows.filter((row) => {
                const createdAt = new Date(row.createdAt);
                return createdAt >= startDate && isRowPayoutEligible(row) && !row.payoutMarked;
            });

            if (!eligibleRows.length) {
                return res.status(400).json({
                    message: `No eligible unpaid orders found. Only delivered orders older than ${MIN_PAYOUT_HOLD_DAYS} days are payable`,
                    error: true,
                    success: false,
                });
            }

            effectiveOrderIds = eligibleRows.map((row) => String(row.id));
            effectiveAmount = toTwoDecimals(eligibleRows.reduce((sum, row) => sum + Number(row.netAfterRefund || 0), 0));
        }

        if (orderId) {
            const orderDoc = await OrderModel.findById(orderId)
                .populate({
                    path: "products.productId",
                    select: "createdBy",
                })
                .select("paymentStatus refundStatus products")
                .lean();

            if (!orderDoc) {
                return res.status(404).json({
                    message: "Order not found",
                    error: true,
                    success: false,
                });
            }

            const hasSellerItem = Array.isArray(orderDoc.products) && orderDoc.products.some((item) => {
                return String(item?.productId?.createdBy || "") === String(targetSellerId);
            });

            if (!hasSellerItem) {
                return res.status(400).json({
                    message: "Selected order does not belong to this seller",
                    error: true,
                    success: false,
                });
            }

            const paymentStatus = String(orderDoc.paymentStatus || "").toLowerCase();
            if (paymentStatus !== "completed") {
                return res.status(400).json({
                    message: "Order payment is not completed yet",
                    error: true,
                    success: false,
                });
            }

            const refundStatus = String(orderDoc.refundStatus || "none").toLowerCase();
            if (REFUND_SETTLED_STATUSES.has(refundStatus)) {
                return res.status(400).json({
                    message: "Cannot link payout to a refund-settled order",
                    error: true,
                    success: false,
                });
            }

            const linkedRow = snapshot.rows.find((row) => String(row.id) === String(orderId));
            if (!linkedRow || linkedRow.payoutMarked) {
                return res.status(400).json({
                    message: "This order is already marked as paid",
                    error: true,
                    success: false,
                });
            }

            if (!isRowPayoutEligible(linkedRow)) {
                return res.status(400).json({
                    message: linkedRow.payoutBlockedReason || `Order is payout-eligible only after ${MIN_PAYOUT_HOLD_DAYS} days of delivery`,
                    error: true,
                    success: false,
                });
            }

            effectiveOrderIds = [String(orderId)];
            effectiveAmount = toTwoDecimals(Number(linkedRow.netAfterRefund || 0));
        }

        if (!Number.isFinite(effectiveAmount) || effectiveAmount <= 0) {
            return res.status(400).json({
                message: "No payable amount found for selected payout scope",
                error: true,
                success: false,
            });
        }

        let payoutDoc = await SellerPayoutModel.findOne({ sellerId: targetSellerId });
        if (!payoutDoc) {
            payoutDoc = await SellerPayoutModel.create({
                sellerId: targetSellerId,
                grossSales: 0,
                commissionRate: DEFAULT_COMMISSION_RATE,
                commissionAmount: 0,
                netPayout: 0,
                paidAmount: 0,
                payoutDue: 0,
                currency: "INR",
                lastCalculatedAt: new Date(),
            });
        }

        const currentPaidAmount = Number(payoutDoc.paidAmount || 0);
        const netPayout = Number(payoutDoc.netPayout || 0);
        const nextPaidAmount = action === "set" ? effectiveAmount : (currentPaidAmount + effectiveAmount);

        if (nextPaidAmount > netPayout) {
            return res.status(400).json({
                message: "Paid amount cannot exceed net payout",
                error: true,
                success: false,
            });
        }

        payoutDoc.paidAmount = toTwoDecimals(nextPaidAmount);
        payoutDoc.payoutDue = toTwoDecimals(Math.max(0, netPayout - nextPaidAmount));
        await payoutDoc.save();

        const deltaAmount = toTwoDecimals(nextPaidAmount - currentPaidAmount);
        const processor = await UserModel.findById(req.userId).select("name email").lean();

        await SellerPayoutTransactionModel.create({
            sellerId: targetSellerId,
            amount: toTwoDecimals(effectiveAmount),
            deltaAmount,
            action,
            entryType: deltaAmount >= 0 ? "payout" : "adjustment",
            previousPaidAmount: toTwoDecimals(currentPaidAmount),
            newPaidAmount: toTwoDecimals(nextPaidAmount),
            currency: payoutDoc.currency || "INR",
            orderId: orderId ? new mongoose.Types.ObjectId(orderId) : null,
            orderIds: effectiveOrderIds.map((id) => new mongoose.Types.ObjectId(id)),
            payoutWindowDays: payoutWindowDays || null,
            note,
            processedBy: {
                adminId: req.userId,
                adminName: processor?.name || "",
                adminEmail: processor?.email || "",
            },
        });

        return res.status(200).json({
            message: "Seller paid amount updated successfully",
            error: false,
            success: true,
            data: {
                sellerId: String(targetSellerId),
                grossSales: Number(payoutDoc.grossSales || 0),
                commissionRate: Number(payoutDoc.commissionRate || 0),
                commissionAmount: Number(payoutDoc.commissionAmount || 0),
                netPayout: Number(payoutDoc.netPayout || 0),
                paidAmount: Number(payoutDoc.paidAmount || 0),
                payoutDue: Number(payoutDoc.payoutDue || 0),
                deltaAmount,
                coveredOrders: effectiveOrderIds.length,
                currency: payoutDoc.currency || "INR",
                updatedAt: payoutDoc.updatedAt,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false,
        });
    }
};

export const getSellerPayoutDashboardController = async (req, res) => {
    try {
        const requestedSellerId = String(req.query?.sellerId || "").trim();
        const access = await ensureSellerAccess(req, requestedSellerId);

        if (access.error) {
            return res.status(access.error.status).json({
                message: access.error.message,
                error: true,
                success: false,
            });
        }

        if (!access.targetSellerId) {
            const sellers = await UserModel.find({ role: "seller" }).select("_id name email").lean();
            const payoutDocs = await SellerPayoutModel.find({}).select("sellerId grossSales commissionRate commissionAmount netPayout paidAmount payoutDue currency updatedAt").lean();
            const payoutMap = new Map(payoutDocs.map((item) => [String(item.sellerId), item]));

            const sellerWise = sellers.map((seller) => {
                const payout = payoutMap.get(String(seller._id));
                return {
                    sellerId: String(seller._id),
                    sellerName: seller.name || "",
                    sellerEmail: seller.email || "",
                    grossSales: toTwoDecimals(payout?.grossSales || 0),
                    commissionRate: Number(payout?.commissionRate ?? DEFAULT_COMMISSION_RATE),
                    commissionAmount: toTwoDecimals(payout?.commissionAmount || 0),
                    netRevenue: toTwoDecimals(payout?.netPayout || 0),
                    paidAmount: toTwoDecimals(payout?.paidAmount || 0),
                    payoutDue: toTwoDecimals(payout?.payoutDue || 0),
                    currency: payout?.currency || "INR",
                    lastCalculatedAt: payout?.updatedAt || null,
                };
            });

            const totals = sellerWise.reduce((acc, seller) => {
                acc.grossSales += seller.grossSales;
                acc.commissionAmount += seller.commissionAmount;
                acc.netRevenue += seller.netRevenue;
                acc.paidAmount += seller.paidAmount;
                acc.payoutDue += seller.payoutDue;
                return acc;
            }, {
                grossSales: 0,
                commissionAmount: 0,
                netRevenue: 0,
                paidAmount: 0,
                payoutDue: 0,
            });

            return res.status(200).json({
                message: "Seller-wise payout dashboard fetched successfully",
                error: false,
                success: true,
                data: {
                    actorRole: access.actorRole,
                    settings: getPayoutSettings(),
                    sellerWise,
                    totals: {
                        grossSales: toTwoDecimals(totals.grossSales),
                        commissionAmount: toTwoDecimals(totals.commissionAmount),
                        netRevenue: toTwoDecimals(totals.netRevenue),
                        paidAmount: toTwoDecimals(totals.paidAmount),
                        payoutDue: toTwoDecimals(totals.payoutDue),
                    },
                },
            });
        }

        const snapshot = await computeSellerPayoutSnapshot(access.targetSellerId);
        if (snapshot.error) {
            return res.status(snapshot.error.status).json({
                message: snapshot.error.message,
                error: true,
                success: false,
            });
        }

        return res.status(200).json({
            message: "Seller payout dashboard fetched successfully",
            error: false,
            success: true,
            data: {
                actorRole: access.actorRole,
                settings: getPayoutSettings(),
                seller: {
                    id: String(snapshot.seller._id),
                    name: snapshot.seller.name || "",
                    email: snapshot.seller.email || "",
                },
                summary: {
                    ...snapshot.summary,
                    commissionRate: snapshot.commissionRate,
                    currency: snapshot.currency,
                },
                periods: snapshot.periods,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false,
        });
    }
};

export const getSellerOrderPayoutRowsController = async (req, res) => {
    try {
        const requestedSellerId = String(req.query?.sellerId || "").trim();
        const access = await ensureSellerAccess(req, requestedSellerId);

        if (access.error) {
            return res.status(access.error.status).json({
                message: access.error.message,
                error: true,
                success: false,
            });
        }

        if (!access.targetSellerId) {
            return res.status(400).json({
                message: "sellerId is required for this endpoint",
                error: true,
                success: false,
            });
        }

        const pagination = parsePagination(req.query);
        const snapshot = await computeSellerPayoutSnapshot(access.targetSellerId);
        if (snapshot.error) {
            return res.status(snapshot.error.status).json({
                message: snapshot.error.message,
                error: true,
                success: false,
            });
        }

        const tab = String(req.query?.tab || "all").trim().toLowerCase();
        const method = String(req.query?.method || "").trim();
        const searchTerm = String(req.query?.searchTerm || "").trim();

        const baseRows = snapshot.rows || [];
        const tabs = getOrderTabCounts(baseRows);
        const tabFilteredRows = applyOrdersTabFilter(baseRows, tab);
        const filteredRows = applyOrdersSearchAndMethodFilters(tabFilteredRows, method, searchTerm);
        const paymentMethods = Array.from(new Set(tabFilteredRows.map((row) => String(row.paymentMethod || "")).filter(Boolean)));

        const total = filteredRows.length;
        const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
        const paginatedRows = filteredRows.slice(pagination.skip, pagination.skip + pagination.limit);

        return res.status(200).json({
            message: "Seller order payout rows fetched successfully",
            error: false,
            success: true,
            data: {
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total,
                    totalPages,
                },
                filters: {
                    tab,
                    method,
                    searchTerm,
                },
                tabs,
                paymentMethods,
                rows: paginatedRows,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false,
        });
    }
};

export const getSellerPayoutHistoryController = async (req, res) => {
    try {
        const requestedSellerId = String(req.query?.sellerId || "").trim();
        const access = await ensureSellerAccess(req, requestedSellerId);

        if (access.error) {
            return res.status(access.error.status).json({
                message: access.error.message,
                error: true,
                success: false,
            });
        }

        if (!access.targetSellerId) {
            return res.status(400).json({
                message: "sellerId is required for this endpoint",
                error: true,
                success: false,
            });
        }

        const pagination = parsePagination(req.query);
        const total = await SellerPayoutTransactionModel.countDocuments({ sellerId: access.targetSellerId });
        const totalPages = Math.max(1, Math.ceil(total / pagination.limit));

        const history = await SellerPayoutTransactionModel.find({ sellerId: access.targetSellerId })
            .sort({ createdAt: -1, _id: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit)
            .lean();

        return res.status(200).json({
            message: "Seller payout history fetched successfully",
            error: false,
            success: true,
            data: {
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total,
                    totalPages,
                },
                history,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false,
        });
    }
};

export const getSellerPeriodAnalyticsController = async (req, res) => {
    try {
        const requestedSellerId = String(req.query?.sellerId || "").trim();
        const year = Number(req.query?.year || new Date().getFullYear());
        const month = Number(req.query?.month || 0);
        const startDate = req.query?.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query?.endDate ? new Date(req.query.endDate) : null;
        const pagination = parsePagination(req.query);

        const access = await ensureSellerAccess(req, requestedSellerId);
        if (access.error) {
            return res.status(access.error.status).json({
                message: access.error.message,
                error: true,
                success: false,
            });
        }

        if (!access.targetSellerId) {
            return res.status(400).json({
                message: "sellerId is required for this endpoint",
                error: true,
                success: false,
            });
        }

        const snapshot = await computeSellerPayoutSnapshot(access.targetSellerId);
        if (snapshot.error) {
            return res.status(snapshot.error.status).json({
                message: snapshot.error.message,
                error: true,
                success: false,
            });
        }

        const allRows = snapshot.rows || [];
        const sortedByCreatedAt = [...allRows].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const minSelectableDate = sortedByCreatedAt.length > 0
            ? new Date(sortedByCreatedAt[0].createdAt).toISOString().split("T")[0]
            : null;
        const maxSelectableDate = sortedByCreatedAt.length > 0
            ? new Date(sortedByCreatedAt[sortedByCreatedAt.length - 1].createdAt).toISOString().split("T")[0]
            : null;

        let periodRows = snapshot.rows;

        // Remove cancelled orders (❌ No Payout) from analytics and table
        periodRows = periodRows.filter(row => row.rawOrderStatus !== 'cancelled');

        // Filter by date range if provided (takes precedence)
        const hasDateRange = !!(startDate && !Number.isNaN(startDate.getTime())) &&
            !!(endDate && !Number.isNaN(endDate.getTime()));

        if (hasDateRange) {
            const rangeStart = new Date(startDate);
            rangeStart.setHours(0, 0, 0, 0);
            const rangeEnd = new Date(endDate);
            rangeEnd.setHours(23, 59, 59, 999);
            periodRows = periodRows.filter((row) => {
                const rowDate = new Date(row.createdAt);
                return rowDate >= rangeStart && rowDate <= rangeEnd;
            });
        } else if (startDate && !Number.isNaN(new Date(startDate).getTime())) {
            // Only startDate provided
            const rangeStart = new Date(startDate);
            rangeStart.setHours(0, 0, 0, 0);
            periodRows = periodRows.filter((row) => new Date(row.createdAt) >= rangeStart);
        } else if (endDate && !Number.isNaN(new Date(endDate).getTime())) {
            // Only endDate provided
            const rangeEnd = new Date(endDate);
            rangeEnd.setHours(23, 59, 59, 999);
            periodRows = periodRows.filter((row) => new Date(row.createdAt) <= rangeEnd);
        } else {
            // No date range provided, filter by month/year
            if (month > 0 && month <= 12) {
                periodRows = periodRows.filter((row) => {
                    const rowDate = new Date(row.createdAt);
                    return rowDate.getFullYear() === year && rowDate.getMonth() === month - 1;
                });
            } else {
                // No month specified (month === 0), filter by year only
                periodRows = periodRows.filter((row) => {
                    const rowDate = new Date(row.createdAt);
                    return rowDate.getFullYear() === year;
                });
            }
        }

        // Separate active orders from cancelled
        const activeRows = periodRows.filter((row) => row.rawOrderStatus !== "cancelled");
        const cancelledRows = periodRows.filter((row) => row.rawOrderStatus === "cancelled");

        // Calculate breakdown from active orders only (seller's actual earnings)
        const totalSales = toTwoDecimals(activeRows.reduce((sum, row) => sum + Number(row.netAfterRefund || 0), 0));
        const totalRefund = toTwoDecimals(activeRows.reduce((sum, row) => sum + Number(row.refundAmount || 0), 0));
        const totalGross = toTwoDecimals(activeRows.reduce((sum, row) => sum + Number(row.grossSales || 0), 0));

        // Cancelled orders metrics
        const cancelledCount = cancelledRows.length;
        const totalCancelled = toTwoDecimals(cancelledRows.reduce((sum, row) => sum + Number(row.grossSales || 0), 0));

        const totalRows = periodRows.length;
        const totalPages = Math.max(1, Math.ceil(totalRows / pagination.limit));
        const paginatedRows = periodRows.slice(pagination.skip, pagination.skip + pagination.limit);

        return res.status(200).json({
            message: "Seller period analytics fetched successfully",
            error: false,
            success: true,
            data: {
                seller: {
                    id: String(snapshot.seller._id),
                    name: snapshot.seller.name || "",
                    email: snapshot.seller.email || "",
                },
                period: {
                    year,
                    month: month > 0 ? month : null,
                    startDate: startDate ? startDate.toISOString().split("T")[0] : null,
                    endDate: endDate ? endDate.toISOString().split("T")[0] : null,
                },
                availableDateRange: {
                    minDate: minSelectableDate,
                    maxDate: maxSelectableDate,
                },
                analytics: {
                    totalOrders: periodRows.length,
                    activeOrders: activeRows.length,
                    totalGross,
                    totalSales,
                    totalRefund,
                    paidOrders: activeRows.filter((row) => row.userPaymentDone).length,
                    refundedOrders: activeRows.filter((row) => row.isRefunded).length,
                    cancelledCount,
                    totalCancelled,
                    // Returned orders and total return charge
                    returnOrders: activeRows.filter((row) => row.isRefunded).length,
                    returnChargeTotal: activeRows.filter((row) => row.isRefunded).reduce((sum, row) => sum + Number(row.returnChargeAmount || 0), 0),
                },
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total: totalRows,
                    totalPages,
                },
                rows: paginatedRows,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false,
        });
    }
};

export const getSellerPayoutPreviewController = async (req, res) => {
    try {
        const requestedSellerId = String(req.query?.sellerId || "").trim();
        const periodDays = Number(req.query?.periodDays || 7);

        const access = await ensureSellerAccess(req, requestedSellerId);
        if (access.error) {
            return res.status(access.error.status).json({
                message: access.error.message,
                error: true,
                success: false,
            });
        }

        if (!access.targetSellerId) {
            return res.status(400).json({
                message: "sellerId is required for this endpoint",
                error: true,
                success: false,
            });
        }

        // Ensure valid period days
        const effectivePeriodDays = PAYOUT_WINDOW_DAYS.has(periodDays) ? periodDays : 7;

        const snapshot = await computeSellerPayoutSnapshot(access.targetSellerId);
        if (snapshot.error) {
            return res.status(snapshot.error.status).json({
                message: snapshot.error.message,
                error: true,
                success: false,
            });
        }

        const allRows = snapshot.rows || [];
        // Filter eligible unpaid orders
        const eligibleOrders = allRows.filter(
            (row) => isRowPayoutEligible(row) && !row.payoutMarked
        );

        if (eligibleOrders.length === 0) {
            return res.status(200).json({
                message: "Payout preview calculated successfully",
                error: false,
                success: true,
                data: {
                    settings: getPayoutSettings(),
                    periodDays: effectivePeriodDays,
                    orders: [],
                    orderIds: [],
                    amount: 0,
                    note: `Only delivered orders older than ${MIN_PAYOUT_HOLD_DAYS} days are eligible for payout`,
                },
            });
        }

        // Sort by date to find oldest
        const sortedByDate = [...eligibleOrders].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Get the oldest order date
        const oldestOrder = sortedByDate[0];
        const oldestDate = new Date(oldestOrder.createdAt);

        // Normalize to start of day (midnight UTC)
        const startDate = new Date(
            Date.UTC(oldestDate.getUTCFullYear(), oldestDate.getUTCMonth(), oldestDate.getUTCDate(), 0, 0, 0, 0)
        );

        // Calculate end date: oldest date + period days (end of day UTC)
        const endDateObj = new Date(startDate);
        endDateObj.setUTCDate(endDateObj.getUTCDate() + effectivePeriodDays);
        const endDate = new Date(
            Date.UTC(
                endDateObj.getUTCFullYear(),
                endDateObj.getUTCMonth(),
                endDateObj.getUTCDate(),
                23,
                59,
                59,
                999
            )
        );

        // Filter orders between oldest date and (oldest date + period days)
        const filteredOrders = eligibleOrders.filter((item) => {
            const itemDate = new Date(item.createdAt).getTime();
            return itemDate >= startDate.getTime() && itemDate <= endDate.getTime();
        });

        const totalAmount = toTwoDecimals(
            filteredOrders.reduce((sum, item) => sum + Number(item.netAfterRefund || 0), 0)
        );

        return res.status(200).json({
            message: "Payout preview calculated successfully",
            error: false,
            success: true,
            data: {
                settings: getPayoutSettings(),
                periodDays: effectivePeriodDays,
                orders: filteredOrders,
                orderIds: filteredOrders.map((item) => String(item.id)),
                amount: totalAmount,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false,
        });
    }
};
