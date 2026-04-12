import React from 'react';
import { useTransaction } from '../../../Context/transaction/useTransaction';
import TransactionHeaderMenu from './TransactionHeaderMenu';

const TransactionHeader = () => {
    const {
        filterData,
        setFilterData,
        isAdmin,
        sellerOptions,
        selectedSellerId,
        setSelectedSellerId,
        reloadTransactions,
        isLoading,
    } = useTransaction();

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
                    {isAdmin && <TransactionHeaderMenu />}
                </div>
            </div>

        </div>
    );
};

export default TransactionHeader;
