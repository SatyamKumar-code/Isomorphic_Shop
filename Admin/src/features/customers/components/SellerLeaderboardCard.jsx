import React from "react";
import { useCustomers } from "../../../Context/customers/useCustomers";

const formatAmount = (value) => Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SellerLeaderboardCard = () => {
    const { topSellers, isLoading, errorMessage } = useCustomers();

    return (
        <div className="rounded-lg bg-white p-4 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:bg-gray-950 dark:shadow-gray-700 dark:inset-shadow-gray-700">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50">Top 10 Sellers</h3>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">By Sales</span>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={`leaderboard-skeleton-${index}`} className="h-9 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    ))}
                </div>
            ) : null}

            {!isLoading && errorMessage ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    Data unavailable
                </div>
            ) : null}

            {!isLoading && !errorMessage && !topSellers.length ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    No sellers found
                </div>
            ) : null}

            {!isLoading && !errorMessage && topSellers.length ? (
                <div className="space-y-2">
                    {topSellers.map((seller) => (
                        <div
                            key={seller.uid}
                            className="grid grid-cols-[28px_1fr_auto] items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900"
                        >
                            <div className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">#{seller.rank}</div>
                            <div className="min-w-0">
                                <p className="truncate text-[12px] font-semibold text-slate-800 dark:text-slate-100">{seller.name || "Unknown Seller"}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">Orders: {seller.orderCount || 0} | Products: {seller.productsCount || 0}</p>
                            </div>
                            <div className="text-right text-[12px] font-semibold text-slate-800 dark:text-slate-100">{formatAmount(seller.totalSales)}</div>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
};

export default SellerLeaderboardCard;
