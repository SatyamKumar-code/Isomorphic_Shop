import React from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const getInitials = (value) => {
    return value
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();
};

const ProductListTable = ({ rows = [], isLoading = false, currentPage = 1, pageSize = 10, thumbnailColors = [], onEdit, onDelete, showActions = true, showSellerColumn = false }) => {
    if (isLoading) {
        return <div className="mt-6 text-sm text-slate-500">Loading records...</div>;
    }

    const colors = thumbnailColors.length
        ? thumbnailColors
        : [
            { background: '#F1F8FF', color: '#2563EB' },
            { background: '#FFF7ED', color: '#EA580C' },
            { background: '#F0FDF4', color: '#16A34A' },
        ];

    return (
        <div className="mt-6 overflow-x-auto scrollbarNone">
            <table className="min-w-full border-collapse whitespace-nowrap text-left">
                <thead>
                    <tr className="rounded-lg bg-[#EAF8E7] text-[12px] font-semibold text-slate-600">
                        <th className="rounded-l-lg px-4 py-3">Order</th>
                        <th className="px-4 py-3">Product</th>
                        {showSellerColumn ? <th className="px-4 py-3">Seller</th> : null}
                        <th className="px-4 py-3">Brand</th>
                        <th className="px-4 py-3">Cat</th>
                        <th className="px-4 py-3">Sub Cat</th>
                        <th className="px-4 py-3">Created At</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Total Sales</th>
                        {showActions ? <th className="rounded-r-lg px-4 py-3">Action</th> : null}
                    </tr>
                </thead>

                <tbody>
                    {!rows.length ? (
                        <tr>
                            <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={(showActions ? 9 : 8) + (showSellerColumn ? 1 : 0)}>
                                No records found.
                            </td>
                        </tr>
                    ) : null}

                    {rows.map((item, index) => {
                        const palette = colors[index % colors.length];
                        const stockValue = Number(item.stock || 0);
                        const stockClass = stockValue === 0
                            ? 'text-red-600 font-semibold'
                            : stockValue < 10
                                ? 'text-orange-600 font-semibold'
                                : stockValue < 20
                                    ? 'text-amber-600 font-semibold'
                                    : 'text-slate-700 dark:text-slate-200';

                        return (
                            <tr key={item.id} className="border-b border-slate-200 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200">
                                <td className="px-4 py-4">{(currentPage - 1) * pageSize + index + 1}</td>
                                <td className="px-4 py-4">
                                    <div className="flex max-w-60 items-center gap-3">
                                        <div
                                            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-[10px] font-bold shadow-sm"
                                            style={{ backgroundColor: palette.background, color: palette.color }}
                                        >
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.product}
                                                    className="h-full w-full rounded-md object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                getInitials(item.product)
                                            )}
                                        </div>
                                        <span className="whitespace-normal leading-5 text-slate-700 dark:text-slate-200">{item.product}</span>
                                    </div>
                                </td>
                                {showSellerColumn ? <td className="px-4 py-4">{item.sellerName || '-'}</td> : null}
                                <td className="px-4 py-4">{item.brand || '-'}</td>
                                <td className="px-4 py-4">{item.category}</td>
                                <td className="px-4 py-4">{item.subCategory}</td>
                                <td className="px-4 py-4">{item.date}</td>
                                <td className={`px-4 py-4 ${stockClass}`}>{stockValue}</td>
                                <td className="px-4 py-4">{item.totalSales}</td>
                                {showActions ? (
                                    <td className="px-4 py-4">
                                        <div className="inline-flex items-center gap-3 text-slate-500">
                                            <button className="transition hover:text-[#4EA674]" aria-label="Edit row" onClick={() => onEdit(item.id)}>
                                                <FiEdit2 />
                                            </button>
                                            <button className="transition hover:text-red-500" aria-label="Delete row" onClick={() => onDelete(item.id)}>
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </td>
                                ) : null}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ProductListTable;
