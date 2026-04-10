import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { createAdminOrder, getOrderSummary, getOrders, updateOrderRefundStatus, updateOrderStatus } from "../../features/ordersManagement/OrderManagementAPI";

export const OrderContext = createContext();

const initialTabs = [
    { label: "All order", count: 0 },
    { label: "Pending", count: 0 },
    { label: "Confirmed", count: 0 },
    { label: "Packed", count: 0 },
    { label: "Shipped", count: 0 },
    { label: "Out For Delivery", count: 0 },
    { label: "Delivered", count: 0 },
    { label: "Cancelled", count: 0 },
];

const initialOrders = [];

const defaultPageSize = 10;

const paymentColor = {
    Paid: "#22C55E",
    Unpaid: "#EF4444",
};

const thumbnailColors = [
    { background: "#F1F8FF", color: "#2563EB" },
    { background: "#FFF7ED", color: "#EA580C" },
    { background: "#F0FDF4", color: "#16A34A" },
    { background: "#F5F3FF", color: "#7C3AED" },
    { background: "#FFF1F2", color: "#E11D48" },
    { background: "#EFF6FF", color: "#0284C7" },
];

const normalizeStatusValue = (value) => String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const formatStatusLabel = (value) => normalizeStatusValue(value)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const OrderProvider = ({ children }) => {
    const [summaryCards, setSummaryCards] = useState([]);
    const [tabs, setTabs] = useState(initialTabs);
    const [summaryPeriod, setSummaryPeriod] = useState("7days");
    const [summaryYear, setSummaryYear] = useState("");
    const [summaryMonth, setSummaryMonth] = useState("");
    const [availableSummaryYears, setAvailableSummaryYears] = useState([]);
    const [availableSummaryMonths, setAvailableSummaryMonths] = useState([]);
    const [orders, setOrders] = useState(initialOrders);
    const [activeTab, setActiveTab] = useState("All order");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [searchText, setSearchText] = useState("");
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [customerIdFilter, setCustomerIdFilter] = useState("");
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isStatusUpdatingId, setIsStatusUpdatingId] = useState("");
    const [isRefundUpdatingId, setIsRefundUpdatingId] = useState("");
    const [isCreateOrderLoading, setIsCreateOrderLoading] = useState(false);
    const latestOrdersRequestRef = useRef(0);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearchText(searchText.trim());
        }, 300);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [searchText]);

    const statusQuery = useMemo(() => {
        if (activeTab === "All order") return "";
        return String(activeTab || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");
    }, [activeTab]);

    const requestParams = useMemo(() => {
        const params = {
            page: currentPage,
            limit: pageSize,
        };

        if (statusQuery) {
            params.status = statusQuery;
        }

        if (debouncedSearchText) {
            params.search = debouncedSearchText;
        }

        if (paymentFilter && paymentFilter !== "all") {
            params.payment = paymentFilter;
        }

        if (customerIdFilter) {
            params.customerId = customerIdFilter;
        }

        return params;
    }, [currentPage, pageSize, statusQuery, debouncedSearchText, paymentFilter, customerIdFilter]);

    const exportBaseParams = useMemo(() => {
        const params = {};

        if (statusQuery) {
            params.status = statusQuery;
        }

        if (debouncedSearchText) {
            params.search = debouncedSearchText;
        }

        if (paymentFilter && paymentFilter !== "all") {
            params.payment = paymentFilter;
        }

        if (customerIdFilter) {
            params.customerId = customerIdFilter;
        }

        return params;
    }, [statusQuery, debouncedSearchText, paymentFilter, customerIdFilter]);

    const summaryRequestParams = useMemo(() => {
        const params = { period: summaryPeriod };

        if ((summaryPeriod === "month" || summaryPeriod === "daywise") && summaryYear) {
            params.year = Number(summaryYear);
        }

        if (summaryPeriod === "daywise" && summaryMonth) {
            params.month = Number(summaryMonth);
        }

        return params;
    }, [summaryPeriod, summaryYear, summaryMonth]);

    const loadSummary = useCallback(async (params = summaryRequestParams) => {
        try {
            const res = await getOrderSummary(params);
            const payload = res?.data?.data || {};

            if (Array.isArray(res?.data?.data?.summaryCards)) {
                setSummaryCards(res.data.data.summaryCards);
            }
            if (Array.isArray(res?.data?.data?.tabs)) {
                setTabs(res.data.data.tabs);
            }

            setAvailableSummaryYears(Array.isArray(payload.availableYears) ? payload.availableYears : []);
            setAvailableSummaryMonths(Array.isArray(payload.availableMonths) ? payload.availableMonths : []);

            if (typeof payload.period === 'string') {
                setSummaryPeriod(payload.period);
            }

            if (payload.selectedYear) {
                setSummaryYear(String(payload.selectedYear));
            }

            if (payload.selectedMonth) {
                setSummaryMonth(String(payload.selectedMonth).padStart(2, '0'));
            }
        } catch (error) {
            // Keep fallback local data when API is unavailable.
        }
    }, [summaryRequestParams]);

    const loadOrders = useCallback(async () => {
        const requestId = latestOrdersRequestRef.current + 1;
        latestOrdersRequestRef.current = requestId;

        try {
            setIsLoading(true);
            const res = await getOrders(requestParams);

            if (requestId !== latestOrdersRequestRef.current) {
                return;
            }

            const payloadOrders = Array.isArray(res?.data?.orders)
                ? res.data.orders
                : (Array.isArray(res?.data?.data) ? res.data.data : null);

            const apiTotalPages = Number(res?.data?.totalPages || 1);
            setTotalPages(Number.isFinite(apiTotalPages) && apiTotalPages > 0 ? apiTotalPages : 1);

            if (Array.isArray(payloadOrders)) {
                setOrders(payloadOrders);
            } else {
                setOrders([]);
            }
        } catch (error) {
            if (requestId !== latestOrdersRequestRef.current) {
                return;
            }

            setOrders([]);
        } finally {
            if (requestId === latestOrdersRequestRef.current) {
                setIsLoading(false);
            }
        }
    }, [requestParams]);

    const resetFilters = useCallback(() => {
        setActiveTab("All order");
        setSearchText("");
        setPaymentFilter("all");
        setPageSize(defaultPageSize);
        setCurrentPage(1);
    }, []);

    const exportCurrentOrdersCsv = useCallback(() => {
        if (!orders.length) {
            toast.error("No orders available to export");
            return;
        }

        const headers = ["Order Id", "Product", "Date", "Price", "Payment", "Status"];
        const rows = orders.map((order) => [
            order.orderId || order.id || "",
            order.product || "",
            order.date || "",
            order.price || "",
            order.payment || "",
            order.status || "",
        ]);

        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `orders-page-${currentPage}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, [orders, currentPage]);

    const fetchAllOrdersForExport = useCallback(async () => {
        const limit = 100;
        const firstResponse = await getOrders({
            ...exportBaseParams,
            page: 1,
            limit,
        });

        const firstPageOrders = Array.isArray(firstResponse?.data?.orders) ? firstResponse.data.orders : [];
        const totalPagesFromApi = Math.max(1, Number(firstResponse?.data?.totalPages || 1));
        let allOrders = [...firstPageOrders];

        if (totalPagesFromApi > 1) {
            const requests = [];
            for (let page = 2; page <= totalPagesFromApi; page += 1) {
                requests.push(getOrders({
                    ...exportBaseParams,
                    page,
                    limit,
                }));
            }

            const responses = await Promise.all(requests);
            const remainingOrders = responses.flatMap((response) => (
                Array.isArray(response?.data?.orders) ? response.data.orders : []
            ));

            allOrders = [...allOrders, ...remainingOrders];
        }

        return allOrders;
    }, [exportBaseParams]);

    const createOrderFromPayload = useCallback(async (payload) => {
        try {
            setIsCreateOrderLoading(true);
            const response = await createAdminOrder({
                ...payload,
            });

            toast.success(response?.data?.message || "Order created successfully");
            await Promise.all([loadOrders(), loadSummary()]);
            return true;
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to create order");
            return false;
        } finally {
            setIsCreateOrderLoading(false);
        }
    }, [loadOrders, loadSummary]);

    const handleStatusChange = useCallback(async (orderId, nextStatus) => {
        if (!orderId || !nextStatus) {
            return;
        }

        const normalizedNextStatus = normalizeStatusValue(nextStatus);
        const existingOrder = orders.find((order) => String(order.id) === String(orderId));

        if (!existingOrder) {
            return;
        }

        const previousStatus = normalizeStatusValue(existingOrder?.rawStatus || existingOrder?.status);
        const previousOrdersSnapshot = orders;
        const previousTabsSnapshot = tabs;

        if (previousStatus === normalizedNextStatus) {
            return;
        }

        try {
            setIsStatusUpdatingId(orderId);

            setOrders((prevOrders) => {
                const nextOrders = prevOrders.map((order) => {
                    if (String(order.id) !== String(orderId)) {
                        return order;
                    }

                    return {
                        ...order,
                        rawStatus: normalizedNextStatus,
                        status: formatStatusLabel(normalizedNextStatus),
                    };
                });

                const normalizedActiveTab = normalizeStatusValue(activeTab);
                if (normalizedActiveTab && normalizedActiveTab !== "all_order") {
                    return nextOrders.filter((order) => normalizeStatusValue(order.rawStatus || order.status) === normalizedActiveTab);
                }

                return nextOrders;
            });

            if (previousStatus && previousStatus !== normalizedNextStatus) {
                setTabs((prevTabs) => prevTabs.map((tab) => {
                    const tabStatus = normalizeStatusValue(tab.label);

                    if (tabStatus === previousStatus) {
                        return { ...tab, count: Math.max(0, Number(tab.count || 0) - 1) };
                    }

                    if (tabStatus === normalizedNextStatus) {
                        return { ...tab, count: Number(tab.count || 0) + 1 };
                    }

                    return tab;
                }));
            }

            const response = await updateOrderStatus(orderId, { status: normalizedNextStatus });
            toast.success(response?.data?.message || "Order status updated");
        } catch (error) {
            setOrders(previousOrdersSnapshot);
            setTabs(previousTabsSnapshot);
            toast.error(error?.response?.data?.message || "Failed to update order status");
        } finally {
            setIsStatusUpdatingId("");
        }
    }, [orders, tabs, activeTab]);

    const handleRefundStatusChange = useCallback(async (orderId, nextRefundStatus) => {
        if (!orderId || !nextRefundStatus) {
            return;
        }

        const previousOrdersSnapshot = orders;
        const normalizedNextRefundStatus = String(nextRefundStatus || "").toLowerCase();

        try {
            setIsRefundUpdatingId(orderId);

            setOrders((prevOrders) => prevOrders.map((order) => {
                if (String(order.id) !== String(orderId)) {
                    return order;
                }

                return {
                    ...order,
                    rawRefundStatus: normalizedNextRefundStatus,
                };
            }));

            const response = await updateOrderRefundStatus(orderId, { refundStatus: normalizedNextRefundStatus });
            toast.success(response?.data?.message || "Order refund status updated");
        } catch (error) {
            setOrders(previousOrdersSnapshot);
            toast.error(error?.response?.data?.message || "Failed to update refund status");
        } finally {
            setIsRefundUpdatingId("");
        }
    }, [orders]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary, summaryRequestParams]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, debouncedSearchText, paymentFilter, pageSize, customerIdFilter]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const pagination = useMemo(() => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        const pages = [1];
        if (currentPage > 3) {
            pages.push("...");
        }

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let page = start; page <= end; page += 1) {
            pages.push(page);
        }

        if (currentPage < totalPages - 2) {
            pages.push("...");
        }

        pages.push(totalPages);
        return pages;
    }, [totalPages, currentPage]);

    const value = useMemo(() => ({
        summaryCards,
        tabs,
        summaryPeriod,
        setSummaryPeriod,
        summaryYear,
        setSummaryYear,
        summaryMonth,
        setSummaryMonth,
        availableSummaryYears,
        availableSummaryMonths,
        orders,
        paymentColor,
        thumbnailColors,
        pagination,
        totalPages,
        pageSize,
        setPageSize,
        activeTab,
        setActiveTab,
        currentPage,
        setCurrentPage,
        searchText,
        setSearchText,
        paymentFilter,
        setPaymentFilter,
        customerIdFilter,
        setCustomerIdFilter,
        isLoading,
        isCreateOrderLoading,
        isStatusUpdatingId,
        isRefundUpdatingId,
        resetFilters,
        exportCurrentOrdersCsv,
        fetchAllOrdersForExport,
        createOrderFromPayload,
        handleStatusChange,
        handleRefundStatusChange,
        reloadOrders: loadOrders,
    }), [summaryCards, tabs, summaryPeriod, summaryYear, summaryMonth, availableSummaryYears, availableSummaryMonths, orders, pagination, totalPages, pageSize, activeTab, currentPage, searchText, paymentFilter, customerIdFilter, isLoading, isCreateOrderLoading, isStatusUpdatingId, isRefundUpdatingId, loadOrders, setPageSize, setActiveTab, setCurrentPage, setSearchText, setPaymentFilter, setCustomerIdFilter, resetFilters, exportCurrentOrdersCsv, fetchAllOrdersForExport, createOrderFromPayload, handleStatusChange, handleRefundStatusChange]);

    return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
