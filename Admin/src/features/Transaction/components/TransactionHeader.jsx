import React from 'react';
import { useTransaction } from '../../../Context/transaction/useTransaction';

const TransactionHeader = () => {
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const {
        filterData,
        setFilterData,
        isAdmin,
        sellerOptions,
        selectedSellerId,
        setSelectedSellerId,
        reloadTransactions,
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

    const previewOrders = payoutPreview.orders.slice(0, 5);
    const remainingOrderCount = Math.max(0, payoutPreview.orders.length - previewOrders.length);

    return (
        <div className="mb-6 w-full">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <h1 className="text-2xl font-bold text-[#23272E] dark:text-white">Transaction & Payout</h1>

                <div className="flex w-full flex-1 flex-col gap-3 xl:ml-auto xl:flex-row xl:justify-end">
                    {isAdmin ? (
                        <select
                            value={selectedSellerId}
                            onChange={(event) => setSelectedSellerId(event.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-[14px] outline-none transition focus:border-[#4EA674] focus:ring-2 focus:ring-[#4EA674]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white xl:max-w-65"
                        >
                            {sellerOptions.map((seller) => (
                                <option key={seller.id} value={seller.id}>{seller.name}</option>
                            ))}
                        </select>
                    ) : null}

                    <div className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm transition focus-within:border-[#4EA674] focus-within:ring-2 focus-within:ring-[#4EA674]/10 dark:border-gray-700 dark:bg-gray-950 xl:max-w-90">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.88885 2C12.8219 2 16.1111 5.28916 16.1111 9.22222C16.1111 10.893 15.585 12.4348 14.7126 13.7084L18.9832 17.979C19.3611 18.3569 19.3611 18.9625 18.9832 19.3403C18.6053 19.7182 17.9996 19.7182 17.6218 19.3403L13.3512 15.0698C12.0775 15.9422 10.5358 16.4683 8.88885 16.4683C4.95579 16.4683 1.66663 13.1791 1.66663 9.24606C1.66663 5.31301 4.95579 2 8.88885 2ZM8.88885 3.66667C5.8746 3.66667 3.33329 6.20797 3.33329 9.22222C3.33329 12.2365 5.8746 14.7778 8.88885 14.7778C11.901 14.7778 14.4423 12.2365 14.4423 9.22222C14.4423 6.20797 11.901 3.66667 8.88885 3.66667Z" fill="#6A717F" />
                        </svg>
                        <input
                            type="text"
                            value={filterData.searchTerm}
                            onChange={(event) => setFilterData({ ...filterData, searchTerm: event.target.value })}
                            placeholder="Search by order, customer, payment"
                            className="w-full bg-transparent text-[14px] outline-none dark:text-white"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={reloadTransactions}
                        disabled={isLoading}
                        className="rounded-lg bg-[#4EA674] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#3f8b62] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {isAdmin ? (
                <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950 xl:grid-cols-[1fr,1.4fr,1.8fr,auto]">
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
                            Amount is auto-calculated and cannot be edited.
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

                            {previewOrders.length > 0 ? (
                                <div className="pt-1">
                                    <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Selected Orders (Top 5)</p>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                        {previewOrders.map((item) => (
                                            <span
                                                key={item.id}
                                                className="inline-flex rounded bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                            >
                                                {item.orderId || item.id}
                                            </span>
                                        ))}
                                        {remainingOrderCount > 0 ? (
                                            <span className="inline-flex rounded bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                +{remainingOrderCount} more
                                            </span>
                                        ) : null}
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

export default TransactionHeader;
