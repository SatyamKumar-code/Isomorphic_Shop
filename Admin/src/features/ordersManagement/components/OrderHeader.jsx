import React from 'react';
import { FiMoreVertical, FiPlus } from 'react-icons/fi';
import { useOrder } from '../../../Context/order/useOrder';
import AddOrderModal from './AddOrderModal';
import CsvExportDialog from '../../../shared/components/CsvExportDialog';
import { useCsvExportDialog } from '../../../shared/hooks/useCsvExportDialog';

const OrderHeader = () => {
  const {
    createOrderFromPayload,
    fetchAllOrdersForExport,
    exportCurrentOrdersCsv,
    isCreateOrderLoading,
    summaryPeriod,
    setSummaryPeriod,
    summaryYear,
    setSummaryYear,
    summaryMonth,
    setSummaryMonth,
    availableSummaryYears,
    availableSummaryMonths,
  } = useOrder();
  const [isAddOrderOpen, setIsAddOrderOpen] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest('.order-header-menu') && !event.target.closest('.order-header-menu-trigger')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMenuOpen]);

  const formatDate = React.useCallback((value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  const buildCsvAndDownload = React.useCallback((items, fileName) => {
    const headers = ['Order ID', 'Product', 'Customer', 'Email', 'Date', 'Price', 'Payment', 'Status', 'Refund Status'];
    const csvRows = items.map((item) => [
      item?.orderId || item?.id || '',
      item?.product || '-',
      item?.customer?.name || '-',
      item?.customer?.email || '-',
      formatDate(item?.createdAt),
      item?.price || '-',
      item?.payment || '-',
      item?.status || '-',
      item?.refundStatus || '-',
    ]);

    const csvText = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [formatDate]);

  const exportState = useCsvExportDialog({
    fetchAllItems: fetchAllOrdersForExport,
    getItemCreatedAt: (item) => item?.createdAt,
    onDownload: async (items, mode, selection) => {
      let fileName = 'order-list-all-data.csv';
      if (mode === 'month') {
        fileName = `order-list-${selection.selectedYear}-${selection.selectedMonth}.csv`;
      }
      if (mode === 'year') {
        fileName = `order-list-${selection.selectedYear}.csv`;
      }
      if (mode === 'date') {
        fileName = `order-list-${selection.selectedFromDate}-to-${selection.selectedToDate}.csv`;
      }

      buildCsvAndDownload(items, fileName);
    },
    messages: {
      noData: 'No order data available to export',
      prepareError: 'Failed to prepare order export data',
      noMonthData: 'No orders found for selected month',
      noYearData: 'No orders found for selected year',
      noDateData: 'No orders found in selected date range',
      successAll: 'All orders exported successfully',
      successMonth: 'Month-wise order export completed',
      successYear: 'Year-wise order export completed',
      successDate: 'Date-to-date order export completed',
      exportError: 'Failed to export order list',
    },
  });

  const modeLabelMap = {
    all: 'Export all available order data.',
    month: 'Select year and month from available data.',
    year: 'Select year from available data.',
    date: 'Select date range from available dates only.',
  };

  const summaryYearOptions = availableSummaryYears.length ? availableSummaryYears : Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - index);
  const summaryMonthOptions = availableSummaryMonths.length ? availableSummaryMonths : Array.from({ length: 12 }, (_, index) => index + 1);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-[22px] font-bold text-slate-900 dark:text-slate-100">Order List</h3>
        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddOrderOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#4EA674] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#4EA674]/20 transition hover:bg-[#409162]"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/70 text-xs">
              <FiPlus />
            </span>
            Add Order
          </button>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="order-header-menu-trigger inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200 dark:hover:bg-gray-900"
          >
            More Action
            <FiMoreVertical />
          </button>

          {isMenuOpen ? (
            <div className="order-header-menu absolute right-0 top-12 z-20 min-w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-gray-950">
              <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Summary view</p>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Global</span>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">Applies to all order summary cards.</p>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: '7D', value: '7days' },
                    { label: 'Month', value: 'daywise' },
                    { label: 'Year', value: 'month' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition ${summaryPeriod === option.value ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-900 dark:text-slate-300 dark:hover:bg-gray-800'}`}
                      onClick={() => {
                        setSummaryPeriod(option.value);

                        if (option.value === '7days') {
                          setSummaryYear('');
                          setSummaryMonth('');
                          return;
                        }

                        if (option.value === 'month') {
                          setSummaryMonth('');
                        }

                        if (option.value === 'daywise') {
                          if (!summaryYear) {
                            setSummaryYear(String(new Date().getFullYear()));
                          }

                          if (!summaryMonth) {
                            setSummaryMonth(String(new Date().getMonth() + 1).padStart(2, '0'));
                          }
                        }
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {(summaryPeriod === 'month' || summaryPeriod === 'daywise') ? (
                  <div className="mt-3">
                    <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Select year</label>
                    <select
                      value={summaryYear}
                      onChange={(event) => setSummaryYear(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                    >
                      <option value="">Current year</option>
                      {summaryYearOptions.map((year) => (
                        <option key={year} value={String(year)}>{year}</option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {summaryPeriod === 'daywise' ? (
                  <div className="mt-3">
                    <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Select month</label>
                    <select
                      value={summaryMonth}
                      onChange={(event) => setSummaryMonth(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                    >
                      <option value="">Current month</option>
                      {summaryMonthOptions.map((monthValue) => (
                        <option key={monthValue} value={String(monthValue).padStart(2, '0')}>
                          {String(monthValue).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                onClick={() => {
                  exportState.openDialog();
                  setIsMenuOpen(false);
                }}
              >
                Export CSV
              </button>

              <button
                type="button"
                className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                onClick={() => {
                  exportCurrentOrdersCsv();
                  setIsMenuOpen(false);
                }}
              >
                Export Current Page CSV
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <AddOrderModal
        isOpen={isAddOrderOpen}
        isSubmitting={isCreateOrderLoading}
        onClose={() => setIsAddOrderOpen(false)}
        onSubmit={async (payload) => {
          const isSuccess = await createOrderFromPayload(payload);
          if (isSuccess) {
            setIsAddOrderOpen(false);
          }
        }}
      />

      <CsvExportDialog
        title="Export Order CSV"
        modeLabelMap={modeLabelMap}
        exportState={exportState}
      />
    </>
  );
};

export default OrderHeader;
