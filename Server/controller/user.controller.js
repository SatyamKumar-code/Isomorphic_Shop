import express from 'express';
import UserModel from '../models/user.model.js';
import OrderModel from '../models/order.model.js';
import ProductModel from '../models/product.model.js';
import SellerPayoutModel from '../models/sellerPayout.model.js';
import SellerLocationModel from '../models/sellerLocation.model.js';
import SellerSocialLinksModel from '../models/sellerSocialLinks.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import generateAccessToken from '../utils/generateAccessToken.js';
import generateRefreshToken from '../utils/generateRefreshToken.js';
import sendEmailFun from '../config/sendEmail.js';
import VerificationEmail from '../utils/verifyEmailTemplate.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { log } from 'console';

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
});

const SHORT_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatDateDisplay = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}.${month}.${date.getFullYear()}`;
};

const formatCompactNumber = (value) => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}m`;
    }

    if (value >= 1000) {
        return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    }

    return String(Math.round(value));
};

const getSellerCommissionRate = () => {
    const rawRate = Number.parseFloat(process.env.SELLER_COMMISSION_RATE || "10");
    if (!Number.isFinite(rawRate)) {
        return 10;
    }

    return Math.max(0, Math.min(100, rawRate));
};

const getAvailableYears = (users, orders) => {
    const years = new Set();

    users.forEach((user) => {
        const date = new Date(user.createdAt);
        if (!Number.isNaN(date.getTime())) {
            years.add(date.getFullYear());
        }
    });

    orders.forEach((order) => {
        const date = new Date(order.createdAt);
        if (!Number.isNaN(date.getTime())) {
            years.add(date.getFullYear());
        }
    });

    if (!years.size) {
        years.add(new Date().getFullYear());
    }

    return Array.from(years).sort((a, b) => a - b);
};

const getAvailableMonthsByYear = (users, orders) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthsByYear = new Map();

    const addDate = (value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return;
        }

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        if (year === currentYear && month > currentMonth) {
            return;
        }

        const existing = monthsByYear.get(year) || new Set();
        existing.add(month);
        monthsByYear.set(year, existing);
    };

    users.forEach((user) => addDate(user.createdAt));
    orders.forEach((order) => addDate(order.createdAt));

    return Array.from(monthsByYear.entries()).reduce((accumulator, [year, months]) => {
        accumulator[year] = Array.from(months).sort((a, b) => a - b);
        return accumulator;
    }, {});
};

const getPeriodConfig = ({ period, year, month, availableYears, availableMonthsByYear }) => {
    const now = new Date();
    const normalizedPeriod = ["7days", "daywise", "month", "year"].includes(period) ? period : "7days";

    const defaultYear = now.getFullYear();
    const fallbackYear = availableYears.includes(defaultYear) ? defaultYear : availableYears[availableYears.length - 1] || defaultYear;
    const selectedYear = Number.isInteger(year) && availableYears.includes(year) ? year : fallbackYear;
    const availableMonthsForSelectedYear = Array.isArray(availableMonthsByYear?.[selectedYear])
        ? availableMonthsByYear[selectedYear]
        : [];
    const fallbackMonth = availableMonthsForSelectedYear.includes(now.getMonth() + 1)
        ? (now.getMonth() + 1)
        : (availableMonthsForSelectedYear[availableMonthsForSelectedYear.length - 1] || (now.getMonth() + 1));
    const selectedMonth = Number.isInteger(month) && availableMonthsForSelectedYear.includes(month) ? month : fallbackMonth;

    if (normalizedPeriod === "year") {
        return {
            period: normalizedPeriod,
            selectedYear,
            selectedMonth,
            periodLabel: "Year-wise",
            ranges: [{ label: "All Years", value: "All Years" }],
            activeRange: "All Years",
            xLabels: availableYears.map((value) => String(value)),
        };
    }

    if (normalizedPeriod === "month") {
        return {
            period: normalizedPeriod,
            selectedYear,
            selectedMonth,
            periodLabel: `${selectedYear} (Month-wise)`,
            ranges: [{ label: `${selectedYear}`, value: `${selectedYear}` }],
            activeRange: `${selectedYear}`,
            xLabels: SHORT_MONTH_NAMES,
        };
    }

    if (normalizedPeriod === "daywise") {
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const label = `${SHORT_MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
        return {
            period: normalizedPeriod,
            selectedYear,
            selectedMonth,
            periodLabel: `${label} (Day-wise)`,
            ranges: [{ label, value: label }],
            activeRange: label,
            xLabels: Array.from({ length: daysInMonth }, (_, index) => String(index + 1)),
        };
    }

    return {
        period: normalizedPeriod,
        selectedYear,
        selectedMonth,
        periodLabel: "Last 7 days",
        ranges: [
            { label: "This week", value: "This week" },
            { label: "Last week", value: "Last week" },
        ],
        activeRange: "This week",
        xLabels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    };
};

const getComparisonWindow = (periodConfig) => {
    const now = new Date();

    if (periodConfig.period === "month") {
        const currentStart = new Date(periodConfig.selectedYear, 0, 1, 0, 0, 0, 0);
        const currentEnd = new Date(periodConfig.selectedYear, 11, 31, 23, 59, 59, 999);
        const previousStart = new Date(periodConfig.selectedYear - 1, 0, 1, 0, 0, 0, 0);
        const previousEnd = new Date(periodConfig.selectedYear - 1, 11, 31, 23, 59, 59, 999);
        return { currentStart, currentEnd, previousStart, previousEnd };
    }

    if (periodConfig.period === "daywise") {
        const currentStart = new Date(periodConfig.selectedYear, periodConfig.selectedMonth - 1, 1, 0, 0, 0, 0);
        const currentEnd = new Date(periodConfig.selectedYear, periodConfig.selectedMonth, 0, 23, 59, 59, 999);
        const previousStart = new Date(periodConfig.selectedYear, periodConfig.selectedMonth - 2, 1, 0, 0, 0, 0);
        const previousEnd = new Date(periodConfig.selectedYear, periodConfig.selectedMonth - 1, 0, 23, 59, 59, 999);
        return { currentStart, currentEnd, previousStart, previousEnd };
    }

    if (periodConfig.period === "year") {
        const firstYear = Number(periodConfig.xLabels[0] || now.getFullYear());
        const lastYear = Number(periodConfig.xLabels[periodConfig.xLabels.length - 1] || now.getFullYear());
        const currentStart = new Date(firstYear, 0, 1, 0, 0, 0, 0);
        const currentEnd = new Date(lastYear, 11, 31, 23, 59, 59, 999);
        const previousStart = new Date(firstYear - 1, 0, 1, 0, 0, 0, 0);
        const previousEnd = new Date(lastYear - 1, 11, 31, 23, 59, 59, 999);
        return { currentStart, currentEnd, previousStart, previousEnd };
    }

    const currentEnd = new Date(now);
    currentEnd.setHours(23, 59, 59, 999);
    const currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() - 6);
    currentStart.setHours(0, 0, 0, 0);

    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);

    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 6);
    previousStart.setHours(0, 0, 0, 0);

    return { currentStart, currentEnd, previousStart, previousEnd };
};

const buildSeries = ({ users, orders, secondOrderDateByUser, buckets }) => {
    const series = {
        activeCustomers: [],
        repeatCustomers: [],
        shopVisitor: [],
        conversionRate: [],
    };

    buckets.forEach((bucket) => {
        const safeStart = new Date(bucket.start);
        const safeEnd = new Date(bucket.end);

        if (Number.isNaN(safeStart.getTime()) || Number.isNaN(safeEnd.getTime())) {
            return;
        }

        const activeCustomers = users.filter((user) => {
            const createdAt = new Date(user.createdAt);
            return user.status === "Active" && createdAt >= safeStart && createdAt <= safeEnd;
        }).length;

        const repeatCustomers = users.filter((user) => {
            const secondOrderDate = secondOrderDateByUser.get(String(user.uid));
            return secondOrderDate instanceof Date && secondOrderDate >= safeStart && secondOrderDate <= safeEnd;
        }).length;

        const shopVisitor = orders.filter((order) => {
            const orderDate = new Date(order.createdAt);
            return !Number.isNaN(orderDate.getTime()) && orderDate >= safeStart && orderDate <= safeEnd;
        }).length;

        const conversionRate = activeCustomers ? Number(((shopVisitor / activeCustomers) * 100).toFixed(1)) : 0;

        series.activeCustomers.push(activeCustomers);
        series.repeatCustomers.push(repeatCustomers);
        series.shopVisitor.push(shopVisitor);
        series.conversionRate.push(conversionRate);
    });

    return series;
};

const isCurrentMonthAndYear = (year, month, now) => year === now.getFullYear() && month === (now.getMonth() + 1);

const buildBucketsForPeriod = ({ periodConfig, comparisonWindow, users, orders }) => {
    const now = new Date();

    if (periodConfig.period === "year") {
        const yearsWithData = new Set();

        users.forEach((user) => {
            const date = new Date(user.createdAt);
            if (!Number.isNaN(date.getTime())) {
                yearsWithData.add(date.getFullYear());
            }
        });

        orders.forEach((order) => {
            const date = new Date(order.createdAt);
            if (!Number.isNaN(date.getTime())) {
                yearsWithData.add(date.getFullYear());
            }
        });

        const years = periodConfig.xLabels
            .map((value) => Number(value))
            .filter((year) => Number.isInteger(year) && yearsWithData.has(year));

        return years.map((year) => ({
            label: String(year),
            start: new Date(year, 0, 1, 0, 0, 0, 0),
            end: new Date(year, 11, 31, 23, 59, 59, 999),
        }));
    }

    if (periodConfig.period === "month") {
        const maxMonth = periodConfig.selectedYear === now.getFullYear() ? (now.getMonth() + 1) : 12;
        const monthsWithData = new Set();

        users.forEach((user) => {
            const date = new Date(user.createdAt);
            if (!Number.isNaN(date.getTime()) && date.getFullYear() === periodConfig.selectedYear) {
                const month = date.getMonth() + 1;
                if (month <= maxMonth) {
                    monthsWithData.add(month);
                }
            }
        });

        orders.forEach((order) => {
            const date = new Date(order.createdAt);
            if (!Number.isNaN(date.getTime()) && date.getFullYear() === periodConfig.selectedYear) {
                const month = date.getMonth() + 1;
                if (month <= maxMonth) {
                    monthsWithData.add(month);
                }
            }
        });

        return Array.from(monthsWithData)
            .sort((a, b) => a - b)
            .map((month) => ({
                label: SHORT_MONTH_NAMES[month - 1],
                start: new Date(periodConfig.selectedYear, month - 1, 1, 0, 0, 0, 0),
                end: isCurrentMonthAndYear(periodConfig.selectedYear, month, now)
                    ? new Date(now)
                    : new Date(periodConfig.selectedYear, month, 0, 23, 59, 59, 999),
            }));
    }

    if (periodConfig.period === "daywise") {
        const daysInMonth = new Date(periodConfig.selectedYear, periodConfig.selectedMonth, 0).getDate();
        const maxDay = isCurrentMonthAndYear(periodConfig.selectedYear, periodConfig.selectedMonth, now)
            ? now.getDate()
            : daysInMonth;

        return Array.from({ length: Math.max(0, maxDay) }, (_, index) => {
            const day = index + 1;
            const start = new Date(periodConfig.selectedYear, periodConfig.selectedMonth - 1, day, 0, 0, 0, 0);
            const end = new Date(periodConfig.selectedYear, periodConfig.selectedMonth - 1, day, 23, 59, 59, 999);

            return {
                label: String(day),
                start,
                end: isCurrentMonthAndYear(periodConfig.selectedYear, periodConfig.selectedMonth, now) && day === now.getDate()
                    ? new Date(now)
                    : end,
            };
        });
    }

    return Array.from({ length: 7 }, (_, index) => {
        const start = new Date(comparisonWindow.currentStart);
        start.setDate(comparisonWindow.currentStart.getDate() + index);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setHours(23, 59, 59, 999);

        return {
            label: SHORT_DAY_NAMES[start.getDay()],
            start,
            end,
        };
    });
};

const buildLastWeekBuckets = (comparisonWindow) => {
    return Array.from({ length: 7 }, (_, index) => {
        const start = new Date(comparisonWindow.previousStart);
        start.setDate(comparisonWindow.previousStart.getDate() + index);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setHours(23, 59, 59, 999);

        return {
            label: SHORT_DAY_NAMES[start.getDay()],
            start,
            end,
        };
    });
};

const formatChangePercentage = (currentValue, previousValue) => {
    if (!previousValue) {
        if (!currentValue) {
            return "0.0%";
        }

        return "+100.0%";
    }

    const percentage = ((currentValue - previousValue) / previousValue) * 100;
    const rounded = percentage.toFixed(1);

    if (percentage > 0) {
        return `+${rounded}%`;
    }

    return `${rounded}%`;
};

const getAccessModeFromRole = (role) => {
    if (role === "admin") {
        return "admin-global";
    }

    if (role === "seller") {
        return "seller-scoped";
    }

    return "user";
};

const getSellerLocation = async (userId, role) => {
    if (!['admin', 'seller'].includes(role)) {
        return '';
    }

    const sellerLocation = await SellerLocationModel.findOne({ userId }).select('location').lean();
    return sellerLocation?.location || '';
};

const getSellerSocialLinks = async (userId, role) => {
    if (!['admin', 'seller'].includes(role)) {
        return {
            instagramLink: '',
            facebookLink: '',
            whatsappNumber: '',
        };
    }

    const socialLinks = await SellerSocialLinksModel.findOne({ userId })
        .select('instagramLink facebookLink whatsappNumber')
        .lean();

    return {
        instagramLink: socialLinks?.instagramLink || '',
        facebookLink: socialLinks?.facebookLink || '',
        whatsappNumber: socialLinks?.whatsappNumber || '',
    };
};

const buildUserResponse = async (user) => ({
    ...user.toObject(),
    location: await getSellerLocation(user._id, user.role),
    socialLinks: await getSellerSocialLinks(user._id, user.role),
    accessMode: getAccessModeFromRole(user.role),
});

const hasGlobalAdminAccess = async (adminId) => {
    if (!adminId) {
        return false;
    }

    const admin = await UserModel.findById(adminId).select("role").lean();
    return Boolean(admin?.role === "admin");
};

const getAdminOwnedProductIds = async (adminId) => {
    if (!adminId) {
        return [];
    }

    const globalAccess = await hasGlobalAdminAccess(adminId);
    const products = await ProductModel.find(globalAccess ? {} : { createdBy: adminId }).select("_id").lean();
    return products.map((product) => product._id);
};

const isCustomerRelatedToAdmin = async (adminId, customerId) => {
    const globalAccess = await hasGlobalAdminAccess(adminId);
    if (globalAccess) {
        return true;
    }

    const ownedProductIds = await getAdminOwnedProductIds(adminId);
    if (!ownedProductIds.length) {
        return false;
    }

    const relatedOrderCount = await OrderModel.countDocuments({
        userId: customerId,
        "products.productId": { $in: ownedProductIds },
    });

    return relatedOrderCount > 0;
};

export const getCustomersController = async (req, res) => {
    try {
        const adminId = req.userId;
        const roleFilter = String(req.query?.role || "user").trim().toLowerCase() === "seller" ? "seller" : "user";
        const isSellerMode = roleFilter === "seller";
        const entityPlural = isSellerMode ? "Sellers" : "Customers";
        const idPrefix = isSellerMode ? "#SELL" : "#CUST";
        const requestedYear = Number.parseInt(req.query?.year, 10);
        const requestedMonth = Number.parseInt(req.query?.month, 10);
        const requestedPage = Number.parseInt(req.query?.page, 10);
        const requestedLimit = Number.parseInt(req.query?.limit, 10);
        const searchText = String(req.query?.search || "").trim().toLowerCase();
        const fromDate = String(req.query?.fromDate || "").trim();
        const toDate = String(req.query?.toDate || "").trim();
        const productsCountMin = Number.parseFloat(req.query?.productsCountMin);
        const productsCountMax = Number.parseFloat(req.query?.productsCountMax);
        const totalSalesMin = Number.parseFloat(req.query?.totalSalesMin);
        const totalSalesMax = Number.parseFloat(req.query?.totalSalesMax);
        const rawStatusFilter = String(req.query?.status || "all").trim().toLowerCase();
        const statusFilter = rawStatusFilter === "inactive" ? "blocked" : rawStatusFilter;
        const orderSort = String(req.query?.orderSort || "none").trim().toLowerCase();
        const spendSort = String(req.query?.spendSort || "none").trim().toLowerCase();

        const parseDateFilter = (value, useEndOfDay = false) => {
            if (!value) return null;
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return null;
            if (useEndOfDay) {
                date.setHours(23, 59, 59, 999);
            } else {
                date.setHours(0, 0, 0, 0);
            }
            return date;
        };

        const filterFromDate = parseDateFilter(fromDate, false);
        const filterToDate = parseDateFilter(toDate, true);

        const ownedProductIds = await getAdminOwnedProductIds(adminId);
        if (!isSellerMode && !ownedProductIds.length) {
            return res.status(200).json({
                message: `${entityPlural} analytics fetched successfully`,
                error: false,
                success: true,
                data: {
                    summaryCards: [],
                    overviewStats: [],
                    weekSeries: {
                        "This week": {
                            activeCustomers: [],
                            repeatCustomers: [],
                            shopVisitor: [],
                            conversionRate: [],
                        },
                        "Last week": {
                            activeCustomers: [],
                            repeatCustomers: [],
                            shopVisitor: [],
                            conversionRate: [],
                        },
                    },
                    ranges: [{ label: "This week", value: "This week" }, { label: "Last week", value: "Last week" }],
                    periodLabel: "Last 7 days",
                    xLabelsByRange: {},
                    period: "7days",
                    selectedYear: new Date().getFullYear(),
                    selectedMonth: new Date().getMonth() + 1,
                    availableYears: [new Date().getFullYear()],
                    availableMonths: [new Date().getMonth() + 1],
                    customers: [],
                    allCustomers: [],
                    pagination: {
                        page: 1,
                        limit: Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 10,
                        totalCount: 0,
                        totalPages: 1,
                    },
                },
            });
        }

        let users = [];
        let orders = [];
        let sellerProductCountById = new Map();
        let sellerTotalSalesById = new Map();
        let sellerRevenueById = new Map();
        let sellerPayoutSnapshotById = new Map();
        let sellerOrderStatsById = new Map();

        if (isSellerMode) {
            users = await UserModel.find({ role: "seller" })
                .select("-password -refresh_token -otp -otp_expiry")
                .sort({ createdAt: -1 })
                .lean();

            const sellerIds = users.map((user) => user._id);
            if (sellerIds.length) {
                const sellerCommissionRate = getSellerCommissionRate();
                const existingPayoutDocs = await SellerPayoutModel.find({ sellerId: { $in: sellerIds } })
                    .select("sellerId paidAmount")
                    .lean();
                const existingPayoutBySellerId = new Map(
                    existingPayoutDocs.map((item) => [String(item.sellerId), Number(item.paidAmount || 0)]),
                );

                const sellerProducts = await ProductModel.find({ createdBy: { $in: sellerIds } })
                    .select("_id createdBy sales price")
                    .lean();

                const productOwnerById = new Map();
                const productPriceById = new Map();
                const sellerProductIds = [];

                sellerProducts.forEach((product) => {
                    const sellerId = String(product.createdBy || "");
                    if (!sellerId) return;

                    const productId = String(product._id || "");
                    if (!productId) return;

                    productOwnerById.set(productId, sellerId);
                    productPriceById.set(productId, Number(product.price || 0));
                    sellerProductIds.push(product._id);

                    const currentCount = sellerProductCountById.get(sellerId) || 0;
                    sellerProductCountById.set(sellerId, currentCount + 1);

                    const currentSales = sellerTotalSalesById.get(sellerId) || 0;
                    sellerTotalSalesById.set(sellerId, currentSales + Number(product.sales || 0));
                });

                if (sellerProductIds.length) {
                    orders = await OrderModel.find({ "products.productId": { $in: sellerProductIds } })
                        .select("products status createdAt")
                        .sort({ createdAt: -1 })
                        .lean();

                    orders.forEach((order) => {
                        const orderId = String(order._id || "");
                        const createdAt = new Date(order.createdAt);
                        const status = String(order.status || "").toLowerCase();
                        const uniqueSellerIdsForOrder = new Set();
                        const revenueBySellerForOrder = new Map();

                        (Array.isArray(order.products) ? order.products : []).forEach((item) => {
                            const productId = String(item?.productId || "");
                            const sellerId = productOwnerById.get(productId);
                            if (sellerId) {
                                uniqueSellerIdsForOrder.add(sellerId);

                                if (status !== "cancelled") {
                                    const quantity = Number(item?.quantity || 0);
                                    const price = Number(productPriceById.get(productId) || 0);
                                    const lineAmount = quantity * price;
                                    const currentLineAmount = revenueBySellerForOrder.get(sellerId) || 0;
                                    revenueBySellerForOrder.set(sellerId, currentLineAmount + lineAmount);
                                }
                            }
                        });

                        revenueBySellerForOrder.forEach((amount, sellerId) => {
                            const currentRevenue = sellerRevenueById.get(sellerId) || 0;
                            sellerRevenueById.set(sellerId, currentRevenue + Number(amount || 0));
                        });

                        uniqueSellerIdsForOrder.forEach((sellerId) => {
                            const current = sellerOrderStatsById.get(sellerId) || {
                                orderIds: new Set(),
                                completedOrderIds: new Set(),
                                canceledOrderIds: new Set(),
                                lastPurchaseDate: null,
                            };

                            current.orderIds.add(orderId);
                            if (status === "delivered") {
                                current.completedOrderIds.add(orderId);
                            }
                            if (status === "cancelled") {
                                current.canceledOrderIds.add(orderId);
                            }
                            if (!Number.isNaN(createdAt.getTime()) && (!current.lastPurchaseDate || createdAt > current.lastPurchaseDate)) {
                                current.lastPurchaseDate = createdAt;
                            }

                            sellerOrderStatsById.set(sellerId, current);
                        });
                    });
                }

                const payoutWrites = users.map((seller) => {
                    const sellerId = String(seller._id || "");
                    const grossSales = Number(sellerRevenueById.get(sellerId) || sellerTotalSalesById.get(sellerId) || 0);
                    const commissionAmount = Number(((grossSales * sellerCommissionRate) / 100).toFixed(2));
                    const netPayout = Number(Math.max(0, grossSales - commissionAmount).toFixed(2));
                    const paidAmount = Number(existingPayoutBySellerId.get(sellerId) || 0);
                    const payoutDue = Number(Math.max(0, netPayout - paidAmount).toFixed(2));

                    sellerPayoutSnapshotById.set(sellerId, {
                        grossSales,
                        commissionRate: sellerCommissionRate,
                        commissionAmount,
                        netPayout,
                        paidAmount,
                        payoutDue,
                    });

                    return {
                        updateOne: {
                            filter: { sellerId: seller._id },
                            update: {
                                $set: {
                                    grossSales,
                                    commissionRate: sellerCommissionRate,
                                    commissionAmount,
                                    netPayout,
                                    payoutDue,
                                    lastCalculatedAt: new Date(),
                                },
                                $setOnInsert: {
                                    paidAmount: 0,
                                    currency: "INR",
                                },
                            },
                            upsert: true,
                        },
                    };
                });

                if (payoutWrites.length) {
                    await SellerPayoutModel.bulkWrite(payoutWrites);
                }
            }
        } else {
            const relatedUserIds = await OrderModel.distinct("userId", {
                "products.productId": { $in: ownedProductIds },
            });

            users = await UserModel.find({ role: "user", _id: { $in: relatedUserIds } })
                .select("-password -refresh_token -otp -otp_expiry")
                .sort({ createdAt: -1 })
                .lean();

            const userIds = users.map((user) => user._id);
            orders = userIds.length
                ? await OrderModel.find({ userId: { $in: userIds }, "products.productId": { $in: ownedProductIds } })
                    .select("userId totalAmount status createdAt")
                    .sort({ createdAt: -1 })
                    .lean()
                : [];
        }

        const availableYears = getAvailableYears(users, orders);
        const availableMonthsByYear = getAvailableMonthsByYear(users, orders);
        const periodConfig = getPeriodConfig({
            period: req.query?.period,
            year: Number.isInteger(requestedYear) ? requestedYear : null,
            month: Number.isInteger(requestedMonth) ? requestedMonth : null,
            availableYears,
            availableMonthsByYear,
        });
        const availableMonths = Array.isArray(availableMonthsByYear?.[periodConfig.selectedYear])
            ? availableMonthsByYear[periodConfig.selectedYear]
            : [];
        const comparisonWindow = getComparisonWindow(periodConfig);

        const orderStatsByUser = orders.reduce((accumulator, order) => {
            const key = String(order.userId);
            const current = accumulator.get(key) || {
                orderCount: 0,
                totalSpend: 0,
                completedOrders: 0,
                canceledOrders: 0,
                firstOrderDate: null,
                lastPurchaseDate: null,
            };

            const orderDate = new Date(order.createdAt);
            current.orderCount += 1;
            current.totalSpend += Number(order.totalAmount || 0);
            current.completedOrders += order.status === "delivered" ? 1 : 0;
            current.canceledOrders += order.status === "cancelled" ? 1 : 0;
            current.firstOrderDate = current.firstOrderDate && current.firstOrderDate < orderDate ? current.firstOrderDate : orderDate;
            current.lastPurchaseDate = current.lastPurchaseDate && current.lastPurchaseDate > orderDate ? current.lastPurchaseDate : orderDate;

            accumulator.set(key, current);
            return accumulator;
        }, new Map());

        const orderDatesByUser = orders.reduce((accumulator, order) => {
            const key = String(order.userId);
            const current = accumulator.get(key) || [];
            const orderDate = new Date(order.createdAt);

            if (!Number.isNaN(orderDate.getTime())) {
                current.push(orderDate);
            }

            accumulator.set(key, current);
            return accumulator;
        }, new Map());

        const secondOrderDateByUser = new Map();
        orderDatesByUser.forEach((dates, userId) => {
            if (!Array.isArray(dates) || dates.length < 2) {
                return;
            }

            const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
            secondOrderDateByUser.set(userId, sortedDates[1]);
        });

        const customers = users.map((user, index) => {
            const userId = String(user._id || "");
            const stats = orderStatsByUser.get(String(user._id)) || {};

            let sellerOrderCount = 0;
            let sellerCompletedOrderCount = 0;
            let sellerCanceledOrderCount = 0;
            let sellerLastOrderDate = null;

            if (isSellerMode && Array.isArray(orders) && orders.length) {
                const sellerStats = sellerOrderStatsById.get(userId);
                if (sellerStats) {
                    sellerOrderCount = sellerStats.orderIds?.size || 0;
                    sellerCompletedOrderCount = sellerStats.completedOrderIds?.size || 0;
                    sellerCanceledOrderCount = sellerStats.canceledOrderIds?.size || 0;
                    sellerLastOrderDate = sellerStats.lastPurchaseDate || null;
                }
            }

            const resolvedOrderCount = isSellerMode ? sellerOrderCount : (stats.orderCount || 0);
            const resolvedTotalSales = isSellerMode
                ? Number(sellerRevenueById.get(userId) || sellerTotalSalesById.get(userId) || 0)
                : (stats.totalSpend || 0);
            const payoutSnapshot = sellerPayoutSnapshotById.get(userId) || null;
            const resolvedPaidAmount = isSellerMode ? Number(payoutSnapshot?.paidAmount || 0) : 0;
            const resolvedPayoutAmount = isSellerMode ? Number(payoutSnapshot?.payoutDue || 0) : 0;
            const resolvedCommissionRate = isSellerMode ? Number(payoutSnapshot?.commissionRate || 0) : 0;
            const resolvedCommissionAmount = isSellerMode ? Number(payoutSnapshot?.commissionAmount || 0) : 0;
            const resolvedNetPayout = isSellerMode ? Number(payoutSnapshot?.netPayout || 0) : 0;
            const resolvedCompletedOrders = isSellerMode ? sellerCompletedOrderCount : (stats.completedOrders || 0);
            const resolvedCanceledOrders = isSellerMode ? sellerCanceledOrderCount : (stats.canceledOrders || 0);
            const resolvedLastDate = isSellerMode ? (sellerLastOrderDate || user.createdAt) : (stats.lastPurchaseDate || user.createdAt);

            return {
                uid: String(user._id),
                id: `${idPrefix}${String(index + 1).padStart(4, "0")}`,
                name: user.name || "",
                email: user.email || "",
                phone: user.mobile ? `+${user.mobile}` : "-",
                orderCount: resolvedOrderCount,
                totalSpend: resolvedTotalSales,
                status: user.status === "Inactive" ? "Blocked" : (user.status || "Blocked"),
                address: user.address || "-",
                totalOrders: resolvedOrderCount,
                completedOrders: resolvedCompletedOrders,
                canceledOrders: resolvedCanceledOrders,
                registrationDate: formatDateDisplay(user.createdAt),
                lastPurchaseDate: formatDateDisplay(resolvedLastDate),
                lastLoginDate: formatDateDisplay(user.last_login_date),
                productsCount: Number(sellerProductCountById.get(userId) || 0),
                totalSales: resolvedTotalSales,
                paidAmount: resolvedPaidAmount,
                payoutAmount: resolvedPayoutAmount,
                commissionRate: resolvedCommissionRate,
                commissionAmount: resolvedCommissionAmount,
                netPayout: resolvedNetPayout,
                supportNote: user.support_note || "",
                supportNoteUpdatedAt: user.support_note_updated_at || null,
                supportNoteUpdatedBy: user.support_note_updated_by
                    ? {
                        adminId: user.support_note_updated_by.adminId || null,
                        adminName: user.support_note_updated_by.adminName || "",
                        adminEmail: user.support_note_updated_by.adminEmail || "",
                    }
                    : null,
                supportNoteHistory: Array.isArray(user.support_note_history)
                    ? user.support_note_history.map((entry) => ({
                        note: entry?.note || "",
                        updatedAt: entry?.updatedAt || null,
                        updatedBy: entry?.updatedBy
                            ? {
                                adminId: entry.updatedBy.adminId || null,
                                adminName: entry.updatedBy.adminName || "",
                                adminEmail: entry.updatedBy.adminEmail || "",
                            }
                            : null,
                    }))
                    : [],
                createdAt: user.createdAt,
                firstOrderDate: isSellerMode ? user.createdAt : stats.firstOrderDate,
            };
        });

        const filteredCustomers = customers.filter((customer) => {
            const createdAt = new Date(customer.createdAt);
            const isBeforeFromDate = filterFromDate && createdAt < filterFromDate;
            const isAfterToDate = filterToDate && createdAt > filterToDate;

            if (isBeforeFromDate || isAfterToDate) {
                return false;
            }

            if (isSellerMode) {
                const currentProductsCount = Number(customer.productsCount || 0);
                const currentTotalSales = Number(customer.totalSales || customer.totalSpend || 0);

                if (Number.isFinite(productsCountMin) && currentProductsCount < productsCountMin) {
                    return false;
                }

                if (Number.isFinite(productsCountMax) && currentProductsCount > productsCountMax) {
                    return false;
                }

                if (Number.isFinite(totalSalesMin) && currentTotalSales < totalSalesMin) {
                    return false;
                }

                if (Number.isFinite(totalSalesMax) && currentTotalSales > totalSalesMax) {
                    return false;
                }
            }

            const matchesStatus = statusFilter === "all"
                ? true
                : String(customer.status || "").toLowerCase() === statusFilter;

            if (!matchesStatus) {
                return false;
            }

            if (!searchText) {
                return true;
            }

            const fields = [
                customer.id,
                customer.name,
                customer.email,
                customer.phone,
                customer.address,
                customer.status,
            ];

            return fields.some((value) => String(value || "").toLowerCase().includes(searchText));
        });

        const sortedCustomers = [...filteredCustomers].sort((a, b) => {
            const orderDiff = Number(a.orderCount || 0) - Number(b.orderCount || 0);
            const spendDiff = Number(a.totalSpend || 0) - Number(b.totalSpend || 0);

            if (orderSort === "asc" && orderDiff !== 0) {
                return orderDiff;
            }

            if (orderSort === "desc" && orderDiff !== 0) {
                return -orderDiff;
            }

            if (spendSort === "asc" && spendDiff !== 0) {
                return spendDiff;
            }

            if (spendSort === "desc" && spendDiff !== 0) {
                return -spendDiff;
            }

            return 0;
        });

        const safeLimit = Number.isInteger(requestedLimit) && requestedLimit > 0
            ? Math.min(requestedLimit, 100)
            : 10;
        const totalCount = sortedCustomers.length;
        const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit));
        const safePage = Number.isInteger(requestedPage) && requestedPage > 0
            ? Math.min(requestedPage, totalPages)
            : 1;
        const startIndex = (safePage - 1) * safeLimit;
        const paginatedCustomers = sortedCustomers.slice(startIndex, startIndex + safeLimit);

        const thisPeriodUsers = users.filter((user) => {
            const createdAt = new Date(user.createdAt);
            return createdAt >= comparisonWindow.currentStart && createdAt <= comparisonWindow.currentEnd;
        }).length;

        const previousPeriodUsers = users.filter((user) => {
            const createdAt = new Date(user.createdAt);
            return createdAt >= comparisonWindow.previousStart && createdAt <= comparisonWindow.previousEnd;
        }).length;

        const thisPeriodOrders = orders.filter((order) => {
            const createdAt = new Date(order.createdAt);
            return createdAt >= comparisonWindow.currentStart && createdAt <= comparisonWindow.currentEnd;
        }).length;

        const previousPeriodOrders = orders.filter((order) => {
            const createdAt = new Date(order.createdAt);
            return createdAt >= comparisonWindow.previousStart && createdAt <= comparisonWindow.previousEnd;
        }).length;

        const totalCustomersCurrent = users.filter((user) => {
            const createdAt = new Date(user.createdAt);
            return createdAt <= comparisonWindow.currentEnd;
        }).length;

        const totalCustomersPrevious = users.filter((user) => {
            const createdAt = new Date(user.createdAt);
            return createdAt <= comparisonWindow.previousEnd;
        }).length;

        const activeCustomersCount = customers.filter((customer) => {
            const createdAt = new Date(customer.createdAt);
            return customer.status === "Active" && createdAt >= comparisonWindow.currentStart && createdAt <= comparisonWindow.currentEnd;
        }).length;

        const repeatCustomersCount = customers.filter((customer) => {
            const secondOrderDate = secondOrderDateByUser.get(String(customer.uid));
            return secondOrderDate instanceof Date
                && secondOrderDate >= comparisonWindow.currentStart
                && secondOrderDate <= comparisonWindow.currentEnd;
        }).length;

        const conversionRate = thisPeriodUsers ? Number(((thisPeriodOrders / thisPeriodUsers) * 100).toFixed(1)) : 0;
        let summaryCards = [];
        let overviewStats = [];
        let weekSeries = {};
        let xLabelsByRange = {};

        if (isSellerMode) {
            const activeSellersCurrent = users.filter((user) => {
                const createdAt = new Date(user.createdAt);
                return String(user.status || "").toLowerCase() === "active" && createdAt <= comparisonWindow.currentEnd;
            }).length;

            const activeSellersPrevious = users.filter((user) => {
                const createdAt = new Date(user.createdAt);
                return String(user.status || "").toLowerCase() === "active" && createdAt <= comparisonWindow.previousEnd;
            }).length;

            const blockedSellersCurrent = users.filter((user) => {
                const createdAt = new Date(user.createdAt);
                return String(user.status || "").toLowerCase() === "blocked" && createdAt <= comparisonWindow.currentEnd;
            }).length;

            const blockedSellersPrevious = users.filter((user) => {
                const createdAt = new Date(user.createdAt);
                return String(user.status || "").toLowerCase() === "blocked" && createdAt <= comparisonWindow.previousEnd;
            }).length;

            summaryCards = [
                {
                    title: "Total Sellers",
                    value: formatCompactNumber(totalCustomersCurrent),
                    change: formatChangePercentage(totalCustomersCurrent, totalCustomersPrevious),
                    changeColor: totalCustomersCurrent >= totalCustomersPrevious ? "#22C55E" : "#EF4444",
                },
                {
                    title: "New Sellers",
                    value: formatCompactNumber(thisPeriodUsers),
                    change: formatChangePercentage(thisPeriodUsers, previousPeriodUsers),
                    changeColor: thisPeriodUsers >= previousPeriodUsers ? "#22C55E" : "#EF4444",
                },
                {
                    title: "Active Sellers",
                    value: formatCompactNumber(activeSellersCurrent),
                    change: formatChangePercentage(activeSellersCurrent, activeSellersPrevious),
                    changeColor: activeSellersCurrent >= activeSellersPrevious ? "#22C55E" : "#EF4444",
                },
                {
                    title: "Blocked Sellers",
                    value: formatCompactNumber(blockedSellersCurrent),
                    change: "",
                    changeColor: "#22C55E",
                },
            ];

            overviewStats = [];
            weekSeries = {};
            xLabelsByRange = {};
        } else {
            summaryCards = [
                {
                    title: `Total ${entityPlural}`,
                    value: formatCompactNumber(totalCustomersCurrent),
                    change: formatChangePercentage(totalCustomersCurrent, totalCustomersPrevious),
                    changeColor: totalCustomersCurrent >= totalCustomersPrevious ? "#22C55E" : "#EF4444",
                },
                {
                    title: `New ${entityPlural}`,
                    value: formatCompactNumber(thisPeriodUsers),
                    change: formatChangePercentage(thisPeriodUsers, previousPeriodUsers),
                    changeColor: thisPeriodUsers >= previousPeriodUsers ? "#22C55E" : "#EF4444",
                },
                {
                    title: "Visitor",
                    value: formatCompactNumber(thisPeriodOrders),
                    change: formatChangePercentage(thisPeriodOrders, previousPeriodOrders),
                    changeColor: thisPeriodOrders >= previousPeriodOrders ? "#22C55E" : "#EF4444",
                },
            ];

            overviewStats = [
                { key: "activeCustomers", label: `Active ${entityPlural}`, value: formatCompactNumber(activeCustomersCount) },
                { key: "repeatCustomers", label: `Repeat ${entityPlural}`, value: formatCompactNumber(repeatCustomersCount) },
                { key: "shopVisitor", label: "Shop Visitor", value: formatCompactNumber(thisPeriodOrders) },
                { key: "conversionRate", label: "Conversion Rate", value: `${conversionRate}%` },
            ];

            const currentBuckets = buildBucketsForPeriod({
                periodConfig,
                comparisonWindow,
                users,
                orders,
            });

            const currentRangeValue = periodConfig.ranges[0].value;
            weekSeries = {
                [currentRangeValue]: buildSeries({
                    users: customers,
                    orders,
                    secondOrderDateByUser,
                    buckets: currentBuckets,
                }),
            };

            if (periodConfig.period === "7days" && periodConfig.ranges[1]) {
                weekSeries[periodConfig.ranges[1].value] = buildSeries({
                    users: customers,
                    orders,
                    secondOrderDateByUser,
                    buckets: buildLastWeekBuckets(comparisonWindow),
                });
            }

            xLabelsByRange = {
                [currentRangeValue]: currentBuckets.map((bucket) => bucket.label),
            };

            if (periodConfig.period === "7days" && periodConfig.ranges[1]) {
                xLabelsByRange[periodConfig.ranges[1].value] = buildLastWeekBuckets(comparisonWindow).map((bucket) => bucket.label);
            }
        }

        const topSellers = isSellerMode
            ? [...customers]
                .sort((a, b) => {
                    const salesDiff = Number(b.totalSales || 0) - Number(a.totalSales || 0);
                    if (salesDiff !== 0) return salesDiff;
                    return Number(b.orderCount || 0) - Number(a.orderCount || 0);
                })
                .slice(0, 10)
                .map((seller, index) => ({
                    rank: index + 1,
                    uid: seller.uid,
                    id: seller.id,
                    name: seller.name,
                    status: seller.status,
                    productsCount: seller.productsCount || 0,
                    totalSales: Number(seller.totalSales || 0),
                    orderCount: Number(seller.orderCount || 0),
                }))
            : [];

        return res.status(200).json({
            message: `${entityPlural} fetched successfully`,
            error: false,
            success: true,
            data: {
                customers: paginatedCustomers,
                allCustomers: sortedCustomers,
                pagination: {
                    page: safePage,
                    limit: safeLimit,
                    totalCount,
                    totalPages,
                },
                summaryCards,
                overviewStats,
                weekSeries,
                ranges: periodConfig.ranges,
                periodLabel: periodConfig.periodLabel,
                activeRange: periodConfig.activeRange,
                selectedYear: periodConfig.selectedYear,
                selectedMonth: periodConfig.selectedMonth,
                availableYears,
                availableMonths,
                xLabelsByRange,
                topSellers,
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

export const registerUserController = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required",
                error: true,
                success: false
            })
        }

        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already Registered with this email",
                error: true,
                success: false
            })
        }

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sendEmai = await sendEmailFun({
            to: email,
            subject: "Verify email from Classyshop App",
            text: "",
            html: VerificationEmail(name, verifyCode)
        })

        if (!sendEmai) {
            return res.status(500).json({
                message: "Failed to send verification email",
                error: true,
                success: false
            })
        }

        const newUser = new UserModel({
            name,
            email,
            password: hashedPassword,
            otp: verifyCode,
            otp_expiry: Date.now() + 10 * 60 * 1000 // 10 minutes from now
        });

        await newUser.save();



        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role },
            process.env.SECRET_KEY_ACCESS_TOKEN,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            message: "User registered successfully! Please verify your email.",
            error: false,
            success: true,
            token
        });


    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false
        });
    }
}

export const verifyEmailController = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User not found",
                error: true,
                success: false
            })
        }

        const isCodeValid = user.otp === otp;
        const isNotExpired = user.otp_expiry > Date.now();

        if (isCodeValid && isNotExpired) {
            user.emailVerified = true;
            user.otp = null;
            user.otp_expiry = null;
            await user.save();
            return res.status(200).json({
                message: "Email verified successfully",
                error: false,
                success: true
            })
        } else if (!isCodeValid) {
            return res.status(400).json({
                message: "Invalid OTP",
                error: true,
                success: false
            })
        } else {
            return res.status(400).json({
                message: "OTP Expired",
                error: true,
                success: false
            })
        }

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false
        });
    }
}

export const loginUserController = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "All fields are required",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "user not Registered",
                error: true,
                success: false
            })
        }

        if (!["Active", "VIP"].includes(user.status)) {
            return res.status(403).json({
                message: "Contact to Admin, Your Account is Blocked",
                error: true,
                success: false
            })
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                message: "Please verify your email to login",
                error: true,
                success: false
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid Password",
                error: true,
                success: false
            })
        }

        const accessToken = await generateAccessToken(user._id, user.role);
        const refreshToken = await generateRefreshToken(user._id, user.role);

        await UserModel.findByIdAndUpdate(user?._id, {
            last_login_date: Date.now()
        })

        const cookiesOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }
        res.cookie('accessToken', accessToken, cookiesOptions)
        res.cookie('refreshToken', refreshToken, cookiesOptions)

        return res.status(200).json({
            message: "Login successful",
            error: false,
            success: true,
            data: {
                accessToken,
                refreshToken,
                role: user?.role
            }
        });


    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false
        });
    }
}

export const getUserController = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await UserModel.findById({ _id: userId }).select("-password -refresh_token -otp -otp_expiry");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        return res.status(200).json({
            message: "User found",
            error: false,
            success: true,
            data: {
                ...user.toObject(),
                location: await getSellerLocation(user._id, user.role),
                socialLinks: await getSellerSocialLinks(user._id, user.role),
                accessMode: getAccessModeFromRole(user.role),
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error" + error.message,
            error: true,
            success: false
        });
    }
}

export const getAdminAccessModeController = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await UserModel.findById({ _id: userId }).select("role name email").lean();

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false,
            });
        }

        return res.status(200).json({
            message: "Access mode fetched successfully",
            error: false,
            success: true,
            data: {
                role: user.role,
                accessMode: getAccessModeFromRole(user.role),
                name: user.name || "",
                email: user.email || "",
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error" + error.message,
            error: true,
            success: false,
        });
    }
};


export async function logoutController(req, res) {
    try {
        const userid = req.userId

        const cookiesOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }

        res.clearCookie("accessToken", cookiesOptions);
        res.clearCookie("refreshToken", cookiesOptions);

        const removeRefreshToken = await UserModel.findByIdAndUpdate(userid, {
            refresh_token: ""
        })

        return res.status(200).json({
            message: "Logout successfully",
            error: false,
            success: true
        })


    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const refreshTokenController = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token not found",
                error: true,
                success: false
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);

        const user = await UserModel.findById(decoded.id).select("refresh_token role status");

        const cookiesOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        };

        if (!user || user.status !== "Active" || user.refresh_token !== refreshToken) {

            res.clearCookie("accessToken", cookiesOptions);
            res.clearCookie("refreshToken", cookiesOptions);

            return res.status(401).json({
                message: "Invalid refresh token",
                error: true,
                success: false,
            });
        }

        const newAccessToken = await generateAccessToken(user._id, user.role);

        res.cookie('accessToken', newAccessToken, cookiesOptions);

        return res.status(200).json({
            message: "Access token refreshed successfully",
            error: false,
            success: true,
            data: {
                accessToken: newAccessToken
            }
        });

    } catch (error) {

        const cookiesOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        };

        res.clearCookie("accessToken", cookiesOptions);
        res.clearCookie("refreshToken", cookiesOptions);

        return res.status(401).json({
            message: "Invalid or expired refresh token. Please login again.",
            error: true,
            success: false,
        });
    }
}

const uploadAvatarImage = async (req) => {
    try {
        const imagesArr = [];

        const userId = req.userId;
        const image = req.files;

        const user = await UserModel.findById({ _id: userId });

        if (!user) {
            return {
                status: 404, body: {
                    message: "User not found",
                    error: true,
                    success: false
                }
            };
        }

        //first remove image from cloudinary
        const imgUrl = user.avatar;

        if (imgUrl) {
            const urlArr = imgUrl.split("/");
            const avatar_image = urlArr[urlArr.length - 1];
            const imageName = avatar_image.split(".")[0];

            if (imageName) {
                await cloudinary.uploader.destroy(imageName);
            }
        }

        const option = {
            use_filename: true,
            unique_filename: false,
            overwrite: false,
        };

        for (let i = 0; i < image?.length; i++) {
            await cloudinary.uploader.upload(
                image[i].path,
                option,
                function (error, result) {
                    imagesArr.push(result.secure_url);
                    fs.unlinkSync(`uploads/${req.files[i].filename}`);
                }
            );
        }

        user.avatar = imagesArr[0];
        await user.save();

    } catch (error) {
        return {
            status: 500, body: {
                message: error.message || error,
                error: true,
                success: false
            }
        };
    }
};

export async function userAvatarController(req, res) {
    const result = await uploadAvatarImage(req);
    if (result?.status) {
        return res.status(result.status).json(result.body);
    }

    return res.status(200).json({
        error: false,
        success: true,
        message: "Avatar updated successfully",
        data: {
            _id: req.userId,
            avatar: (await UserModel.findById(req.userId).select("avatar").lean())?.avatar || null,
        },
    });
}

export async function adminAvatarController(req, res) {
    const result = await uploadAvatarImage(req);
    if (result?.status) {
        return res.status(result.status).json(result.body);
    }

    return res.status(200).json({
        error: false,
        success: true,
        message: "Avatar updated successfully",
        data: {
            _id: req.userId,
            avatar: (await UserModel.findById(req.userId).select("avatar").lean())?.avatar || null,
        },
    });
}

export async function removeImageFromCloudinary(request, response) {
    try {
        const imgUrl = request.query.img;

        const urlArr = imgUrl.split("/");
        const image = urlArr[urlArr.length - 1];

        const imageName = image.split(".")[0];

        if (imageName) {
            const res = await cloudinary.uploader.destroy(
                imageName,
                (error, result) => {

                }
            );
            if (res) {
                response.status(200).send(res);
            }
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = verifyCode;
        user.otp_expiry = Date.now() + 10 * 60 * 1000;

        await user.save();

        await sendEmailFun({
            to: email,
            subject: "Password Reset OTP from Classyshop App",
            text: "",
            html: VerificationEmail(user.name, verifyCode)
        })

        return res.status(200).json({
            message: "OTP sent to email successfully",
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const verifyForgotPasswordOtpController = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({
                message: "All fields are required",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        const isCodeValid = user.otp === otp;
        const isNotExpired = user.otp_expiry > Date.now();
        if (isCodeValid && isNotExpired) {

            user.otp = null;
            user.otp_expiry = null;
            await user.save();

            return res.status(200).json({
                message: "OTP verified successfully",
                error: false,
                success: true
            })

        } else if (!isCodeValid) {
            return res.status(400).json({
                message: "Invalid OTP",
                error: true,
                success: false
            })
        } else {
            return res.status(400).json({
                message: "OTP Expired",
                error: true,
                success: false
            })
        }


    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const resetPasswordController = async (req, res) => {
    try {
        const userId = req.userId;
        const { oldPassword, newPassword, confirmPassword } = req.body;

        const user = await UserModel.findById({ _id: userId });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "All fields are required",
                error: true,
                success: false
            })
        }

        const checkPassword = await bcrypt.compare(oldPassword, user.password)

        if (!checkPassword) {
            return res.status(400).json({
                message: "Your OldPassword is Worng",
                error: true,
                success: false
            })
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Password and Confirm Password must be same",
                error: true,
                success: false
            })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({
            message: "Password reset successfully",
            error: false,
            success: true
        })


    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const adminChangePasswordController = async (req, res) => {
    try {
        const userId = req.userId;
        const { oldPassword, newPassword, confirmPassword } = req.body;

        const user = await UserModel.findById({ _id: userId });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false,
            });
        }

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "All fields are required",
                error: true,
                success: false,
            });
        }

        const checkPassword = await bcrypt.compare(oldPassword, user.password);
        if (!checkPassword) {
            return res.status(400).json({
                message: "Your OldPassword is Worng",
                error: true,
                success: false,
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Password and Confirm Password must be same",
                error: true,
                success: false,
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({
            message: "Password reset successfully",
            error: false,
            success: true,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
};

export const resetPasswordWithOtpController = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).jso({
                message: "All field are Required",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "user not found",
                error: true,
                success: false
            })
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "NewPassword and confirmPassword must be same",
                error: true,
                success: false
            })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({
            message: "password reset successfull!",
            error: false,
            success: true
        })


    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        })
    }
}

export const updateUserDetails = async (req, res) => {
    try {
        const userId = req.userId;
        const {
            name,
            firstName,
            lastName,
            email,
            password,
            mobile,
            location,
            bankName,
            ifcCode,
            accountNumber,
            instagramLink,
            facebookLink,
            whatsappNumber,
        } = req.body;

        const user = await UserModel.findById({ _id: userId });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            })
        }

        if (name) {
            user.name = name;
        } else if (firstName || lastName) {
            user.name = `${firstName || ""} ${lastName || ""}`.trim();
        }

        if (email && email !== user.email) {
            const existingEmail = await UserModel.findOne({ email, _id: { $ne: userId } }).select("_id").lean();
            if (existingEmail) {
                return res.status(400).json({
                    message: "Email already exists",
                    error: true,
                    success: false,
                });
            }
            user.email = email;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
        }

        if (mobile) {
            user.mobile = mobile;
        }

        if (location !== undefined && ['admin', 'seller'].includes(user.role)) {
            await SellerLocationModel.findOneAndUpdate(
                { userId },
                { userId, location },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        if (bankName !== undefined) {
            user.bankName = bankName;
        }

        if (ifcCode !== undefined) {
            user.ifcCode = ifcCode;
        }

        if (accountNumber !== undefined) {
            user.accountNumber = accountNumber;
        }

        if (['admin', 'seller'].includes(user.role) && (
            instagramLink !== undefined ||
            facebookLink !== undefined ||
            whatsappNumber !== undefined
        )) {
            const normalizedWhatsAppNumber = whatsappNumber !== undefined ? String(whatsappNumber).replace(/\D/g, "") : undefined;

            if (normalizedWhatsAppNumber !== undefined && normalizedWhatsAppNumber && normalizedWhatsAppNumber.length !== 10) {
                return res.status(400).json({
                    message: "WhatsApp number must be exactly 10 digits",
                    error: true,
                    success: false,
                });
            }

            await SellerSocialLinksModel.findOneAndUpdate(
                { userId },
                {
                    userId,
                    instagramLink: instagramLink !== undefined ? instagramLink : '',
                    facebookLink: facebookLink !== undefined ? facebookLink : '',
                    whatsappNumber: normalizedWhatsAppNumber !== undefined ? normalizedWhatsAppNumber : '',
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        await user.save();

        return res.status(200).json({
            message: "User details updated successfully",
            error: false,
            success: true,
            data: await buildUserResponse(user)
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function updateUserStatus(req, res) {
    try {
        const adminId = req.userId;
        const { id } = req.params;
        const { status } = req.body;

        const isRelated = await isCustomerRelatedToAdmin(adminId, id);
        if (!isRelated) {
            return res.status(403).json({
                message: "You can only update customers related to your products",
                error: true,
                success: false
            })
        }

        const normalizedStatus = status === "Inactive" ? "Blocked" : status;
        const allowedStatuses = ["Active", "Blocked", "VIP"];
        if (!allowedStatuses.includes(normalizedStatus)) {
            return res.status(400).json({
                message: "Invalid status",
                error: true,
                success: false
            })
        }

        const updatedUserStatus = await UserModel.findByIdAndUpdate(
            {
                _id: id,
            },
            {
                status: normalizedStatus
            },
            { new: true }
        )
        return res.status(200).json({
            error: false,
            success: true,
            message: "User status updated",
            user: updatedUserStatus
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function adminSendResetPasswordLinkController(req, res) {
    try {
        const adminId = req.userId;
        const { id } = req.params;

        const isRelated = await isCustomerRelatedToAdmin(adminId, id);
        if (!isRelated) {
            return res.status(403).json({
                message: "You can only access customers related to your products",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findById(id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            })
        }

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = verifyCode;
        user.otp_expiry = Date.now() + 10 * 60 * 1000;
        await user.save();

        await sendEmailFun({
            to: user.email,
            subject: "Password Reset OTP from Classyshop App",
            text: "",
            html: VerificationEmail(user.name, verifyCode)
        });

        return res.status(200).json({
            message: "Password reset OTP sent successfully",
            error: false,
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function adminForceLogoutUserController(req, res) {
    try {
        const adminId = req.userId;
        const { id } = req.params;

        const isRelated = await isCustomerRelatedToAdmin(adminId, id);
        if (!isRelated) {
            return res.status(403).json({
                message: "You can only access customers related to your products",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findByIdAndUpdate(
            { _id: id },
            { refresh_token: "" },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            })
        }

        return res.status(200).json({
            message: "User logged out from active sessions",
            error: false,
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function adminUpdateCustomerNoteController(req, res) {
    try {
        const { id } = req.params;
        const { note } = req.body;
        const { userId } = req;

        const isRelated = await isCustomerRelatedToAdmin(userId, id);
        if (!isRelated) {
            return res.status(403).json({
                message: "You can only access customers related to your products",
                error: true,
                success: false
            })
        }

        const nextNote = String(note || "").trim();
        if (nextNote.length > 500) {
            return res.status(400).json({
                message: "Note is too long",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            })
        }

        let editorMeta = {
            adminId: null,
            adminName: "",
            adminEmail: "",
        };

        if (userId) {
            const editor = await UserModel.findById(userId).select("name email").lean();
            if (editor) {
                editorMeta = {
                    adminId: editor._id || null,
                    adminName: editor.name || "",
                    adminEmail: editor.email || "",
                };
            }
        }

        const previousNote = String(user.support_note || "").trim();
        const hasChanged = previousNote !== nextNote;

        if (hasChanged) {
            if (previousNote) {
                const previousNoteUpdatedAt = user.support_note_updated_at || user.updatedAt || user.createdAt || new Date();
                const previousUpdatedBy = user.support_note_updated_by && typeof user.support_note_updated_by === "object"
                    ? {
                        adminId: user.support_note_updated_by.adminId || null,
                        adminName: user.support_note_updated_by.adminName || "",
                        adminEmail: user.support_note_updated_by.adminEmail || "",
                    }
                    : {
                        adminId: null,
                        adminName: "",
                        adminEmail: "",
                    };
                const existingHistory = Array.isArray(user.support_note_history) ? user.support_note_history : [];

                user.support_note_history = [
                    {
                        note: previousNote,
                        updatedAt: previousNoteUpdatedAt,
                        updatedBy: previousUpdatedBy,
                    },
                    ...existingHistory,
                ].slice(0, 5);
            }

            user.support_note = nextNote;
            user.support_note_updated_at = new Date();
            user.support_note_updated_by = editorMeta;
            await user.save();
        }

        return res.status(200).json({
            message: "Customer note updated",
            error: false,
            success: true,
            data: {
                supportNote: user.support_note || "",
                supportNoteUpdatedAt: user.support_note_updated_at || null,
                supportNoteUpdatedBy: user.support_note_updated_by
                    ? {
                        adminId: user.support_note_updated_by.adminId || null,
                        adminName: user.support_note_updated_by.adminName || "",
                        adminEmail: user.support_note_updated_by.adminEmail || "",
                    }
                    : null,
                supportNoteHistory: Array.isArray(user.support_note_history)
                    ? user.support_note_history.map((entry) => ({
                        note: entry?.note || "",
                        updatedAt: entry?.updatedAt || null,
                        updatedBy: entry?.updatedBy
                            ? {
                                adminId: entry.updatedBy.adminId || null,
                                adminName: entry.updatedBy.adminName || "",
                                adminEmail: entry.updatedBy.adminEmail || "",
                            }
                            : null,
                    }))
                    : []
            }
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}
