import React from 'react';
import { monthNames } from '../hooks/useCsvExportDialog';

const CsvExportDialog = ({ title, modeLabelMap, exportState }) => {
    const {
        isOpen,
        isPreparing,
        exportMode,
        setExportMode,
        selectedYear,
        setSelectedYear,
        selectedMonth,
        setSelectedMonth,
        selectedFromDate,
        setSelectedFromDate,
        selectedToDate,
        setSelectedToDate,
        availableYears,
        availableMonthsForYear,
        availableDates,
        closeDialog,
        exportByMode,
        toDateLabel,
    } = exportState;

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-gray-950">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{modeLabelMap[exportMode]}</p>

                {isPreparing ? (
                    <div className="mt-4 text-sm text-slate-500">Preparing export data...</div>
                ) : (
                    <>
                        <div className="mt-4">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Export Type</label>
                            <select
                                value={exportMode}
                                onChange={(event) => setExportMode(event.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                            >
                                <option value="all">All Data</option>
                                <option value="month">Month Wise</option>
                                <option value="year">Year Wise</option>
                                <option value="date">Date To Date</option>
                            </select>
                        </div>

                        {(exportMode === 'month' || exportMode === 'year') ? (
                            <div className="mt-4">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Year</label>
                                <select
                                    value={selectedYear}
                                    onChange={(event) => setSelectedYear(event.target.value)}
                                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                >
                                    {availableYears.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        {exportMode === 'month' ? (
                            <div className="mt-4">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Month</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(event) => setSelectedMonth(event.target.value)}
                                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                >
                                    {availableMonthsForYear.map((month) => (
                                        <option key={month} value={month}>{`${month} - ${monthNames[Number(month) - 1] || month}`}</option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        {exportMode === 'date' ? (
                            <>
                                <div className="mt-4">
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">From Date</label>
                                    <select
                                        value={selectedFromDate}
                                        onChange={(event) => setSelectedFromDate(event.target.value)}
                                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                    >
                                        {availableDates.map((date) => (
                                            <option key={date} value={date}>{toDateLabel(date)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mt-4">
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">To Date</label>
                                    <select
                                        value={selectedToDate}
                                        onChange={(event) => setSelectedToDate(event.target.value)}
                                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                    >
                                        {availableDates.map((date) => (
                                            <option key={date} value={date}>{toDateLabel(date)}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : null}
                    </>
                )}

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                        onClick={closeDialog}
                    >
                        Cancel
                    </button>

                    <button
                        className="rounded-md bg-[#4EA674] px-3 py-2 text-sm font-semibold text-white hover:bg-[#409162]"
                        onClick={exportByMode}
                    >
                        Export
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CsvExportDialog;
