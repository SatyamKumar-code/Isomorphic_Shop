import { createContext, useEffect, useMemo, useState } from "react";
import { getCustomersAnalytics } from "../../features/customers/CustomersAPI";

export const CustomersContext = createContext();

const summaryCards = [];

const overviewStats = [];

const weekSeries = {
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
};

const periodOptions = [
    { label: "Last 7 Days", value: "7days" },
    { label: "Day-wise", value: "daywise" },
    { label: "Month-wise (Jan-Dec)", value: "month" },
    { label: "Year-wise", value: "year" },
];

const monthOptions = [
    { value: 1, label: "Jan" },
    { value: 2, label: "Feb" },
    { value: 3, label: "Mar" },
    { value: 4, label: "Apr" },
    { value: 5, label: "May" },
    { value: 6, label: "Jun" },
    { value: 7, label: "Jul" },
    { value: 8, label: "Aug" },
    { value: 9, label: "Sep" },
    { value: 10, label: "Oct" },
    { value: 11, label: "Nov" },
    { value: 12, label: "Dec" },
];

const defaultRangeOptions = [
    { label: "This week", value: "This week" },
    { label: "Last week", value: "Last week" },
];
const getSafeStat = (stats) => {
    if (!Array.isArray(stats) || !stats.length) {
        return "activeCustomers";
    }

    const firstStat = stats[0];
    return firstStat?.key || firstStat?.valueKey || firstStat?.label || "activeCustomers";
};

const formatServerDate = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}.${month}.${date.getFullYear()}`;
};

const normalizeCustomer = (customer, index) => ({
    ...customer,
    uid: customer.uid || customer._id || String(index + 1),
    id: customer.id || `#CUST${String(index + 1).padStart(4, "0")}`,
    phone: customer.phone || (customer.mobile ? `+${customer.mobile}` : "-"),
    address: customer.address || "-",
    registrationDate: customer.registrationDate || formatServerDate(customer.createdAt),
    lastPurchaseDate: customer.lastPurchaseDate || formatServerDate(customer.lastPurchaseDateRaw || customer.updatedAt || customer.createdAt),
});

const getPaginationItems = (currentPage, totalPages) => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
        return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
};

const PAGE_SIZE = 10;

const statusColors = {
    Active: "#22C55E",
    Inactive: "#EF4444",
    VIP: "#F59E0B",
};

export const CustomersProvider = ({ children }) => {
    const [activeRange, setActiveRange] = useState("This week");
    const [analyticsPeriod, setAnalyticsPeriod] = useState("7days");
    const [periodLabel, setPeriodLabel] = useState("Last 7 days");
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [availableYears, setAvailableYears] = useState([]);
    const [rangeOptions, setRangeOptions] = useState(defaultRangeOptions);
    const [xLabelsByRange, setXLabelsByRange] = useState({});
    const [activeStat, setActiveStat] = useState(getSafeStat(overviewStats));
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [customerRecords, setCustomerRecords] = useState([]);
    const [summaryCardData, setSummaryCardData] = useState(summaryCards);
    const [overviewStatData, setOverviewStatData] = useState(overviewStats);
    const [weekSeriesData, setWeekSeriesData] = useState(weekSeries);

    useEffect(() => {
        let isMounted = true;

        const fetchCustomers = async () => {
            try {
                const requestParams = {
                    period: analyticsPeriod,
                };

                if (selectedYear) {
                    requestParams.year = Number(selectedYear);
                }

                if (selectedMonth) {
                    requestParams.month = Number(selectedMonth);
                }

                const response = await getCustomersAnalytics(requestParams);
                const payload = response.data?.data || response.data || {};

                if (!isMounted) {
                    return;
                }

                const nextCustomers = Array.isArray(payload.customers) ? payload.customers.map(normalizeCustomer) : [];
                setCustomerRecords(nextCustomers);
                setSummaryCardData(Array.isArray(payload.summaryCards) ? payload.summaryCards : summaryCards);
                setOverviewStatData(Array.isArray(payload.overviewStats) ? payload.overviewStats : overviewStats);
                setWeekSeriesData(payload.weekSeries && typeof payload.weekSeries === "object" ? payload.weekSeries : weekSeries);
                const nextPeriodLabel = payload.periodLabel
                    || (analyticsPeriod === "month"
                        ? "Month-wise"
                        : analyticsPeriod === "year"
                            ? "Year-wise"
                            : analyticsPeriod === "daywise"
                                ? "Day-wise"
                                : "Last 7 days");
                setPeriodLabel(nextPeriodLabel);
                setXLabelsByRange(payload.xLabelsByRange && typeof payload.xLabelsByRange === "object" ? payload.xLabelsByRange : {});
                const nextAvailableYears = Array.isArray(payload.availableYears) ? payload.availableYears : [];
                setAvailableYears(nextAvailableYears);

                if (payload.selectedYear) {
                    setSelectedYear(String(payload.selectedYear));
                } else if (!selectedYear && nextAvailableYears.length) {
                    setSelectedYear(String(nextAvailableYears[nextAvailableYears.length - 1]));
                }

                if (payload.selectedMonth) {
                    setSelectedMonth(String(payload.selectedMonth));
                }

                const nextRangeOptions = Array.isArray(payload.ranges) && payload.ranges.length
                    ? payload.ranges
                    : defaultRangeOptions;
                setRangeOptions(nextRangeOptions);

                const rangeValues = nextRangeOptions.map((item) => item.value);
                setActiveRange((current) => (rangeValues.includes(current) ? current : nextRangeOptions[0].value));
                setActiveStat((current) => current || getSafeStat(Array.isArray(payload.overviewStats) ? payload.overviewStats : overviewStats));
            } catch {
                if (!isMounted) {
                    return;
                }

                setCustomerRecords([]);
                setSummaryCardData(summaryCards);
                setOverviewStatData(overviewStats);
                setWeekSeriesData(weekSeries);
                setPeriodLabel(
                    analyticsPeriod === "month"
                        ? "Month-wise"
                        : analyticsPeriod === "year"
                            ? "Year-wise"
                            : analyticsPeriod === "daywise"
                                ? "Day-wise"
                                : "Last 7 days",
                );
                setRangeOptions(defaultRangeOptions);
                setXLabelsByRange({});
                setAvailableYears([]);
            }
        };

        fetchCustomers();

        return () => {
            isMounted = false;
        };
    }, [analyticsPeriod, selectedYear, selectedMonth]);

    const totalPages = Math.max(1, Math.ceil(customerRecords.length / PAGE_SIZE));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const pagination = useMemo(() => getPaginationItems(currentPage, totalPages), [currentPage, totalPages]);

    const visibleCustomers = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return customerRecords.slice(start, start + PAGE_SIZE);
    }, [currentPage, customerRecords]);

    const selectedCustomer = useMemo(() => {
        if (!selectedCustomerId) {
            return null;
        }

        return customerRecords.find((customer) => customer.uid === selectedCustomerId) || null;
    }, [selectedCustomerId, customerRecords]);

    const value = useMemo(() => ({
        summaryCards: summaryCardData,
        overviewStats: overviewStatData,
        weekSeries: weekSeriesData,
        analyticsPeriod,
        setAnalyticsPeriod,
        periodOptions,
        monthOptions,
        periodLabel,
        selectedYear,
        setSelectedYear,
        selectedMonth,
        setSelectedMonth,
        availableYears,
        rangeOptions,
        xLabelsByRange,
        activeRange,
        setActiveRange,
        activeStat,
        setActiveStat,
        customers: visibleCustomers,
        allCustomers: customerRecords,
        selectedCustomer,
        selectedCustomerId,
        setSelectedCustomerId,
        currentPage,
        setCurrentPage,
        pagination,
        totalPages,
        statusColors,
    }), [activeRange, activeStat, visibleCustomers, customerRecords, selectedCustomer, selectedCustomerId, currentPage, pagination, totalPages, summaryCardData, overviewStatData, weekSeriesData, analyticsPeriod, periodLabel, selectedYear, selectedMonth, availableYears, rangeOptions, xLabelsByRange]);

    return <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>;
};