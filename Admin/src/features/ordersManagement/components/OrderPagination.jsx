import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useOrder } from '../../../Context/order/useOrder';

const OrderPagination = ({ currentPage, onPageChange }) => {
  const { pagination, totalPages } = useOrder();

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
      <button
        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200 dark:hover:bg-gray-900"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
              } ${page === '...' ? 'cursor-default border-transparent bg-transparent shadow-none hover:bg-transparent dark:bg-transparent' : ''}`}
            onClick={() => typeof page === 'number' && onPageChange(page)}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200 dark:hover:bg-gray-900"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
        <FiChevronRight />
      </button>
    </div>
  );
};

export default OrderPagination;
