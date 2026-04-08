import express from 'express';
import UserModel from '../models/user.model.js';
import OrderModel from '../models/order.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import generateAccessToken from '../utils/generateAccessToken.js';
import generateRefreshToken from '../utils/generateRefreshToken.js';
import sendEmailFun from '../config/sendEmail.js';
import VerificationEmail from '../utils/verifyEmailTemplate.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
});

const SHORT_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

const getPeriodConfig = ({ period, year, month, availableYears }) => {
    const now = new Date();
    const normalizedPeriod = ["7days", "daywise", "month", "year"].includes(period) ? period : "7days";

    const defaultYear = now.getFullYear();
    const fallbackYear = availableYears.includes(defaultYear) ? defaultYear : availableYears[availableYears.length - 1] || defaultYear;
    const selectedYear = Number.isInteger(year) && availableYears.includes(year) ? year : fallbackYear;
    const selectedMonth = Number.isInteger(month) && month >= 1 && month <= 12 ? month : (now.getMonth() + 1);

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

const buildSeries = ({ users, orders, secondOrderDateByUser, points }) => {
    const series = {
        activeCustomers: [],
        repeatCustomers: [],
        shopVisitor: [],
        conversionRate: [],
    };

    points.forEach((dayEnd) => {
        const safeDayEnd = new Date(dayEnd);
        if (Number.isNaN(safeDayEnd.getTime())) {
            return;
        }

        const activeCustomers = users.filter((user) => user.status === "Active" && new Date(user.createdAt) <= safeDayEnd).length;
        const repeatCustomers = users.filter((user) => {
            const secondOrderDate = secondOrderDateByUser.get(String(user.uid));
            return secondOrderDate instanceof Date && secondOrderDate <= safeDayEnd;
        }).length;
        const shopVisitor = orders.filter((order) => {
            const orderDate = new Date(order.createdAt);
            return !Number.isNaN(orderDate.getTime()) && orderDate <= safeDayEnd;
        }).length;
        const conversionRate = activeCustomers ? Number(((shopVisitor / activeCustomers) * 100).toFixed(1)) : 0;

        series.activeCustomers.push(activeCustomers);
        series.repeatCustomers.push(repeatCustomers);
        series.shopVisitor.push(shopVisitor);
        series.conversionRate.push(conversionRate);
    });

    return series;
};

export const getCustomersController = async (req, res) => {
    try {
        const requestedYear = Number.parseInt(req.query?.year, 10);
        const requestedMonth = Number.parseInt(req.query?.month, 10);

        const users = await UserModel.find({ role: "user" })
            .select("-password -refresh_token -otp -otp_expiry")
            .sort({ createdAt: -1 })
            .lean();

        const userIds = users.map((user) => user._id);
        const orders = userIds.length
            ? await OrderModel.find({ userId: { $in: userIds } })
                .select("userId totalAmount status createdAt")
                .sort({ createdAt: -1 })
                .lean()
            : [];

        const availableYears = getAvailableYears(users, orders);
        const periodConfig = getPeriodConfig({
            period: req.query?.period,
            year: Number.isInteger(requestedYear) ? requestedYear : null,
            month: Number.isInteger(requestedMonth) ? requestedMonth : null,
            availableYears,
        });
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
            const stats = orderStatsByUser.get(String(user._id)) || {};

            return {
                uid: String(user._id),
                id: `#CUST${String(index + 1).padStart(4, "0")}`,
                name: user.name || "",
                email: user.email || "",
                phone: user.mobile ? `+${user.mobile}` : "-",
                orderCount: stats.orderCount || 0,
                totalSpend: stats.totalSpend || 0,
                status: user.status || "Inactive",
                address: user.address || "-",
                totalOrders: stats.orderCount || 0,
                completedOrders: stats.completedOrders || 0,
                canceledOrders: stats.canceledOrders || 0,
                registrationDate: formatDateDisplay(user.createdAt),
                lastPurchaseDate: formatDateDisplay(stats.lastPurchaseDate || user.createdAt),
                createdAt: user.createdAt,
                firstOrderDate: stats.firstOrderDate,
            };
        });

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

        const summaryCards = [
            {
                title: "Total Customers",
                value: formatCompactNumber(thisPeriodUsers),
                change: previousPeriodUsers ? `${(((thisPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100).toFixed(1)}%` : "+0%",
                changeColor: thisPeriodUsers >= previousPeriodUsers ? "#22C55E" : "#EF4444",
            },
            {
                title: "New Customers",
                value: formatCompactNumber(thisPeriodUsers),
                change: previousPeriodUsers ? `${(((thisPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100).toFixed(1)}%` : "+0%",
                changeColor: thisPeriodUsers >= previousPeriodUsers ? "#22C55E" : "#EF4444",
            },
            {
                title: "Visitor",
                value: formatCompactNumber(thisPeriodOrders),
                change: previousPeriodOrders ? `${(((thisPeriodOrders - previousPeriodOrders) / previousPeriodOrders) * 100).toFixed(1)}%` : "+0%",
                changeColor: thisPeriodOrders >= previousPeriodOrders ? "#22C55E" : "#EF4444",
            },
        ];

        const overviewStats = [
            { key: "activeCustomers", label: "Active Customers", value: formatCompactNumber(activeCustomersCount) },
            { key: "repeatCustomers", label: "Repeat Customers", value: formatCompactNumber(repeatCustomersCount) },
            { key: "shopVisitor", label: "Shop Visitor", value: formatCompactNumber(thisPeriodOrders) },
            { key: "conversionRate", label: "Conversion Rate", value: `${conversionRate}%` },
        ];

        const buildPointEnds = () => {
            if (periodConfig.period === "year") {
                return availableYears.map((year) => new Date(year, 11, 31, 23, 59, 59, 999));
            }

            if (periodConfig.period === "month") {
                return Array.from({ length: 12 }, (_, index) => new Date(periodConfig.selectedYear, index + 1, 0, 23, 59, 59, 999));
            }

            if (periodConfig.period === "daywise") {
                const daysInMonth = new Date(periodConfig.selectedYear, periodConfig.selectedMonth, 0).getDate();
                return Array.from({ length: daysInMonth }, (_, index) => new Date(periodConfig.selectedYear, periodConfig.selectedMonth - 1, index + 1, 23, 59, 59, 999));
            }

            const currentEnd = comparisonWindow.currentEnd;
            return Array.from({ length: 7 }, (_, index) => {
                const date = new Date(currentEnd);
                date.setDate(currentEnd.getDate() - (6 - index));
                date.setHours(23, 59, 59, 999);
                return date;
            });
        };

        const buildLastPointEnds = () => {
            if (periodConfig.period !== "7days") {
                return [];
            }

            const previousEnd = comparisonWindow.previousEnd;
            return Array.from({ length: 7 }, (_, index) => {
                const date = new Date(previousEnd);
                date.setDate(previousEnd.getDate() - (6 - index));
                date.setHours(23, 59, 59, 999);
                return date;
            });
        };

        const currentRangeValue = periodConfig.ranges[0].value;
        const weekSeries = {
            [currentRangeValue]: buildSeries({
                users: customers,
                orders,
                secondOrderDateByUser,
                points: buildPointEnds(),
            }),
        };

        if (periodConfig.period === "7days" && periodConfig.ranges[1]) {
            weekSeries[periodConfig.ranges[1].value] = buildSeries({
                users: customers,
                orders,
                secondOrderDateByUser,
                points: buildLastPointEnds(),
            });
        }

        const xLabelsByRange = {
            [currentRangeValue]: periodConfig.xLabels,
        };

        if (periodConfig.period === "7days" && periodConfig.ranges[1]) {
            xLabelsByRange[periodConfig.ranges[1].value] = periodConfig.xLabels;
        }

        return res.status(200).json({
            message: "Customers fetched successfully",
            error: false,
            success: true,
            data: {
                customers,
                summaryCards,
                overviewStats,
                weekSeries,
                ranges: periodConfig.ranges,
                periodLabel: periodConfig.periodLabel,
                activeRange: periodConfig.activeRange,
                selectedYear: periodConfig.selectedYear,
                selectedMonth: periodConfig.selectedMonth,
                availableYears,
                xLabelsByRange,
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

        if (user.status !== "Active") {
            return res.status(403).json({
                message: "Contact to Admin, Your Account is Inactive",
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
            data: user
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error" + error.message,
            error: true,
            success: false
        });
    }
}


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
        const refreshToken = req.cookies.refreshToken || req?.headers?.authorization?.split(" ")[1];

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token not found",
                error: true,
                success: false
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);

        const user = await UserModel.findById(decoded.id).select("refresh_token role status");

        if (!user || user.status !== "Active" || user.refresh_token !== refreshToken) {
            return res.status(401).json({
                message: "Invalid refresh token",
                error: true,
                success: false
            });
        }

        const newAccessToken = await generateAccessToken(user._id, user.role);

        const cookiesOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        };
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
        return res.status(401).json({
            message: "Invalid or expired refresh token. Please login again.",
            error: true,
            success: false
        });
    }
}

// image upload
var imagesArr = [];

export async function userAvatarController(req, res) {
    try {
        imagesArr = [];

        const userId = req.userId;
        const image = req.files;

        const user = await UserModel.findById({ _id: userId });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
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
            const img = await cloudinary.uploader.upload(
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

        return res.status(200).json({
            _id: userId,
            avatar: imagesArr[0],
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
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

        if (!newPassword || !confirmPassword || oldPassword) {
            return res.status(400).json({
                message: "All fields are required",
                error: true,
                success: false
            })
        }

        const checkPassword = bcrypt.compare(oldPassword, user.password)

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
        const { name, password, mobile } = req.body;

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
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
        }

        if (mobile) {
            user.mobile = mobile;
        }

        await user.save();

        return res.status(200).json({
            message: "User details updated successfully",
            error: false,
            success: true,
            user
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
        const { id } = req.params;
        const { status } = req.body;

        const updatedUserStatus = await UserModel.findByIdAndUpdate(
            {
                _id: id,
            },
            {
                status: status
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
