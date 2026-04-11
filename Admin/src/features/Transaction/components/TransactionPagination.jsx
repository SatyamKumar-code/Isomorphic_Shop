import React from 'react';
import { useTransaction } from '../../../Context/transaction/useTransaction';

const TransactionPagination = () => {
    const { currentPage, setCurrentPage, totalPages, totalResults, pageSize, setPageSize } = useTransaction();

    const generatePageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pages.push(1);
            if (startPage > 2) {
                pages.push('...');
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push('...');
            }
            pages.push(totalPages);
        }

        return pages;
    };

    const handlePageChange = (page) => {
        if (page !== '...' && page !== currentPage) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const startItem = totalResults === 0 ? 0 : ((currentPage - 1) * pageSize + 1);
    const endItem = Math.min(currentPage * pageSize, totalResults);

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-5">
            <div className="min-w-50 flex flex-1 flex-wrap items-center gap-3">
                <p className="text-[13px] text-gray-600 dark:text-gray-400">
                    Showing <span className="font-semibold">{startItem}</span> to{' '}
                    <span className="font-semibold">{endItem}</span> of{' '}
                    <span className="font-semibold">{totalResults}</span> orders
                </p>
                <div className="flex items-center gap-2">
                    <label className="text-[12px] text-gray-600 dark:text-gray-400">Rows per page:</label>
                    <select
                        value={pageSize}
                        onChange={(event) => setPageSize(Number(event.target.value))}
                        className="rounded border border-gray-200 bg-white px-2 py-1 text-[12px] text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    >
                        {[5, 10, 20, 50].map((size) => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>
            </div>

            {totalPages > 1 ? (
                <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-[13px] font-medium text-gray-700 transition hover:border-[#4EA674] hover:bg-green-50 hover:text-[#4EA674] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-[#4EA674] dark:hover:bg-[#4EA674]/10 dark:disabled:hover:border-gray-700 dark:disabled:hover:bg-gray-900"
                    >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.5 16.25L5.625 9.375L12.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Previous
                    </button>

                    <div className="flex items-center gap-1">
                        {generatePageNumbers().map((page, index) => (
                            <button
                                key={index}
                                onClick={() => handlePageChange(page)}
                                disabled={page === '...'}
                                className={`flex h-8 w-8 items-center justify-center rounded-md border text-[13px] font-medium transition ${page === '...' ? 'cursor-default border-none bg-transparent text-gray-400 dark:text-gray-600' : currentPage === page ? 'border-[#4EA674] bg-[#4EA674] text-white' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-[#4EA674] hover:bg-green-50 hover:text-[#4EA674] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-[#4EA674] dark:hover:bg-[#4EA674]/10'}`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-[13px] font-medium text-gray-700 transition hover:border-[#4EA674] hover:bg-green-50 hover:text-[#4EA674] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-[#4EA674] dark:hover:bg-[#4EA674]/10 dark:disabled:hover:border-gray-700 dark:disabled:hover:bg-gray-900"
                    >
                        Next
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.5 16.25L14.375 9.375L7.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default TransactionPagination;
