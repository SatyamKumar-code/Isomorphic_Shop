import React from 'react';
import { FiMoreVertical, FiSearch, FiSliders } from 'react-icons/fi';
import { useOrder } from '../../../Context/order/useOrder';

const OrderFilters = ({ activeTab, onTabChange }) => {
  const {
    tabs,
    searchText,
    setSearchText,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    setPageSize,
    paymentFilter,
    setPaymentFilter,
    resetFilters,
    reloadOrders,
  } = useOrder();
  const [isToolsOpen, setIsToolsOpen] = React.useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest('.order-tools-menu') && !event.target.closest('.order-tools-trigger')) {
        setIsToolsOpen(false);
      }

      if (!event.target.closest('.order-more-menu') && !event.target.closest('.order-more-trigger')) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isToolsOpen || isMoreMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isToolsOpen, isMoreMenuOpen]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex h-10 w-full max-w-sm items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-gray-950 dark:text-slate-400">
          <FiSearch className="shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search order report"
            className="w-full bg-transparent outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="relative">
            <button
              type="button"
              className="order-tools-trigger inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:hover:bg-gray-900"
              onClick={() => setIsToolsOpen((prev) => !prev)}
              title="Order tools"
            >
              <FiSliders />
            </button>

            {isToolsOpen ? (
              <div className="order-tools-menu absolute right-0 z-20 mt-2 w-52 rounded-md border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-gray-950">
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Rows per page</label>
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="mb-3 w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-200"
                >
                  {[10, 20, 50].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>

                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Payment filter</label>
                <select
                  value={paymentFilter}
                  onChange={(event) => setPaymentFilter(event.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-200"
                >
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              className="order-more-trigger inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:hover:bg-gray-900"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              title="More actions"
            >
              <FiMoreVertical />
            </button>

            {isMoreMenuOpen ? (
              <div className="order-more-menu absolute right-0 z-20 mt-2 min-w-52 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950">
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                  onClick={() => {
                    setSearchText('');
                    setCurrentPage(1);
                    setIsMoreMenuOpen(false);
                  }}
                >
                  Clear Search
                </button>

                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                  onClick={() => {
                    resetFilters();
                    setIsMoreMenuOpen(false);
                  }}
                >
                  Clear All Filters
                </button>

                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                  onClick={() => {
                    setCurrentPage(1);
                    setIsMoreMenuOpen(false);
                  }}
                >
                  Go First Page
                </button>

                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-gray-900"
                  onClick={() => {
                    setCurrentPage(totalPages);
                    setIsMoreMenuOpen(false);
                  }}
                  disabled={currentPage === totalPages}
                >
                  Go Last Page
                </button>

                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                  onClick={() => {
                    reloadOrders();
                    setIsMoreMenuOpen(false);
                  }}
                >
                  Refresh Data
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="scrollbarNone -mx-1 overflow-x-auto px-1">
        <div className="inline-flex min-w-max rounded-xl bg-[#EAF8E7] p-1 text-sm font-medium text-slate-600">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.label;

            return (
              <button
                key={tab.label}
                type="button"
                className={`rounded-lg px-3 py-1.5 transition ${isActive ? 'bg-white text-[#4EA674] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => onTabChange(tab.label)}
              >
                {tab.label}{typeof tab.count === 'number' ? ` (${tab.count})` : ''}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderFilters;
