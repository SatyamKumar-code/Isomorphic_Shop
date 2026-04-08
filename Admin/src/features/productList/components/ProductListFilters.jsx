import React from 'react';
import { FiMoreVertical, FiRefreshCcw, FiSearch } from 'react-icons/fi';
import { useProductList } from '../../../Context/productList/useProductList';

const ProductListFilters = () => {
    const {
        searchText,
        setSearchText,
        sortBy,
        setSortBy,
        pageSize,
        setPageSize,
        rows,
        totalCount,
        totalPages,
        currentPage,
        setCurrentPage,
        reloadProductList,
    } = useProductList();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex rounded-lg bg-[#EAF8E7] p-1 text-sm font-medium text-slate-600">
                <span className="rounded-md bg-white px-3 py-1.5 text-[#4EA674] shadow-sm">All Products ({totalCount})</span>
            </div>

            <div className="relative flex flex-1 flex-wrap items-center justify-end gap-2">
                <label className="flex min-w-70 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-gray-950 dark:text-slate-400">
                    <FiSearch className="shrink-0" />
                    <input
                        type="text"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="Search product, category, subcategory"
                        className="w-full bg-transparent outline-none placeholder:text-slate-400"
                    />
                </label>

                <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm outline-none dark:border-slate-700 dark:bg-gray-950 dark:text-slate-300"
                >
                    <option value="latest">Latest (createdAt)</option>
                    <option value="oldest">Oldest (createdAt)</option>
                    <option value="a-z">Product A-Z</option>
                    <option value="z-a">Product Z-A</option>
                    <option value="stockHigh">Stock High-Low</option>
                    <option value="stockLow">Stock Low-High</option>
                    <option value="featured">Featured Products</option>
                    <option value="outOfStock">Out Of Stock</option>
                    <option value="salesHigh">Total Sales High-Low</option>
                    <option value="salesLow">Total Sales Low-High</option>
                </select>

                <button
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:hover:bg-gray-900"
                    onClick={reloadProductList}
                    title="Refresh product list"
                >
                    <FiRefreshCcw />
                </button>

                <button
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:hover:bg-gray-900"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                >
                    <FiMoreVertical />
                </button>

                {isMenuOpen ? (
                    <div className="absolute right-0 top-12 z-20 min-w-56 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950">
                        <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                            Showing {rows.length} of {totalCount}
                        </div>

                        <div className="border-b border-slate-100 px-4 py-2 dark:border-slate-800">
                            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Page View</p>
                            <div className="flex items-center gap-2">
                                {[10, 20, 30, 50].map((size) => (
                                    <button
                                        key={size}
                                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${pageSize === size
                                            ? 'bg-[#EAF8E7] text-[#2f7f50]'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-900 dark:text-slate-300'
                                            }`}
                                        onClick={() => {
                                            setPageSize(size);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                            onClick={() => {
                                setSearchText('');
                                setCurrentPage(1);
                                setIsMenuOpen(false);
                            }}
                        >
                            Clear Search
                        </button>

                        <button
                            className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                            onClick={() => {
                                setSortBy('latest');
                                setPageSize(10);
                                setCurrentPage(1);
                                setIsMenuOpen(false);
                            }}
                        >
                            Clear Filters
                        </button>

                        <button
                            className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                            onClick={() => {
                                setCurrentPage(1);
                                setIsMenuOpen(false);
                            }}
                        >
                            Go First Page
                        </button>

                        <button
                            className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-gray-900"
                            onClick={() => {
                                setCurrentPage(totalPages);
                                setIsMenuOpen(false);
                            }}
                            disabled={currentPage === totalPages}
                        >
                            Go Last Page
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default ProductListFilters;
