import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useCategories } from '../../../Context/categories/useCategories';

const CategoriesPagination = ({ currentPage: propPage, setCurrentPage: propSetPage, pagination: propPagination, totalPages: propTotalPages }) => {
    const ctx = useCategories();
    const pagination = propPagination || ctx.pagination;
    const totalPages = propTotalPages ?? ctx.totalPages;
    const currentPage = propPage ?? ctx.currentPage;
    const setCurrentPage = propSetPage || ctx.setCurrentPage;

    return (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <button
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200 dark:hover:bg-gray-900"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
            >
                <FiChevronLeft />
                Previous
            </button>

            <div className="flex flex-wrap items-center justify-center gap-2">
                {pagination.map((page) => (
                    <button
                        key={page}
                        className={`min-w-8 rounded-md border px-3 py-1.5 text-sm shadow-sm transition ${currentPage === page
                            ? 'border-[#4EA674] bg-[#CDE8C1] text-[#4EA674]'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-300 dark:hover:bg-gray-900'
                            }`}
                        onClick={() => setCurrentPage(page)}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200 dark:hover:bg-gray-900"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
            >
                Next
                <FiChevronRight />
            </button>
        </div>
    );
};

export default CategoriesPagination;
