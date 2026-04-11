import React from 'react';
import { useTransaction } from '../../../Context/transaction/useTransaction';

const TransactionStats = () => {
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const {
        summary,
        periods,
        isAdmin,
        isLoading,
        payoutForm,
        setPayoutForm,
        payoutPreview,
        payoutPeriodOptions,
        isPayoutUpdating,
        submitSellerPayout,
    } = useTransaction();


    const canMarkPaid = !isPayoutUpdating && !isLoading && payoutPreview.orderIds.length > 0 && payoutPreview.amount > 0;

    const handleOpenConfirm = () => {
        if (!canMarkPaid) return;
        setIsConfirmOpen(true);
    };

    const handleConfirmPayout = async () => {
        await submitSellerPayout();
        setIsConfirmOpen(false);
    };

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
            subText: `Return charges: Rs ${Number(summary.returnChargeTotal || 0).toLocaleString('en-IN')}`,
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

            {isAdmin ? (
                <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr,1.4fr,1.8fr,auto]">
                        <select
                            value={payoutForm.periodDays}
                            onChange={(event) => setPayoutForm({ ...payoutForm, periodDays: Number(event.target.value) })}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-[#4EA674] focus:ring-2 focus:ring-[#4EA674]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        >
                            {payoutPeriodOptions.map((days) => (
                                <option key={days} value={days}>
                                    Last {days} days
                                </option>
                            ))}
                        </select>

                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] dark:border-gray-700 dark:bg-gray-900/40">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                Auto Payout Amount: Rs {Number(payoutPreview.amount || 0).toLocaleString('en-IN')}
                            </p>
                            <p className="mt-1 text-[12px] text-gray-600 dark:text-gray-300">
                                Eligible unpaid orders selected: {payoutPreview.orderIds.length}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                Delivered date se 7 din complete hone ke baad hi order payout eligible hota hai.
                            </p>
                        </div>

                        <input
                            type="text"
                            value={payoutForm.note}
                            onChange={(event) => setPayoutForm({ ...payoutForm, note: event.target.value })}
                            placeholder="Note (optional): Seller payout against paid orders"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-[#4EA674] focus:ring-2 focus:ring-[#4EA674]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />

                        <button
                            type="button"
                            onClick={handleOpenConfirm}
                            disabled={!canMarkPaid}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isPayoutUpdating ? 'Updating...' : `Mark Paid (${payoutPreview.periodDays}d)`}
                        </button>
                    </div>
                </div>
            ) : null}

            {isAdmin && isConfirmOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-950">
                        <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white">Confirm Payout</h3>
                        <p className="mt-2 text-[13px] text-gray-600 dark:text-gray-300">
                            Review details before marking payout as paid.
                        </p>

                        <div className="mt-4 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-[13px] dark:border-gray-700 dark:bg-gray-900/40">
                            <p className="text-gray-800 dark:text-gray-200">
                                Period: Last {payoutPreview.periodDays} days
                            </p>
                            <p className="text-gray-800 dark:text-gray-200">
                                Eligible unpaid orders: {payoutPreview.orderIds.length}
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                Final payout amount: Rs {Number(payoutPreview.amount || 0).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                This amount is auto-calculated and locked.
                            </p>

                            {payoutPreview.orders.length > 0 ? (
                                <div className="pt-1">
                                    <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Selected Orders (Oldest to Newest)</p>
                                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                                        {[...payoutPreview.orders]
                                            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                            .map((item, idx) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between gap-2 rounded bg-white px-2 py-1 text-[10px] border border-gray-100 dark:bg-gray-800 dark:border-gray-700"
                                                >
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                                        {idx + 1}. {item.orderId || item.id}
                                                    </span>
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        Rs {Number(item.netAfterRefund || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsConfirmOpen(false)}
                                disabled={isPayoutUpdating}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-[13px] font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmPayout}
                                disabled={isPayoutUpdating}
                                className="rounded-lg bg-blue-600 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isPayoutUpdating ? 'Processing...' : 'Confirm & Mark Paid'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default TransactionStats;
