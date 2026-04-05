import React from 'react';
import { FiMoreVertical, FiPlus } from 'react-icons/fi';

const OrderHeader = () => {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <h3 className="text-[18px] font-bold text-slate-900 dark:text-slate-100">Order List</h3>
      <div className="flex items-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-md bg-[#4EA674] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#4EA674]/20 transition hover:bg-[#409162]">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/70 text-xs">
            <FiPlus />
          </span>
          Add Order
        </button>
        <button className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200 dark:hover:bg-gray-900">
          More Action
          <FiMoreVertical />
        </button>
      </div>
    </div>
  );
};

export default OrderHeader;
