import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getOrderSummary, getOrders } from "../../features/ordersManagement/OrderManagementAPI";

export const OrderContext = createContext();

const initialSummaryCards = [
    { title: "Total Orders", value: "1,240", change: "+14.4%", changeDirection: "up", changeColor: "#4EA674" },
    { title: "New Orders", value: "240", change: "+20%", changeDirection: "up", changeColor: "#4EA674" },
    { title: "Completed Orders", value: "960", change: "85%", changeDirection: "up", changeColor: "#4EA674" },
    { title: "Canceled Orders", value: "87", change: "-5%", changeDirection: "down", changeColor: "#EF4444" },
];

const initialTabs = [
    { label: "All order", count: 240 },
    { label: "Delivered", count: null },
    { label: "Pending", count: null },
    { label: "Cancelled", count: null },
];

const initialOrders = [];

const pageSize = 10;

const paymentColor = {
    Paid: "#22C55E",
    Unpaid: "#EF4444",
};

const statusColor = {
    Delivered: "#22C55E",
    Pending: "#F59E0B",
    Shipped: "#111827",
    Cancelled: "#EF4444",
};

const thumbnailColors = [
    { background: "#F1F8FF", color: "#2563EB" },
    { background: "#FFF7ED", color: "#EA580C" },
    { background: "#F0FDF4", color: "#16A34A" },
    { background: "#F5F3FF", color: "#7C3AED" },
    { background: "#FFF1F2", color: "#E11D48" },
    { background: "#EFF6FF", color: "#0284C7" },
];

export const OrderProvider = ({ children }) => {
    const [summaryCards, setSummaryCards] = useState(initialSummaryCards);
    const [tabs, setTabs] = useState(initialTabs);
    const [orders, setOrders] = useState(initialOrders);
    const [activeTab, setActiveTab] = useState("All order");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchText, setSearchText] = useState("");
    const [customerIdFilter, setCustomerIdFilter] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const latestOrdersRequestRef = useRef(0);

    const loadSummary = useCallback(async () => {
        try {
            const res = await getOrderSummary();
            if (Array.isArray(res?.data?.data?.summaryCards)) {
                setSummaryCards(res.data.data.summaryCards);
            }
            if (Array.isArray(res?.data?.data?.tabs)) {
                setTabs(res.data.data.tabs);
            }
        } catch (error) {
            // Keep fallback local data when API is unavailable.
        }
    }, []);

    const loadOrders = useCallback(async () => {
        const requestId = latestOrdersRequestRef.current + 1;
        latestOrdersRequestRef.current = requestId;

        try {
            setIsLoading(true);
            const params = customerIdFilter ? { customerId: customerIdFilter } : {};
            const res = await getOrders(params);

            if (requestId !== latestOrdersRequestRef.current) {
                return;
            }

            const payloadOrders = Array.isArray(res?.data?.orders)
                ? res.data.orders
                : (Array.isArray(res?.data?.data) ? res.data.data : null);

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
    }, [customerIdFilter]);

    useEffect(() => {
        loadSummary();
        loadOrders();
    }, [loadSummary, loadOrders]);

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const tabMatched = activeTab === "All order" || order.status.toLowerCase() === activeTab.toLowerCase();
            const searchValue = searchText.trim().toLowerCase();

            if (!searchValue) {
                return tabMatched;
            }

            return (
                tabMatched &&
                [order.id, order.product, order.date, order.price, order.payment, order.status]
                    .join(" ")
                    .toLowerCase()
                    .includes(searchValue)
            );
        });
    }, [orders, activeTab, searchText]);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredOrders.length / pageSize));
    }, [filteredOrders.length]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchText]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredOrders.slice(start, start + pageSize);
    }, [filteredOrders, currentPage]);

    const pagination = useMemo(() => {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }, [totalPages]);

    const value = useMemo(() => ({
        summaryCards,
        tabs,
        orders: paginatedOrders,
        paymentColor,
        statusColor,
        thumbnailColors,
        pagination,
        totalPages,
        pageSize,
        activeTab,
        setActiveTab,
        currentPage,
        setCurrentPage,
        searchText,
        setSearchText,
        customerIdFilter,
        setCustomerIdFilter,
        isLoading,
        reloadOrders: loadOrders,
    }), [summaryCards, tabs, paginatedOrders, pagination, totalPages, activeTab, currentPage, searchText, customerIdFilter, isLoading, loadOrders]);

    return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
