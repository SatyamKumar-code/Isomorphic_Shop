import React from 'react';

const getInitials = (text) => String(text || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

const getStatusBadgeColor = (status) => {
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        packed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
        out_for_delivery: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
        delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    return statusColors[status] || statusColors.pending;
};

const SearchResultSection = ({ title, items = [], onItemClick, isAdmin = false }) => {
    const isProductSection = title === 'Products';
    const isOrderSection = title === 'Orders';
    const isCustomerSection = title === 'Customers';

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-950">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {items.length}
                </span>
            </div>

            {items.length ? (
                <ul className="space-y-2">
                    {items.map((item) => (
                        <li
                            key={`${title}-${item.id}-${item.name}`}
                            className="rounded-md border border-slate-200 dark:border-slate-700"
                        >
                            <button
                                type="button"
                                onClick={() => onItemClick?.(item)}
                                className="flex w-full flex-col items-start rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70"
                            >
                                {isProductSection ? (
                                    <div className="flex w-full items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-full w-full rounded-md object-contain"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                getInitials(item.name)
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.meta}</p>
                                            <div className={`mt-0.5 flex items-center overflow-hidden text-xs text-slate-600 dark:text-slate-300 ${isAdmin ? 'justify-between' : 'gap-8'}`}>
                                                <span>Rating: {item.rating > 0 ? item.rating : 'No rating'}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{item.priceLabel || 'Rs 0'}</span>
                                                    {Number(item.basePrice || 0) > Number(item.salePrice || 0) ? (
                                                        <span className="text-slate-400 line-through dark:text-slate-500">{item.basePriceLabel}</span>
                                                    ) : null}
                                                </div>
                                                {isAdmin && item.sellerName ? (
                                                    <span className="max-w-[42%] truncate text-emerald-700 dark:text-emerald-300">Seller: {item.sellerName}</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                ) : isOrderSection ? (
                                    <div className="w-full">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0 flex-shrink-0 text-left">
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Customer:- {item.meta}</p>
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">{item.amountLabel || 'Rs 0'}</p>
                                            </div>

                                            <div className="min-w-0 flex-1 flex items-center justify-center px-2">
                                                <p className="truncate font-semibold text-lg text-slate-800 dark:text-slate-100 text-center">{item.productName || item.product || '-'}</p>
                                            </div>

                                            <div className="min-w-0 flex-shrink-0 text-right">
                                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${getStatusBadgeColor(item.status || 'pending')}`}>
                                                    {(item.status || 'pending').replace(/_/g, ' ')}
                                                </span>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-6">{item.dateLabel || '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : isCustomerSection ? (
                                    <div className="w-full">
                                        <p className="font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.meta}</p>
                                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">Total Spend: {item.spendLabel || 'Rs 0'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.meta}</p>
                                    </>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No matches in this section.</p>
            )}
        </section>
    );
};

export default SearchResultSection;
