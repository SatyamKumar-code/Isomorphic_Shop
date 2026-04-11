import React, { createContext, useState, useCallback, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../auth/useAuth';
import {
    getPayoutDashboard,
    getSellerOrderPayoutRows,
    getSellerPayoutHistory,
    updateSellerPaidAmount,
} from '../../features/Transaction/TransactionAPI';

export const TransactionContext = createContext();

const DEFAULT_SUMMARY = {
    totalOrders: 0,
    userPaidOrders: 0,
    refundOrders: 0,
    grossSales: 0,
    commissionAmount: 0,
    netRevenue: 0,
    userPaidRevenue: 0,
    paidAmount: 0,
    payoutDue: 0,
    refundTotal: 0,
    commissionRate: 10,
    currency: 'INR',
};

const DEFAULT_PERIODS = {
    last7Days: { orders: 0, grossSales: 0, netRevenue: 0, paidRevenue: 0 },
    monthToDate: { orders: 0, grossSales: 0, netRevenue: 0, paidRevenue: 0 },
    yearToDate: { orders: 0, grossSales: 0, netRevenue: 0, paidRevenue: 0 },
};

const PAYOUT_PERIOD_OPTIONS = [7, 15, 30, 90];

const mapTabLabelToQuery = (label) => {
    if (label === 'User Paid') return 'user_paid';
    if (label === 'Payment Pending') return 'payment_pending';
    if (label === 'Refunded') return 'refunded';
    if (label === 'Cancelled') return 'cancelled';
    return 'all';
};

const buildTabs = (items) => ([
    { label: 'All order', count: items.length },
    { label: 'User Paid', count: items.filter((item) => item.userPaymentDone).length },
    { label: 'Payment Pending', count: items.filter((item) => !item.userPaymentDone && item.rawOrderStatus !== 'cancelled').length },
    { label: 'Refunded', count: items.filter((item) => item.isRefunded).length },
    { label: 'Cancelled', count: items.filter((item) => item.rawOrderStatus === 'cancelled').length },
]);

const formatOrderDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStatusBadge = (item) => {
    if (item.rawOrderStatus === 'cancelled') return 'Cancelled';
    if (item.isRefunded) return 'Refunded';
    if (item.userPaymentDone) return 'User Paid';
    return 'Payment Pending';
};

const mapOrderRow = (row) => {
    const paymentMethod = String(row?.paymentMethod || 'COD');
    const paymentStatus = String(row?.paymentStatus || 'pending').toLowerCase();
    const rawOrderStatus = String(row?.rawOrderStatus || 'pending').toLowerCase();

    return {
        id: String(row?.id || ''),
        orderId: String(row?.orderId || ''),
        customerName: String(row?.customer?.name || 'Unknown Customer'),
        customerEmail: String(row?.customer?.email || ''),
        date: row?.date || formatOrderDate(row?.createdAt),
        method: paymentMethod,
        paymentStatus,
        paymentId: String(row?.paymentId || ''),
        refundStatus: String(row?.refundStatus || 'none'),
        rawOrderStatus,
        createdAt: row?.createdAt,
        status: getStatusBadge(row),
        userPaymentDone: Boolean(row?.userPaymentDone),
        isRefunded: Boolean(row?.isRefunded),
        grossSales: Number(row?.grossSales || 0),
        commissionAmount: Number(row?.commissionAmount || 0),
        netAfterRefund: Number(row?.netAfterRefund || 0),
        commissionRate: Number(row?.commissionRate || 0),
        payoutEligible: Boolean(row?.userPaymentDone) && !Boolean(row?.isRefunded) && rawOrderStatus !== 'cancelled',
        payoutMarked: Boolean(row?.payoutMarked),
        searchValue: [
            row?.orderId,
            row?.customer?.name,
            row?.customer?.email,
            paymentMethod,
            row?.paymentStatus,
            row?.refundStatus,
        ].filter(Boolean).join(' ').toLowerCase(),
    };
};

export const TransactionProvider = ({ children }) => {
    const { userData } = useAuth();
    const isAdmin = userData?.role === 'admin';
    const isSeller = userData?.role === 'seller';

    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(DEFAULT_SUMMARY);
    const [periods, setPeriods] = useState(DEFAULT_PERIODS);
    const [sellerWiseSummaries, setSellerWiseSummaries] = useState([]);
    const [sellerOptions, setSellerOptions] = useState([]);
    const [selectedSellerId, setSelectedSellerId] = useState('');
    const [payoutHistory, setPayoutHistory] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalResults, setTotalResults] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [activeTab, setActiveTab] = useState('All order');
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [payoutSourceRows, setPayoutSourceRows] = useState([]);
    const [filterData, setFilterData] = useState({
        method: '',
        searchTerm: '',
    });
    const [tabs, setTabs] = useState([
        { label: 'All order', count: 0 },
        { label: 'User Paid', count: 0 },
        { label: 'Payment Pending', count: 0 },
        { label: 'Refunded', count: 0 },
    ]);
    const [payoutForm, setPayoutForm] = useState({
        periodDays: 7,
        note: '',
        orderId: '',
    });
    const [isPayoutUpdating, setIsPayoutUpdating] = useState(false);
    const loadSellerDirectory = useCallback(async () => {
        if (!isAdmin) {
            return;
        }

        const response = await getPayoutDashboard();
        const sellerWise = Array.isArray(response?.data?.data?.sellerWise) ? response.data.data.sellerWise : [];
        setSellerWiseSummaries(sellerWise);

        const options = sellerWise.map((item) => ({
            id: String(item.sellerId || ''),
            name: item.sellerName || 'Unknown Seller',
        })).filter((item) => item.id);

        setSellerOptions(options);

        if (!selectedSellerId && options.length > 0) {
            setSelectedSellerId(options[0].id);
        }
    }, [isAdmin, selectedSellerId]);

    const fetchAllOrderRows = useCallback(async (sellerId) => {
        const pageLimit = 100;
        const rows = [];
        let page = 1;
        let totalPages = 1;

        do {
            const params = { page, limit: pageLimit };
            if (sellerId) params.sellerId = sellerId;

            const response = await getSellerOrderPayoutRows(params);
            const payload = response?.data?.data || {};
            const chunk = Array.isArray(payload.rows) ? payload.rows : [];
            rows.push(...chunk);

            totalPages = Number(payload?.pagination?.totalPages || 1);
            page += 1;
        } while (page <= totalPages);

        return rows;
    }, []);

    const loadScopedSellerData = useCallback(async (sellerId) => {
        if (!isAdmin && !isSeller) {
            return;
        }

        setIsLoading(true);

        try {
            const dashboardParams = {};
            const listParams = {
                page: currentPage,
                limit: pageSize,
                tab: mapTabLabelToQuery(activeTab),
                method: filterData.method || '',
                searchTerm: filterData.searchTerm || '',
            };
            const historyParams = { page: 1, limit: 100 };

            if (sellerId) {
                dashboardParams.sellerId = sellerId;
                listParams.sellerId = sellerId;
                historyParams.sellerId = sellerId;
            }

            const [dashboardRes, rowsRes, allRows, historyRes] = await Promise.all([
                getPayoutDashboard(dashboardParams),
                getSellerOrderPayoutRows(listParams),
                fetchAllOrderRows(sellerId),
                getSellerPayoutHistory(historyParams),
            ]);

            const dashboardData = dashboardRes?.data?.data || {};
            const scopedSummary = dashboardData?.summary || DEFAULT_SUMMARY;
            const scopedPeriods = dashboardData?.periods || DEFAULT_PERIODS;
            const rowsPayload = rowsRes?.data?.data || {};
            const rows = Array.isArray(rowsPayload?.rows) ? rowsPayload.rows : [];
            const mappedRows = rows.map((row) => mapOrderRow(row));
            const mappedAllRows = allRows.map((row) => mapOrderRow(row));

            const tabsPayload = rowsPayload?.tabs || {};
            const methodsPayload = Array.isArray(rowsPayload?.paymentMethods) ? rowsPayload.paymentMethods : [];
            const paginationPayload = rowsPayload?.pagination || {};

            setSummary({
                ...DEFAULT_SUMMARY,
                ...scopedSummary,
            });
            setPeriods({
                ...DEFAULT_PERIODS,
                ...scopedPeriods,
            });
            setTransactions(mappedRows);
            setPayoutSourceRows(mappedAllRows);
            setTabs([
                { label: 'All order', count: Number(tabsPayload?.all || 0) },
                { label: 'User Paid', count: Number(tabsPayload?.userPaid || 0) },
                { label: 'Payment Pending', count: Number(tabsPayload?.paymentPending || 0) },
                { label: 'Refunded', count: Number(tabsPayload?.refunded || 0) },
                { label: 'Cancelled', count: Number(tabsPayload?.cancelled || 0) },
            ]);
            setPaymentMethods(methodsPayload.map((method) => ({ label: method, value: method })));
            setTotalResults(Number(paginationPayload?.total || 0));
            setTotalPages(Number(paginationPayload?.totalPages || 1));
            setPayoutForm((prev) => ({ ...prev, orderId: '' }));

            const history = Array.isArray(historyRes?.data?.data?.history) ? historyRes.data.data.history : [];
            setPayoutHistory(history);
        } catch (error) {
            toast.error('Failed to fetch seller transaction data');
            console.error('Error loading seller transaction data:', error);
            setSummary(DEFAULT_SUMMARY);
            setPeriods(DEFAULT_PERIODS);
            setTransactions([]);
            setPayoutSourceRows([]);
            setTabs(buildTabs([]));
            setPaymentMethods([]);
            setTotalResults(0);
            setTotalPages(1);
            setPayoutHistory([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, currentPage, fetchAllOrderRows, filterData.method, filterData.searchTerm, isAdmin, isSeller, pageSize]);

    useEffect(() => {
        if (!isAdmin) {
            return;
        }

        loadSellerDirectory().catch((error) => {
            console.error('Error loading seller directory:', error);
        });
    }, [isAdmin, loadSellerDirectory]);

    useEffect(() => {
        if (!isSeller) {
            return;
        }

        loadScopedSellerData('').catch((error) => {
            console.error('Error loading seller payout data:', error);
        });
    }, [isSeller, loadScopedSellerData, currentPage, pageSize, activeTab, filterData.method, filterData.searchTerm]);

    useEffect(() => {
        if (!isAdmin || !selectedSellerId) {
            return;
        }

        loadScopedSellerData(selectedSellerId).catch((error) => {
            console.error('Error loading selected seller payout data:', error);
        });
    }, [isAdmin, selectedSellerId, loadScopedSellerData, currentPage, pageSize, activeTab, filterData.method, filterData.searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, filterData.method, filterData.searchTerm, pageSize, selectedSellerId]);

    const reloadTransactions = useCallback(async () => {
        if (isAdmin && selectedSellerId) {
            await loadSellerDirectory();
            await loadScopedSellerData(selectedSellerId);
            return;
        }

        if (isSeller) {
            await loadScopedSellerData('');
        }
    }, [isAdmin, isSeller, selectedSellerId, loadScopedSellerData, loadSellerDirectory]);

    const payoutEligibleOrders = useMemo(() => {
        return payoutSourceRows
            .filter((item) => item.payoutEligible && !item.payoutMarked)
            .map((item) => ({
                id: item.id,
                orderId: item.orderId,
                customerName: item.customerName,
                netAmount: Number(item.netAfterRefund || 0),
            }));
    }, [payoutSourceRows]);

    const payoutPreview = useMemo(() => {
        const periodDays = Number(payoutForm.periodDays || 7);
        const effectivePeriodDays = PAYOUT_PERIOD_OPTIONS.includes(periodDays) ? periodDays : 7;

        const start = new Date();
        start.setDate(start.getDate() - effectivePeriodDays);

        const orders = payoutSourceRows.filter((item) => {
            if (!item.payoutEligible || item.payoutMarked) return false;
            const createdAt = new Date(item.createdAt);
            if (Number.isNaN(createdAt.getTime())) return false;
            return createdAt >= start;
        });

        const amount = orders.reduce((sum, item) => sum + Number(item.netAfterRefund || 0), 0);

        return {
            periodDays: effectivePeriodDays,
            orders,
            orderIds: orders.map((item) => item.id),
            amount: Number(amount.toFixed(2)),
        };
    }, [payoutSourceRows, payoutForm.periodDays]);

    const submitSellerPayout = useCallback(async () => {
        if (!isAdmin) {
            toast.error('Only admin can mark payout as paid');
            return;
        }

        if (!selectedSellerId) {
            toast.error('Select a seller first');
            return;
        }

        if (!payoutPreview.orderIds.length || payoutPreview.amount <= 0) {
            toast.error(`No eligible unpaid orders found in last ${payoutPreview.periodDays} days`);
            return;
        }

        try {
            setIsPayoutUpdating(true);
            await updateSellerPaidAmount(selectedSellerId, {
                action: 'add',
                amount: payoutPreview.amount,
                note: payoutForm.note?.trim() || '',
                payoutWindowDays: payoutPreview.periodDays,
                orderIds: payoutPreview.orderIds,
            });

            toast.success('Seller payout marked as paid');
            setPayoutForm((prev) => ({ ...prev, note: '', orderId: '' }));
            await reloadTransactions();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update payout');
        } finally {
            setIsPayoutUpdating(false);
        }
    }, [isAdmin, payoutForm.note, payoutPreview.amount, payoutPreview.orderIds, payoutPreview.periodDays, reloadTransactions, selectedSellerId]);

    const value = {
        transactions,
        summary,
        periods,
        sellerWiseSummaries,
        sellerOptions,
        selectedSellerId,
        setSelectedSellerId,
        payoutHistory,
        payoutEligibleOrders,
        payoutPreview,
        payoutPeriodOptions: PAYOUT_PERIOD_OPTIONS,
        payoutForm,
        setPayoutForm,
        isPayoutUpdating,
        submitSellerPayout,
        isAdmin,
        isSeller,
        tabs,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        activeTab,
        setActiveTab,
        isLoading,
        filterData,
        setFilterData,
        paginatedTransactions: transactions,
        totalPages,
        totalResults,
        paymentMethods,
        reloadTransactions,
    };

    return (
        <TransactionContext.Provider value={value}>
            {children}
        </TransactionContext.Provider>
    );
};
