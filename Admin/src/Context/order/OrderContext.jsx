import { createContext, useCallback, useEffect, useMemo, useState } from "react";
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

const initialOrders = [
    { id: "#ORD0001", product: "Wireless Bluetooth Headphones", image: "https://picsum.photos/seed/headphones/80/80", date: "01-01-2025", price: "49.99", payment: "Paid", status: "Delivered" },
    { id: "#ORD0002", product: "Men's T-Shirt", image: "https://picsum.photos/seed/tshirt1/80/80", date: "01-01-2025", price: "14.99", payment: "Unpaid", status: "Pending" },
    { id: "#ORD0003", product: "Men's Leather Wallet", image: "https://picsum.photos/seed/wallet/80/80", date: "01-01-2025", price: "49.99", payment: "Paid", status: "Delivered" },
    { id: "#ORD0004", product: "Memory Foam Pillow", image: "https://picsum.photos/seed/pillow/80/80", date: "01-01-2025", price: "39.99", payment: "Paid", status: "Shipped" },
    { id: "#ORD0005", product: "Adjustable Dumbbells", image: "https://picsum.photos/seed/dumbbells/80/80", date: "01-01-2025", price: "14.99", payment: "Unpaid", status: "Pending" },
    { id: "#ORD0006", product: "Coffee Maker", image: "https://picsum.photos/seed/coffeemaker/80/80", date: "01-01-2025", price: "79.99", payment: "Unpaid", status: "Cancelled" },
    { id: "#ORD0007", product: "Casual Baseball Cap", image: "https://picsum.photos/seed/cap/80/80", date: "01-01-2025", price: "49.99", payment: "Paid", status: "Delivered" },
    { id: "#ORD0008", product: "Full HD Webcam", image: "https://picsum.photos/seed/webcam/80/80", date: "01-01-2025", price: "39.99", payment: "Paid", status: "Delivered" },
    { id: "#ORD0009", product: "Smart LED Color Bulb", image: "https://picsum.photos/seed/bulb/80/80", date: "01-01-2025", price: "79.99", payment: "Unpaid", status: "Delivered" },
    { id: "#ORD0010", product: "Men's T-Shirt", image: "https://picsum.photos/seed/tshirt2/80/80", date: "01-01-2025", price: "14.99", payment: "Unpaid", status: "Delivered" },
    { id: "#ORD0011", product: "Men's T-Shirt", image: "https://picsum.photos/seed/tshirt3/80/80", date: "01-01-2025", price: "14.99", payment: "Unpaid", status: "Delivered" },
    { id: "#ORD0012", product: "Wireless Bluetooth Headphones", image: "https://picsum.photos/seed/headphones/80/80", date: "01-01-2025", price: "49.99", payment: "Paid", status: "Delivered" },
    { id: "#ORD0013", product: "Men's T-Shirt", image: "https://picsum.photos/seed/tshirt1/80/80", date: "01-01-2025", price: "14.99", payment: "Unpaid", status: "Pending" },
    { id: "#ORD0014", product: "Men's Leather Wallet", image: "https://picsum.photos/seed/wallet/80/80", date: "01-01-2025", price: "49.99", payment: "Paid", status: "Delivered" },
    { id: "#ORD0015", product: "Memory Foam Pillow", image: "https://picsum.photos/seed/pillow/80/80", date: "01-01-2025", price: "39.99", payment: "Paid", status: "Shipped" },
    { id: "#ORD0016", product: "Adjustable Dumbbells", image: "https://picsum.photos/seed/dumbbells/80/80", date: "01-01-2025", price: "14.99", payment: "Unpaid", status: "Pending" },
    { id: "#ORD0017", product: "Coffee Maker", image: "https://picsum.photos/seed/coffeemaker/80/80", date: "01-01-2025", price: "79.99", payment: "Unpaid", status: "Cancelled" },
    { id: "#ORD0018", product: "Casual Baseball Cap", image: "https://picsum.photos/seed/cap/80/80", date: "01-01-2025", price: "49.99", payment: "Paid", status: "Delivered" },
    { id: "#ORD0019", product: "Full HD Webcam", image: "https://picsum.photos/seed/webcam/80/80", date: "01-01-2025", price: "39.99", payment: "Paid", status: "Delivered" },
    { id: "#ORD0020", product: "Smart LED Color Bulb", image: "https://picsum.photos/seed/bulb/80/80", date: "01-01-2025", price: "79.99", payment: "Unpaid", status: "Delivered" },
    { id: "#ORD0021", product: "Men's T-Shirt", image: "https://picsum.photos/seed/tshirt2/80/80", date: "01-01-2025", price: "14.99", payment: "Unpaid", status: "Delivered" },
    { id: "#ORD0022", product: "Men's T-Shirt", image: "https://picsum.photos/seed/tshirt3/80/80", date: "01-01-2025", price: "14.99", payment: "Unpaid", status: "Delivered" },
];

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
    const [isLoading, setIsLoading] = useState(false);

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
        try {
            setIsLoading(true);
            const res = await getOrders();
            if (Array.isArray(res?.data?.data)) {
                setOrders(res.data.data);
            }
        } catch (error) {
            // Keep fallback local data when API is unavailable.
        } finally {
            setIsLoading(false);
        }
    }, []);

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
        isLoading,
        reloadOrders: loadOrders,
    }), [summaryCards, tabs, paginatedOrders, pagination, totalPages, activeTab, currentPage, searchText, isLoading, loadOrders]);

    return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
