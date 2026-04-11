import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransaction } from '../../../Context/transaction/useTransaction';

const PayoutHistoryTable = () => {
    const navigate = useNavigate();
    const { payoutHistory, isLoading } = useTransaction();
    const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

    const formatCurrency = (amount, currency = 'INR') => {
        const numericAmount = Number(amount || 0);
        const symbol = currency === 'INR' ? 'Rs' : currency;
        return `${symbol} ${numericAmount.toLocaleString('en-IN')}`;
    };

    const getCoveredOrdersCount = (item) => {
        if (Array.isArray(item?.orderIds) && item.orderIds.length > 0) return item.orderIds.length;
        if (item?.orderId) return 1;
        return 0;
    };

    const selectedOrders = useMemo(() => {
        if (!selectedHistoryItem) return [];

        const orderList = [];
        if (Array.isArray(selectedHistoryItem.orderIds)) {
            for (const id of selectedHistoryItem.orderIds) {
                if (id) orderList.push(String(id));
            }
        }

        if (selectedHistoryItem.orderId) {
            orderList.push(String(selectedHistoryItem.orderId));
        }

        return [...new Set(orderList)];
    }, [selectedHistoryItem]);

    const canViewOrders = (item) => getCoveredOrdersCount(item) > 0;

    const handleOpenOrderList = (item) => {
        setSelectedHistoryItem(item);
    };

    const handleCloseOrderList = () => {
        setSelectedHistoryItem(null);
    };

    const handleOpenOrder = (orderId) => {
        if (!orderId) return;
        const safeOrderId = encodeURIComponent(String(orderId));
        navigate(`/order-management?search=${safeOrderId}&focusOrder=${safeOrderId}`);
    };

    return (
        <div className="mt-6 rounded-lg border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white">Seller Payout History</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-180 border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900/50">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Entry</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Delta</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Prev - New</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Covered Orders</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Window</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">By</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Note</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">View</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="10" className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Loading payout history...
                                </td>
                            </tr>
                        ) : payoutHistory.length ? (
                            payoutHistory.map((item) => (
                                <tr key={item._id} className="border-t border-gray-100 dark:border-gray-800">
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{new Date(item.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 uppercase">{item.entryType || '-'}</td>
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{formatCurrency(item.amount, item.currency)}</td>
                                    <td className={`px-4 py-3 text-xs font-medium ${Number(item.deltaAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {Number(item.deltaAmount || 0) >= 0 ? '+' : ''}
                                        {Number(item.deltaAmount || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                                        {formatCurrency(item.previousPaidAmount, item.currency)} - {formatCurrency(item.newPaidAmount, item.currency)}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{getCoveredOrdersCount(item)}</td>
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{item.payoutWindowDays ? `${item.payoutWindowDays}d` : '-'}</td>
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{item?.processedBy?.adminName || '-'}</td>
                                    <td className="max-w-52 truncate px-4 py-3 text-xs text-gray-700 dark:text-gray-300" title={item.note || ''}>
                                        {item.note || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                                        {canViewOrders(item) ? (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenOrderList(item)}
                                                className="inline-flex items-center rounded-md border border-[#4EA674] px-2.5 py-1 font-medium text-[#2f7f52] transition-colors hover:bg-[#4EA674]/10 dark:text-[#79d4a2]"
                                            >
                                                View
                                            </button>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="10" className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No payout history found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedHistoryItem ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-gray-900">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Payout Covered Orders</h4>
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    {selectedOrders.length} order(s) in this payout entry
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseOrderList}
                                className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Close
                            </button>
                        </div>

                        <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700">
                            {selectedOrders.length ? (
                                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {selectedOrders.map((orderId) => (
                                        <li key={orderId} className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                                            <span>
                                                #{orderId.slice(-8).toUpperCase()} <span className="ml-2 text-gray-500">({orderId})</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenOrder(orderId)}
                                                className="inline-flex items-center rounded-md border border-[#4EA674] px-2 py-1 text-[11px] font-medium text-[#2f7f52] transition-colors hover:bg-[#4EA674]/10 dark:text-[#79d4a2]"
                                            >
                                                Open
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="px-3 py-4 text-xs text-gray-500 dark:text-gray-400">No orders linked to this payout entry.</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default PayoutHistoryTable;
