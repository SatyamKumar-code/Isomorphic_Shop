import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDashboardPageData } from "../DashboardPageAPI";

const getDefaultCardSettings = () => ({
    period: "7days",
    year: String(new Date().getFullYear()),
    month: String(new Date().getMonth() + 1).padStart(2, "0"),
});

const hasValue = (value) => value !== undefined && value !== null;

export const getDashboardPeriodLabel = (settings) => {
    if (settings.period === "month") {
        return `${settings.year} (Year-wise)`;
    }

    if (settings.period === "daywise") {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthLabel = monthNames[Number(settings.month) - 1] || "";
        return `${monthLabel} ${settings.year} (Month-wise)`;
    }

    return "Last 7 days";
};

export const useDashboardCardData = () => {
    const [cardSettings, setCardSettings] = useState(getDefaultCardSettings());
    const [summaryCards, setSummaryCards] = useState([]);
    const [dashboardSalesCard, setDashboardSalesCard] = useState(null);
    const [tabs, setTabs] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [availableMonths, setAvailableMonths] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const cardSettingsRef = useRef(cardSettings);

    useEffect(() => {
        cardSettingsRef.current = cardSettings;
    }, [cardSettings]);

    const loadDashboardCardData = useCallback(async (nextSettings = cardSettingsRef.current) => {
        try {
            setIsLoading(true);
            const params = { period: nextSettings.period };

            if (nextSettings.period === "month" || nextSettings.period === "daywise") {
                params.year = Number(nextSettings.year);
            }

            if (nextSettings.period === "daywise") {
                params.month = Number(nextSettings.month);
            }

            const res = await getDashboardPageData(params);
            const data = res?.data?.data || {};

            setSummaryCards(Array.isArray(data.summaryCards) ? data.summaryCards : []);
            setDashboardSalesCard(hasValue(data.dashboardSalesCard) ? data.dashboardSalesCard : null);
            setTabs(Array.isArray(data.tabs) ? data.tabs : []);
            setAvailableYears(Array.isArray(data.availableYears) ? data.availableYears : []);
            setAvailableMonths(Array.isArray(data.availableMonths) ? data.availableMonths : []);
        } catch (error) {
            console.error("Error loading dashboard card data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboardCardData(cardSettingsRef.current);
    }, [loadDashboardCardData]);

    const updateCardSettings = useCallback(async (patch) => {
        const nextSettings = {
            ...cardSettingsRef.current,
            ...patch,
        };

        cardSettingsRef.current = nextSettings;
        setCardSettings(nextSettings);
        await loadDashboardCardData(nextSettings);
    }, [loadDashboardCardData]);

    const value = useMemo(() => ({
        cardSettings,
        summaryCards,
        dashboardSalesCard,
        tabs,
        availableYears,
        availableMonths,
        isLoading,
        updateCardSettings,
        reloadDashboardCardData: loadDashboardCardData,
    }), [cardSettings, summaryCards, dashboardSalesCard, tabs, availableYears, availableMonths, isLoading, updateCardSettings, loadDashboardCardData]);

    return value;
};