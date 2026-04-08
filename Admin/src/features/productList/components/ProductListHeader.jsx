import React from 'react';
import { FiMoreVertical, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useProductList } from '../../../Context/productList/useProductList';

const ProductListHeader = () => {
    const navigate = useNavigate();
    const { setSearchText, setSortBy, setCurrentPage, setPageSize, totalPages, currentPage } = useProductList();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-[22px] font-semibold text-slate-900 dark:text-slate-100">Product List</h3>

            <div className="relative flex items-center gap-3">
                <button
                    className="inline-flex items-center gap-2 rounded-md bg-[#4EA674] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#4EA674]/20 transition hover:bg-[#409162]"
                    onClick={() => navigate('/add-products')}
                >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/70 text-xs">
                        <FiPlus />
                    </span>
                    Add Product
                </button>

                <button
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200 dark:hover:bg-gray-900"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                >
                    More Action
                    <FiMoreVertical />
                </button>

                {isMenuOpen ? (
                    <div className="absolute right-0 top-12 z-20 min-w-52 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950">
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
                                setSearchText('');
                                setSortBy('latest');
                                setPageSize(10);
                                setCurrentPage(1);
                                setIsMenuOpen(false);
                            }}
                        >
                            Clear All Filters
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

export default ProductListHeader;
