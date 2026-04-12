import React from 'react';
import { useTransaction } from '../../../Context/transaction/useTransaction';

const TransactionTable = () => {
    const { paginatedTransactions, isLoading } = useTransaction();

    const getStatusColor = (status) => {
        const statusMap = {
            'User Paid': { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
            'Payment Pending': { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
            'Refunded': { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
            'Cancelled': { bg: 'bg-gray-100 dark:bg-gray-800/50', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500' },
        };
        return statusMap[status] || { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500' };
    };

    const getPaymentMethodIcon = (method) => {
        const icons = {
            Razorpay: '⚡',
            COD: '💵',
        };
        return icons[method] || '💵';
    };

    if (isLoading) {
        return (
            <div className="w-full overflow-hidden">
                <div className="py-10 text-center text-gray-500 dark:text-gray-400">Loading transactions...</div>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-transparent">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                            <th className="w-30 px-6 py-4 text-left text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                                Order ID
                            </th>
                            <th className="min-w-40 px-6 py-4 text-left text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                                Customer
                            </th>
                            <th className="min-w-30 px-6 py-4 text-left text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                                Date
                            </th>
                            <th className="min-w-35 px-6 py-4 text-left text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                                Payment
                            </th>
                            <th className="w-30 px-6 py-4 text-left text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                                Status
                            </th>
                            <th className="w-30 px-6 py-4 text-left text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                                Payout
                            </th>
                            <th className="w-28 px-6 py-4 text-left text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                                Gross
                            </th>
                            <th className="w-28 px-6 py-4 text-left text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                                Commission
                            </th>
                            <th className="w-28 px-6 py-4 text-left text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                                Seller Net
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTransactions.length > 0 ? (
                            paginatedTransactions.map((transaction, index) => {
                                const statusColors = getStatusColor(transaction.status);
                                return (
                                    <tr
                                        key={index}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-[13px] font-medium text-gray-900 dark:text-gray-100">
                                            {transaction.orderId || '-'}
                                        </td>
                                        <td className="min-w-40 px-6 py-4 text-[13px] text-gray-900 dark:text-gray-100">
                                            <div>
                                                <p className="font-medium">{transaction.customerName}</p>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{transaction.customerEmail || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="min-w-30 px-6 py-4 text-[13px] text-gray-600 dark:text-gray-400">
                                            {transaction.date}
                                        </td>
                                        <td className="min-w-35 px-6 py-4 text-[13px] text-gray-900 dark:text-gray-100">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{getPaymentMethodIcon(transaction.method)}</span>
                                                <div>
                                                    <p className="font-medium">{transaction.method}</p>
                                                    <p className="text-[12px] text-gray-500 dark:text-gray-400">
                                                        {transaction.paymentStatus.toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="w-30 px-6 py-4 text-center text-[13px]">
                                            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium ${statusColors.bg} ${statusColors.text}`}>
                                                <span className={`w-2 h-2 rounded-full ${statusColors.dot}`}></span>
                                                {transaction.isRefunded
                                                    ? (transaction.refundStatus && transaction.refundStatus !== 'none'
                                                        ? (transaction.refundStatus.toLowerCase() === 'processed'
                                                            ? 'Returned'
                                                            : transaction.refundStatus.charAt(0).toUpperCase() + transaction.refundStatus.slice(1))
                                                        : 'Refunded')
                                                    : (transaction.rawOrderStatus
                                                        ? transaction.rawOrderStatus.charAt(0).toUpperCase() + transaction.rawOrderStatus.slice(1)
                                                        : transaction.status)}
                                            </span>
                                            {transaction.refundStatus && transaction.refundStatus !== 'none' && (
                                                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Refund: {transaction.refundStatus.charAt(0).toUpperCase() + transaction.refundStatus.slice(1)}</p>
                                            )}
                                        </td>
                                        <td className="w-30 px-6 py-4 text-[13px]">
                                            {!transaction.payoutEligible ? (
                                                <>
                                                    {/* <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-[12px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                        Not Eligible
                                                    </span> */}
                                                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                                        {transaction.payoutBlockedReason || 'Not eligible for payout'}
                                                    </p>
                                                </>
                                            ) : transaction.payoutMarked ? (
                                                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-[12px] font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                                    Paid
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-[12px] font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                                                    Pending Payout
                                                </span>
                                            )}
                                        </td>
                                        <td className="w-28 px-6 py-4 text-[13px] font-medium text-gray-800 dark:text-gray-200">
                                            Rs {Number(transaction.grossSales || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="w-28 px-6 py-4 text-[13px] font-medium text-red-600">
                                            {Number(transaction.returnChargeAmount || 0) > 0
                                                ? 'Rs 0'
                                                : `Rs ${Number(transaction.commissionAmount || 0).toLocaleString('en-IN')}`}
                                        </td>
                                        <td className="w-28 px-6 py-4 text-[13px] font-semibold text-[#4EA674]">
                                            {Number(transaction.returnChargeAmount || 0) > 0 ? (
                                                <span
                                                    className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                                    title={`Return charge deducted: Rs ${Number(transaction.returnChargeAmount).toLocaleString('en-IN')}`}
                                                >
                                                    -Rs {Number(transaction.returnChargeAmount).toLocaleString('en-IN')}
                                                </span>
                                            ) : (
                                                <>Rs {Number(transaction.netAfterRefund || 0).toLocaleString('en-IN')}</>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="9" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No transactions found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionTable;
