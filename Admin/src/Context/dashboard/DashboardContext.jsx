/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { getDashboardPageData } from "../../features/Dashboard/DashboardPageAPI";

export const DashboardContext = createContext();

const defaultWeeklyReport = {
    title: "Report for this week",
    stats: [
        { key: "customers", value: "52k", label: "Customers" },
        { key: "totalProducts", value: "3.5k", label: "Total Products" },
        { key: "stockProducts", value: "2.5k", label: "Stock Products" },
        { key: "outOfStock", value: "0.5k", label: "Out of Stock" },
        { key: "revenue", value: "250k", label: "Revenue" },
    ],
    ranges: [
        { label: "This week", value: "This week" },
        { label: "Last week", value: "Last week" },
    ],
    chartSeries: {
        "This week": {
            customers: [170000, 250000, 210090, 145000, 190080, 190000, 130000],
            totalProducts: [12000, 16000, 18000, 17000, 22000, 20000, 19500],
            stockProducts: [9000, 11000, 13000, 12500, 14500, 14100, 13800],
            outOfStock: [1800, 2200, 2100, 2500, 2400, 2300, 2600],
            revenue: [210000, 240000, 230000, 260000, 255000, 270000, 250000],
        },
        "Last week": {
            customers: [14000, 21000, 19000, 12000, 16800, 16000, 11000],
            totalProducts: [8000, 9500, 10200, 9800, 11100, 10900, 9300],
            stockProducts: [6400, 7100, 7600, 7300, 8200, 7900, 7200],
            outOfStock: [1300, 1500, 1450, 1600, 1700, 1680, 1550],
            revenue: [120000, 138000, 131000, 146000, 149000, 142000, 135000],
        },
    },
    xLabels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

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

export const DashboardProvider = ({ children }) => {
    const [weeklyReport, setWeeklyReport] = useState(defaultWeeklyReport);
    const [activeRange, setActiveRange] = useState(getSafeRange(defaultWeeklyReport.ranges));
    const [activeStat, setActiveStat] = useState(getSafeStat(defaultWeeklyReport.stats));
    const [isLoading, setIsLoading] = useState(false);

    const loadDashboardData = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await getDashboardPageData();
            const data = res?.data?.data;

            // Update weekly report if available
            const apiWeeklyReport = data?.weeklyReport;
            if (apiWeeklyReport && typeof apiWeeklyReport === "object") {
                setWeeklyReport((prev) => ({
                    ...prev,
                    ...apiWeeklyReport,
                    chartSeries: {
                        ...prev.chartSeries,
                        ...(apiWeeklyReport.chartSeries || {}),
                    },
                }));
            }

        } catch (error) {
            // Keep fallback dashboard data when API is unavailable.
            console.error("Error loading dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load on mount
    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    useEffect(() => {
        if (!hasSeriesForRangeAndStat(weeklyReport.chartSeries, activeRange, activeStat)) {
            setActiveRange(getSafeRange(weeklyReport.ranges));
        }
    }, [weeklyReport, activeRange, activeStat]);

    useEffect(() => {
        if (!activeStat || !hasSeriesForRangeAndStat(weeklyReport.chartSeries, activeRange, activeStat)) {
            setActiveStat(getSafeStat(weeklyReport.stats));
        }
    }, [weeklyReport, activeRange, activeStat]);

    const weeklyReportProps = useMemo(() => ({
        ...weeklyReport,
        activeRange,
        onRangeChange: setActiveRange,
        activeStat,
        onStatChange: setActiveStat,
    }), [weeklyReport, activeRange, activeStat]);

    const value = useMemo(() => ({
        // Weekly report
        weeklyReport,
        weeklyReportProps,
        activeRange,
        setActiveRange,
        activeStat,
        setActiveStat,

        // Loading and reload
        isLoading,
        reloadDashboardData: loadDashboardData,
    }), [weeklyReport, weeklyReportProps, activeRange, activeStat, isLoading, loadDashboardData]);

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};
