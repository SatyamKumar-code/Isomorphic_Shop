import React from 'react';
import { getSellerPeriodAnalytics } from '../TransactionAPI';

const PeriodAnalyticsSection = ({ selectedSellerId, isAdmin }) => {
    const [year, setYear] = React.useState(new Date().getFullYear());
    const [month, setMonth] = React.useState(0);
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');
    const [analytics, setAnalytics] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [tablePage, setTablePage] = React.useState(1);
    const [tablePageSize, setTablePageSize] = React.useState(10);

    const isPayoutEligible = (row) => {
        // Eligible if: not cancelled AND payment completed AND not refunded
        return row.rawOrderStatus !== 'cancelled' && row.userPaymentDone && !row.isRefunded;
    };

    const getStatusBadge = (row) => {
        if (row.rawOrderStatus === 'cancelled') {
            return (
                <div className="flex flex-col gap-1">
                    <span className="inline-block rounded px-2 py-1 font-medium w-fit bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Cancelled
                    </span>
                    <span className="inline-block rounded px-1.5 py-0.5 font-medium w-fit text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                        ❌ No Payout
                    </span>
                </div>
            );
        }

        const eligible = isPayoutEligible(row);
        return (
            <div className="flex flex-col gap-1">
                <span className={`inline-block rounded px-2 py-1 font-medium w-fit ${row.userPaymentDone
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                    {row.userPaymentDone ? 'Paid' : 'Pending'}
                </span>
                <span className={`inline-block rounded px-1.5 py-0.5 font-medium w-fit text-xs ${eligible
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                    }`}>
                    {eligible ? '✅ Payout Eligible' : `❌ Not Eligible${row.isRefunded ? ' (Refunded)' : ''}`}
                </span>
            </div>
        );
    };

    const minSelectableDate = analytics?.availableDateRange?.minDate || '';
    const maxSelectableDate = analytics?.availableDateRange?.maxDate || '';
    const isDateFilterActive = Boolean(startDate || endDate);

    const availableYears = React.useMemo(() => {
        if (minSelectableDate && maxSelectableDate) {
            const minYear = new Date(minSelectableDate).getFullYear();
            const maxYear = new Date(maxSelectableDate).getFullYear();
            const years = [];

            for (let y = maxYear; y >= minYear; y -= 1) {
                years.push(y);
            }

            return years;
        }

        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => currentYear - i);
    }, [minSelectableDate, maxSelectableDate]);

    const defaultYear = React.useMemo(() => {
        const currentYear = new Date().getFullYear();
        if (availableYears.includes(currentYear)) {
            return currentYear;
        }
        return availableYears[0] || currentYear;
    }, [availableYears]);

    const clampDateToBounds = React.useCallback((value) => {
        if (!value) return '';
        if (minSelectableDate && value < minSelectableDate) return minSelectableDate;
        if (maxSelectableDate && value > maxSelectableDate) return maxSelectableDate;
        return value;
    }, [minSelectableDate, maxSelectableDate]);

    const months = React.useMemo(() => [
        { value: 0, label: 'All Months' },
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ], []);

    const availableMonths = React.useMemo(() => {
        if (!(minSelectableDate && maxSelectableDate)) {
            return months;
        }

        const minDateObj = new Date(minSelectableDate);
        const maxDateObj = new Date(maxSelectableDate);
        const minYear = minDateObj.getFullYear();
        const maxYear = maxDateObj.getFullYear();

        if (year < minYear || year > maxYear) {
            return [{ value: 0, label: 'All Months' }];
        }

        const minMonth = year === minYear ? minDateObj.getMonth() + 1 : 1;
        const maxMonth = year === maxYear ? maxDateObj.getMonth() + 1 : 12;

        return months.filter((m) => m.value === 0 || (m.value >= minMonth && m.value <= maxMonth));
    }, [months, year, minSelectableDate, maxSelectableDate]);

    const fetchAnalytics = React.useCallback(async () => {
        // For admin view, only fetch if a seller is selected
        if (isAdmin && !selectedSellerId) {
            setAnalytics(null);
            return;
        }

        setIsLoading(true);
        try {
            const params = {
                year,
                month: month || 0,
                page: tablePage,
                limit: tablePageSize,
            };

            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            // For admin, pass the specific seller ID
            if (isAdmin && selectedSellerId) {
                params.sellerId = selectedSellerId;
            }
            // For seller, no need to pass sellerId, backend uses auth context

            const response = await getSellerPeriodAnalytics(params);
            if (response?.data?.success) {
                setAnalytics(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch period analytics', error);
        } finally {
            setIsLoading(false);
        }
    }, [year, month, startDate, endDate, selectedSellerId, isAdmin, tablePage, tablePageSize]);

    React.useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    React.useEffect(() => {
        setTablePage(1);
    }, [tablePageSize, year, month, startDate, endDate, selectedSellerId]);

    React.useEffect(() => {
        if (!analytics) return;

        setStartDate((prev) => clampDateToBounds(prev));
        setEndDate((prev) => clampDateToBounds(prev));
    }, [analytics, clampDateToBounds]);

    React.useEffect(() => {
        const totalPages = Number(analytics?.pagination?.totalPages || 1);
        if (tablePage > totalPages) {
            setTablePage(totalPages);
        }
    }, [analytics, tablePage]);

    React.useEffect(() => {
        if (!availableYears.length) return;
        if (!availableYears.includes(year)) {
            setYear(availableYears[0]);
        }
    }, [availableYears, year]);

    React.useEffect(() => {
        if (month === 0) return;
        const isCurrentMonthAllowed = availableMonths.some((m) => m.value === month);
        if (!isCurrentMonthAllowed) {
            setMonth(0);
        }
    }, [availableMonths, month]);

    React.useEffect(() => {
        if (!isDateFilterActive) return;

        if (month !== 0) {
            setMonth(0);
        }

        if (year !== defaultYear) {
            setYear(defaultYear);
        }
    }, [isDateFilterActive, month, year, defaultYear]);

    const handleReset = () => {
        setYear(defaultYear);
        setMonth(0);
        setStartDate('');
        setEndDate('');
    };

    const tableRows = analytics?.rows || [];
    const tablePagination = analytics?.pagination || {};
    const tableTotal = Number(tablePagination?.total || 0);
    const tableTotalPages = Math.max(1, Number(tablePagination?.totalPages || 1));
    const safeTablePage = Math.min(tablePage, tableTotalPages);
    const tableStartIndex = (safeTablePage - 1) * tablePageSize;

    return (
        <div className="mt-6 rounded-lg border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white">Period-wise Analytics</h3>
            </div>

            {/* Filters */}
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    {/* Year Filter */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            disabled={isDateFilterActive}
                            className={`w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 ${isDateFilterActive
                                ? 'cursor-not-allowed opacity-60'
                                : ''
                                }`}
                        >
                            {availableYears.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Month Filter */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Month</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            disabled={isDateFilterActive}
                            className={`w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 ${isDateFilterActive
                                ? 'cursor-not-allowed opacity-60'
                                : ''
                                }`}
                        >
                            {availableMonths.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">From Date</label>
                        <input
                            type="date"
                            value={startDate}
                            min={minSelectableDate || undefined}
                            max={maxSelectableDate || undefined}
                            onChange={(e) => {
                                const nextStart = clampDateToBounds(e.target.value);
                                setStartDate(nextStart);

                                if (endDate && nextStart && endDate < nextStart) {
                                    setEndDate(nextStart);
                                }
                            }}
                            className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">To Date</label>
                        <input
                            type="date"
                            value={endDate}
                            min={minSelectableDate || undefined}
                            max={maxSelectableDate || undefined}
                            onChange={(e) => {
                                let nextEnd = clampDateToBounds(e.target.value);

                                if (startDate && nextEnd && nextEnd < startDate) {
                                    nextEnd = startDate;
                                }

                                setEndDate(nextEnd);
                            }}
                            className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        />
                    </div>

                    {/* Reset Button */}
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Reset
                        </button>
                    </div>
                </div>
                {minSelectableDate && maxSelectableDate && (
                    <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">
                        Available order dates: {minSelectableDate} to {maxSelectableDate}
                    </p>
                )}
                {isDateFilterActive && (
                    <p className="mt-1 text-[11px] text-blue-600 dark:text-blue-400">
                        Date filter is active. Year/Month filters are temporarily disabled.
                    </p>
                )}
            </div>

            {/* Analytics Cards */}
            {isLoading ? (
                <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading analytics...
                </div>
            ) : analytics ? (
                <>
                    <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                {analytics.analytics?.totalOrders || 0}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-500">(All orders)</p>
                        </div>

                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Gross Sales</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                Rs {Number(analytics.analytics?.totalGross || 0).toLocaleString('en-IN')}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-500">(Active only)</p>
                        </div>

                        <div className="rounded-lg border border-green-100 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
                            <p className="text-xs font-medium text-green-700 dark:text-green-400">Net Sales</p>
                            <p className="mt-1 text-lg font-semibold text-green-700 dark:text-green-400">
                                Rs {Number(analytics.analytics?.totalSales || 0).toLocaleString('en-IN')}
                            </p>
                            <p className="mt-1 text-[10px] text-green-600 dark:text-green-500">(After refund)</p>
                        </div>

                        <div className="rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
                            <p className="text-xs font-medium text-red-700 dark:text-red-400">Total Refund</p>
                            <p className="mt-1 text-lg font-semibold text-red-700 dark:text-red-400">
                                Rs {Number(analytics.analytics?.totalRefund || 0).toLocaleString('en-IN')}
                            </p>
                        </div>

                        <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-900/20">
                            <p className="text-xs font-medium text-orange-700 dark:text-orange-400">Cancelled Orders</p>
                            <p className="mt-1 text-lg font-semibold text-orange-700 dark:text-orange-400">
                                {analytics.analytics?.cancelledCount || 0} (Rs {Number(analytics.analytics?.totalCancelled || 0).toLocaleString('en-IN')})
                            </p>
                            <p className="mt-1 text-[10px] text-orange-600 dark:text-orange-500">(No earnings)</p>
                        </div>
                    </div>

                    {/* Info Note */}
                    <div className="border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            💡 Table shows ALL orders. "Payout Eligible" = Non-cancelled + Payment Completed + Not Refunded. Seller gets commission only from eligible orders.
                        </p>
                    </div>

                    {/* Breakdown Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-180 border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900/50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Order ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Gross</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Payment & Payout Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Payout Done?</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Net (After Refund)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.length > 0 ? (
                                    tableRows.map((row, idx) => (
                                        <tr key={idx} className="border-t border-gray-100 dark:border-gray-800">
                                            <td className="px-4 py-3 text-xs font-medium text-gray-700 dark:text-gray-300">
                                                {row.orderId || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                                                {row.date || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                                                Rs {Number(row.grossSales || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                {getStatusBadge(row)}
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                {!isPayoutEligible(row) ? (
                                                    <span className="inline-block rounded px-2 py-1 font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                        N/A
                                                    </span>
                                                ) : row.payoutMarked ? (
                                                    <span className="inline-block rounded px-2 py-1 font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="inline-block rounded px-2 py-1 font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                                                        No
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-semibold text-green-600 dark:text-green-400">
                                                Rs {Number(row.netAfterRefund || 0).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                            No data found for selected period
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                        <div className="flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-3">
                                <p className="text-gray-600 dark:text-gray-400">
                                    Showing {tableTotal === 0 ? 0 : tableStartIndex + 1} to {Math.min(tableStartIndex + tablePageSize, tableTotal)} of {tableTotal} orders
                                </p>
                                <div className="flex items-center gap-2">
                                    <label className="text-gray-600 dark:text-gray-400">Rows per page:</label>
                                    <select
                                        value={tablePageSize}
                                        onChange={(e) => setTablePageSize(Number(e.target.value))}
                                        className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                    >
                                        {[5, 10, 20, 50].map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTablePage((prev) => Math.max(1, prev - 1))}
                                    disabled={safeTablePage <= 1}
                                    className="rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                    Previous
                                </button>

                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Page {safeTablePage} of {tableTotalPages}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setTablePage((prev) => Math.min(tableTotalPages, prev + 1))}
                                    disabled={safeTablePage >= tableTotalPages}
                                    className="rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {isAdmin ? 'Select a seller from the header to view period-wise analytics' : 'No analytics data available'}
                </div>
            )}
        </div>
    );
};

export default PeriodAnalyticsSection;
