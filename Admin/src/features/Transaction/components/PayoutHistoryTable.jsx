import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransaction } from '../../../Context/transaction/useTransaction';

const PayoutHistoryTable = () => {
    const navigate = useNavigate();
    const { payoutHistory, isLoading } = useTransaction();

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
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Action</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Delta</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Order</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">By</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">View</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="7" className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Loading payout history...
                                </td>
                            </tr>
                        ) : payoutHistory.length ? (
                            payoutHistory.map((item) => (
                                <tr key={item._id} className="border-t border-gray-100 dark:border-gray-800">
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{new Date(item.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td className="px-4 py-3 text-xs font-medium text-gray-800 dark:text-gray-200 uppercase">{item.action}</td>
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">Rs {Number(item.amount || 0).toLocaleString('en-IN')}</td>
                                    <td className={`px-4 py-3 text-xs font-medium ${Number(item.deltaAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {Number(item.deltaAmount || 0) >= 0 ? '+' : ''}
                                        {Number(item.deltaAmount || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{item.orderId ? `#${String(item.orderId).slice(-8).toUpperCase()}` : '-'}</td>
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{item?.processedBy?.adminName || '-'}</td>
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                                        {item.orderId ? (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenOrder(item.orderId)}
                                                className="inline-flex items-center rounded-md border border-[#4EA674] px-2.5 py-1 font-medium text-[#2f7f52] transition-colors hover:bg-[#4EA674]/10 dark:text-[#79d4a2]"
                                            >
                                                Open
                                            </button>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No payout history found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PayoutHistoryTable;
