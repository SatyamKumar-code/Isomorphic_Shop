import React from 'react';
import { useTransaction } from '../../../Context/transaction/useTransaction';

const TransactionStats = () => {
    const { summary, periods } = useTransaction();

    const statCards = [
        {
            id: 1,
            title: 'Total Seller Sales',
            value: `Rs ${Number(summary.grossSales || 0).toLocaleString('en-IN')}`,
            percentage: `${summary.totalOrders || 0} orders`,
            bgColor: 'bg-green-50 dark:bg-green-900/10',
            textColor: 'text-green-600',
            subText: 'Gross before commission',
        },
        {
            id: 2,
            title: 'User Payment Done',
            value: `Rs ${Number(summary.userPaidRevenue || 0).toLocaleString('en-IN')}`,
            percentage: `${summary.userPaidOrders || 0} paid orders`,
            bgColor: 'bg-blue-50 dark:bg-blue-900/10',
            textColor: 'text-blue-600',
            subText: 'User side payment received',
        },
        {
            id: 3,
            title: 'Payout Completed',
            value: `Rs ${Number(summary.paidAmount || 0).toLocaleString('en-IN')}`,
            percentage: 'Paid to seller',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
            textColor: 'text-yellow-600',
            subText: `Commission: ${Number(summary.commissionRate || 0)}%`,
        },
        {
            id: 4,
            title: 'Payout Pending',
            value: `Rs ${Number(summary.payoutDue || 0).toLocaleString('en-IN')}`,
            percentage: `${summary.refundOrders || 0} refunded orders`,
            bgColor: 'bg-red-50 dark:bg-red-900/10',
            textColor: 'text-red-600',
            subText: 'After commission/refunds',
        },
    ];

    const periodCards = [
        { id: '7', title: 'Last 7 Days', data: periods.last7Days },
        { id: 'm', title: 'Month to Date', data: periods.monthToDate },
        { id: 'y', title: 'Year to Date', data: periods.yearToDate },
    ];

    return (
        <div className="mb-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-4">
                {statCards.map((card) => (
                    <div
                        key={card.id}
                        className={`flex h-full flex-col justify-between rounded-lg border border-gray-100 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 ${card.bgColor}`}
                    >
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <p className="text-[14px] font-medium text-gray-600 dark:text-gray-400">
                                    {card.title}
                                </p>
                                <h3 className="mt-2 text-[24px] font-bold text-[#23272E] dark:text-white">
                                    {card.value}
                                </h3>
                            </div>
                        </div>
                        <div className="flex items-end justify-between">
                            <p className="text-[12px] text-gray-500 dark:text-gray-400">{card.subText}</p>
                            <span className={`text-[12px] font-semibold ${card.textColor}`}>
                                {card.percentage}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {periodCards.map((period) => (
                    <div key={period.id} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                        <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white">{period.title}</h4>
                        <div className="mt-3 space-y-1 text-[12px] text-gray-600 dark:text-gray-300">
                            <p>Orders: <span className="font-semibold">{period.data?.orders || 0}</span></p>
                            <p>Gross: <span className="font-semibold">Rs {Number(period.data?.grossSales || 0).toLocaleString('en-IN')}</span></p>
                            <p>Net: <span className="font-semibold">Rs {Number(period.data?.netRevenue || 0).toLocaleString('en-IN')}</span></p>
                            <p>User Paid: <span className="font-semibold">Rs {Number(period.data?.paidRevenue || 0).toLocaleString('en-IN')}</span></p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransactionStats;
