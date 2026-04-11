import React from 'react';
import { useTransaction } from '../../../Context/transaction/useTransaction';

const AdminRevenueOverviewCards = () => {
    const { isAdmin, adminTotals } = useTransaction();

    if (!isAdmin) {
        return null;
    }

    const cards = [
        {
            id: 'a1',
            title: 'Admin Commission Revenue',
            value: `Rs ${Number(adminTotals.commissionAmount || 0).toLocaleString('en-IN')}`,
            subText: 'Total commission cut from all sellers',
            textColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
        },
        {
            id: 'a2',
            title: 'Total Seller Payout Liability',
            value: `Rs ${Number(adminTotals.netRevenue || 0).toLocaleString('en-IN')}`,
            subText: 'Payable to sellers after commission',
            textColor: 'text-sky-600',
            bgColor: 'bg-sky-50 dark:bg-sky-900/10',
        },
        {
            id: 'a3',
            title: 'Total Payout Completed',
            value: `Rs ${Number(adminTotals.paidAmount || 0).toLocaleString('en-IN')}`,
            subText: 'Amount already paid to sellers',
            textColor: 'text-amber-600',
            bgColor: 'bg-amber-50 dark:bg-amber-900/10',
        },
        {
            id: 'a4',
            title: 'Total Payout Remaining',
            value: `Rs ${Number(adminTotals.payoutDue || 0).toLocaleString('en-IN')}`,
            subText: 'Pending payout amount',
            textColor: 'text-rose-600',
            bgColor: 'bg-rose-50 dark:bg-rose-900/10',
        },
    ];

    return (
        <div className="space-y-3">
            <h3 className="text-[14px] font-semibold text-gray-700 dark:text-gray-300">All Seller Financial Overview</h3>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-4">
                {cards.map((card) => (
                    <div
                        key={card.id}
                        className={`flex h-full flex-col justify-between rounded-lg border border-gray-100 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 ${card.bgColor}`}
                    >
                        <div>
                            <p className="text-[14px] font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                            <h3 className="mt-2 text-[24px] font-bold text-[#23272E] dark:text-white">{card.value}</h3>
                        </div>
                        <p className={`mt-3 text-[12px] font-semibold ${card.textColor}`}>{card.subText}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminRevenueOverviewCards;
