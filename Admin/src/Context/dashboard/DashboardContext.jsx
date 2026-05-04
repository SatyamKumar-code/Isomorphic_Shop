/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBestSellingProducts, getDashboardPageData, getDashboardUserReport, getTopProducts, getTransactions } from "../../features/Dashboard/DashboardPageAPI";
import { getPayoutDashboard } from "../../features/Transaction/TransactionAPI";
import { useAuth } from "../auth/useAuth";

export const DashboardContext = createContext();

const getSafeRange = (ranges) => {
    if (!Array.isArray(ranges) || !ranges.length) {
        return "This week";
    }

    return ranges[0]?.value || "This week";
};

const getSafeStat = (stats) => {
    if (!Array.isArray(stats) || !stats.length) {
        return "";
    }

    const firstStat = stats[0];
    return firstStat?.key || firstStat?.valueKey || firstStat?.label || "";
};

const hasSeriesForRangeAndStat = (chartSeries, range, stat) => {
    if (!chartSeries || typeof chartSeries !== "object") {
        return false;
    }

    const byRange = chartSeries?.[range];
    if (Array.isArray(byRange)) {
        return true;
    }

    if (byRange && typeof byRange === "object" && Array.isArray(byRange?.[stat])) {
        return true;
    }

    const byStat = chartSeries?.[stat];
    if (Array.isArray(byStat)) {
        return true;
    }

    if (byStat && typeof byStat === "object" && Array.isArray(byStat?.[range])) {
        return true;
    }

    return false;
};

const normalizeMinuteSeries = (series) => {
    const values = Array.isArray(series)
        ? series.map((value) => Number(value || 0))
        : [];

    while (values.length < 30) {
        values.unshift(0);
    }

    return values.slice(-30);
};

const normalizeCountryRows = (rows) => {
    if (!Array.isArray(rows)) {
        return [];
    }

    return rows.map((row) => ({
        ...row,
        viewCount: Number(row?.viewCount || 0),
        percentageChange: Number(row?.percentageChange || 0),
        progressPercent: Number(row?.progressPercent || 0),
    }));
};

const normalizeTopProducts = (items) => {
    if (!Array.isArray(items)) {
        return [];
    }

    return items.map((item) => ({
        ...item,
        id: item?._id || item?.id,
        image: item?.images?.[0] || item?.image || "",
        categoryName: item?.category?.catName || item?.categoryName || "",
        price: Number(item?.price || 0),
        sales: Number(item?.sales || 0),
    }));
};

const normalizeBestSellingProducts = (items) => {
    if (!Array.isArray(items)) {
        return [];
    }

    return items.map((item) => ({
        ...item,
        id: item?.id || item?._id,
        product: item?.product || item?.productName || "Unknown Product",
        img: item?.img || item?.image || item?.images?.[0] || "",
        sellerName: item?.sellerName || "Unknown Seller",
        totalSales: Number(item?.totalSales || 0),
        totalOrder: Number(item?.totalOrder || 0),
        status: item?.status || (Number(item?.stock || 0) > 0 ? "Stock" : "Stock out"),
        price: item?.price || `₹${Number(item?.priceValue || item?.priceNumber || 0)}`,
        sellerId: item?.sellerId || "",
    }));
};

const normalizeSellerOptions = (items) => {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .map((item) => ({
            id: String(item?.sellerId || ""),
            name: String(item?.sellerName || "Unknown Seller"),
        }))
        .filter((item) => item.id);
};

export const DashboardProvider = ({ children }) => {
    const { userData } = useAuth();
    const isAdmin = userData?.role === "admin";
    const [weeklyReport, setWeeklyReport] = useState(null);
    const [userReport, setUserReport] = useState(null);
    const [transactions, setTransactions] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [bestSellingProducts, setBestSellingProducts] = useState([]);
    const [sellerOptions, setSellerOptions] = useState([]);
    const [activeRange, setActiveRange] = useState("");
    const [activeStat, setActiveStat] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isUserReportLoading, setIsUserReportLoading] = useState(false);
    const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
    const [isTopProductsLoading, setIsTopProductsLoading] = useState(false);
    const [isBestSellingProductsLoading, setIsBestSellingProductsLoading] = useState(false);
    const latestWeeklyReportRequestRef = useRef(0);
    const latestUserReportRequestRef = useRef(0);
    const latestTransactionsRequestRef = useRef(0);
    const latestTopProductsRequestRef = useRef(0);
    const latestBestSellingProductsRequestRef = useRef(0);
    const latestSellerDirectoryRequestRef = useRef(0);

    const weeklyReportRequestParams = useMemo(() => ({
        range: activeRange,
        stat: activeStat,
    }), [activeRange, activeStat]);

    const loadDashboardData = useCallback(async () => {
        const requestId = latestWeeklyReportRequestRef.current + 1;
        latestWeeklyReportRequestRef.current = requestId;

        try {
            setIsLoading(true);
            const res = await getDashboardPageData(weeklyReportRequestParams);
            const data = res?.data?.data;

            if (requestId !== latestWeeklyReportRequestRef.current) {
                return;
            }

            const apiWeeklyReport = data?.weeklyReport;
            if (apiWeeklyReport && typeof apiWeeklyReport === "object") {
                setWeeklyReport(apiWeeklyReport);

                if (typeof apiWeeklyReport.activeRange === "string") {
                    setActiveRange(apiWeeklyReport.activeRange);
                }

                if (typeof apiWeeklyReport.activeStat === "string") {
                    setActiveStat(apiWeeklyReport.activeStat);
                }
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            if (requestId === latestWeeklyReportRequestRef.current) {
                setIsLoading(false);
            }
        }
    }, [weeklyReportRequestParams]);

    const loadUserReportData = useCallback(async () => {
        const requestId = latestUserReportRequestRef.current + 1;
        latestUserReportRequestRef.current = requestId;

        try {
            setIsUserReportLoading(true);
            const res = await getDashboardUserReport();
            const data = res?.data?.data;

            if (requestId !== latestUserReportRequestRef.current) {
                return;
            }

            if (data && typeof data === "object") {
                setUserReport({
                    totalProductViewersLast30Min: Number(data.totalProductViewersLast30Min || 0),
                    productViewersPerMinute: normalizeMinuteSeries(data.productViewersPerMinute),
                    viewsByCountry: normalizeCountryRows(data.viewsByCountry),
                });
            }
        } catch (error) {
            console.error("Error loading dashboard user report:", error);
        } finally {
            if (requestId === latestUserReportRequestRef.current) {
                setIsUserReportLoading(false);
            }
        }
    }, []);

    const loadTransactionsData = useCallback(async () => {
        const requestId = latestTransactionsRequestRef.current + 1;
        latestTransactionsRequestRef.current = requestId;

        try {
            setIsTransactionsLoading(true);
            const res = await getTransactions(7);
            const data = res?.data?.data;

            if (requestId !== latestTransactionsRequestRef.current) {
                return;
            }

            if (Array.isArray(data)) {
                setTransactions(data);
            }
        } catch (error) {
            console.error("Error loading transactions:", error);
        } finally {
            if (requestId === latestTransactionsRequestRef.current) {
                setIsTransactionsLoading(false);
            }
        }
    }, []);

    const loadTopProductsData = useCallback(async (search = "") => {
        const requestId = latestTopProductsRequestRef.current + 1;
        latestTopProductsRequestRef.current = requestId;

        try {
            setIsTopProductsLoading(true);
            const res = await getTopProducts({ limit: 15, search });
            const data = res?.data?.data;

            if (requestId !== latestTopProductsRequestRef.current) {
                return;
            }

            setTopProducts(normalizeTopProducts(data?.topProducts));
        } catch (error) {
            console.error("Error loading top products:", error);
            if (requestId === latestTopProductsRequestRef.current) {
                setTopProducts([]);
            }
        } finally {
            if (requestId === latestTopProductsRequestRef.current) {
                setIsTopProductsLoading(false);
            }
        }
    }, []);

    const loadSellerDirectoryData = useCallback(async () => {
        const requestId = latestSellerDirectoryRequestRef.current + 1;
        latestSellerDirectoryRequestRef.current = requestId;

        if (!isAdmin) {
            if (requestId === latestSellerDirectoryRequestRef.current) {
                setSellerOptions([]);
            }
            return;
        }

        try {
            const response = await getPayoutDashboard();
            const payload = response?.data?.data || {};
            const sellerWise = Array.isArray(payload?.sellerWise) ? payload.sellerWise : [];

            if (requestId !== latestSellerDirectoryRequestRef.current) {
                return;
            }

            setSellerOptions(normalizeSellerOptions(sellerWise));
        } catch (error) {
            console.error("Error loading seller directory:", error);
            if (requestId === latestSellerDirectoryRequestRef.current) {
                setSellerOptions([]);
            }
        }
    }, [isAdmin]);

    const loadBestSellingProductsData = useCallback(async (sellerId = "") => {
        const requestId = latestBestSellingProductsRequestRef.current + 1;
        latestBestSellingProductsRequestRef.current = requestId;

        try {
            setIsBestSellingProductsLoading(true);
            const params = { limit: isAdmin ? 100 : 25 };

            if (sellerId) {
                params.sellerId = sellerId;
            }

            const res = await getBestSellingProducts(params);
            const data = res?.data?.data;

            if (requestId !== latestBestSellingProductsRequestRef.current) {
                return;
            }

            setBestSellingProducts(normalizeBestSellingProducts(data?.bestSellingProducts));
        } catch (error) {
            console.error("Error loading best selling products:", error);
            if (requestId === latestBestSellingProductsRequestRef.current) {
                setBestSellingProducts([]);
            }
        } finally {
            if (requestId === latestBestSellingProductsRequestRef.current) {
                setIsBestSellingProductsLoading(false);
            }
        }
    }, [isAdmin]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    useEffect(() => {
        loadUserReportData();
    }, [loadUserReportData]);

    useEffect(() => {
        loadTransactionsData();
    }, [loadTransactionsData]);

    useEffect(() => {
        loadTopProductsData();
    }, [loadTopProductsData]);

    useEffect(() => {
        loadSellerDirectoryData();
    }, [loadSellerDirectoryData]);

    useEffect(() => {
        loadBestSellingProductsData();
    }, [loadBestSellingProductsData]);

    useEffect(() => {
        if (!weeklyReport) {
            return;
        }

        if (!hasSeriesForRangeAndStat(weeklyReport.chartSeries, activeRange, activeStat)) {
            const nextRange = getSafeRange(weeklyReport.ranges);
            const nextStat = getSafeStat(weeklyReport.stats);

            if (nextRange !== activeRange) {
                setActiveRange(nextRange);
            }

            if (nextStat !== activeStat) {
                setActiveStat(nextStat);
            }
        }
    }, [weeklyReport, activeRange, activeStat]);

    const weeklyReportProps = useMemo(() => {
        if (!weeklyReport) {
            return null;
        }

        return {
            ...weeklyReport,
            activeRange,
            onRangeChange: setActiveRange,
            activeStat,
            onStatChange: setActiveStat,
        };
    }, [weeklyReport, activeRange, activeStat]);

    const userReportProps = useMemo(() => {
        if (!userReport) {
            return null;
        }

        return {
            totalProductViewersLast30Min: Number(userReport.totalProductViewersLast30Min || 0),
            productViewersPerMinute: normalizeMinuteSeries(userReport.productViewersPerMinute),
            viewsByCountry: normalizeCountryRows(userReport.viewsByCountry),
        };
    }, [userReport]);

    const value = useMemo(() => ({
        weeklyReport,
        weeklyReportProps,
        userReport,
        userReportProps,
        transactions,
        topProducts,
        bestSellingProducts,
        sellerOptions,
        activeRange,
        setActiveRange,
        activeStat,
        setActiveStat,
        isLoading,
        isUserReportLoading,
        isTransactionsLoading,
        isTopProductsLoading,
        isBestSellingProductsLoading,
        reloadDashboardData: loadDashboardData,
        reloadUserReportData: loadUserReportData,
        reloadTransactions: loadTransactionsData,
        reloadTopProducts: loadTopProductsData,
        reloadBestSellingProducts: loadBestSellingProductsData,
        reloadSellerDirectory: loadSellerDirectoryData,
    }), [weeklyReport, weeklyReportProps, userReport, userReportProps, transactions, topProducts, bestSellingProducts, sellerOptions, activeRange, activeStat, isLoading, isUserReportLoading, isTransactionsLoading, isTopProductsLoading, isBestSellingProductsLoading, loadDashboardData, loadUserReportData, loadTransactionsData, loadTopProductsData, loadBestSellingProductsData, loadSellerDirectoryData]);

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};
