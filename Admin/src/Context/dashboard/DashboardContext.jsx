/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDashboardPageData, getDashboardUserReport, getTransactions } from "../../features/Dashboard/DashboardPageAPI";

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

export const DashboardProvider = ({ children }) => {
    const [weeklyReport, setWeeklyReport] = useState(null);
    const [userReport, setUserReport] = useState(null);
    const [transactions, setTransactions] = useState(null);
    const [activeRange, setActiveRange] = useState("");
    const [activeStat, setActiveStat] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isUserReportLoading, setIsUserReportLoading] = useState(false);
    const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
    const latestWeeklyReportRequestRef = useRef(0);
    const latestUserReportRequestRef = useRef(0);
    const latestTransactionsRequestRef = useRef(0);

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
        activeRange,
        setActiveRange,
        activeStat,
        setActiveStat,
        isLoading,
        isUserReportLoading,
        isTransactionsLoading,
        reloadDashboardData: loadDashboardData,
        reloadUserReportData: loadUserReportData,
        reloadTransactions: loadTransactionsData,
    }), [weeklyReport, weeklyReportProps, userReport, userReportProps, transactions, activeRange, activeStat, isLoading, isUserReportLoading, isTransactionsLoading, loadDashboardData, loadUserReportData, loadTransactionsData]);

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};
