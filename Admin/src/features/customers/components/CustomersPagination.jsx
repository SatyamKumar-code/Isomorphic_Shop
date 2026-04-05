import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useCustomers } from "../../../Context/customers/useCustomers";

const CustomersPagination = () => {
    const { currentPage, setCurrentPage, pagination, totalPages } = useCustomers();

    return (
        <div className="mt-5 flex items-center justify-between gap-3">
            <button
                className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-[13px] text-slate-700 shadow-sm shadow-slate-200/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-gray-950 dark:text-slate-200"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
            >
                Previous <FiChevronLeft />
            </button>

            <div className="flex items-center gap-2">
                {pagination.map((page, index) => (
                    <button
                        key={`${page}-${index}`}
                        className={`h-8 min-w-8 rounded border px-2 text-[13px] ${page === currentPage ? "border-emerald-300 bg-emerald-100 text-emerald-700" : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-gray-950 dark:text-slate-300"}`}
                        onClick={() => typeof page === "number" && setCurrentPage(page)}
                        disabled={page === "..."}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-[13px] text-slate-700 shadow-sm shadow-slate-200/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-gray-950 dark:text-slate-200"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
            >
                Next <FiChevronRight />
            </button>
        </div>
    );
};

export default CustomersPagination;