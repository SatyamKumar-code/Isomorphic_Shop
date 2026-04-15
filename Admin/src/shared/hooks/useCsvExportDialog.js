import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

export const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const defaultMessages = {
    noData: 'No data available to export',
    prepareError: 'Failed to prepare export data',
    selectYearMonth: 'Please select year and month',
    noMonthData: 'No data found for selected month',
    selectYear: 'Please select year',
    noYearData: 'No data found for selected year',
    selectDates: 'Please select from and to dates',
    invalidDateRange: 'From date cannot be after to date',
    noDateData: 'No data found in selected date range',
    successAll: 'All data exported successfully',
    successMonth: 'Month-wise export completed',
    successYear: 'Year-wise export completed',
    successDate: 'Date-to-date export completed',
    exportError: 'Failed to export data',
};

export const useCsvExportDialog = ({
    fetchAllItems,
    onDownload,
    getItemCreatedAt,
    messages = {},
}) => {
    const msg = { ...defaultMessages, ...messages };

    const [isOpen, setIsOpen] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);
    const [exportMode, setExportMode] = useState('all');
    const [items, setItems] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedFromDate, setSelectedFromDate] = useState('');
    const [selectedToDate, setSelectedToDate] = useState('');

    const getDateOnly = useCallback((value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const toDateLabel = useCallback((yyyyMmDd) => {
        const [year, month, day] = yyyyMmDd.split('-');
        return `${day}-${month}-${year}`;
    }, []);

    const availableYears = useMemo(() => {
        const years = new Set();
        items.forEach((item) => {
            const date = new Date(getItemCreatedAt(item));
            if (!Number.isNaN(date.getTime())) {
                years.add(String(date.getFullYear()));
            }
        });

        return Array.from(years).sort((a, b) => Number(b) - Number(a));
    }, [items, getItemCreatedAt]);

    const availableMonthsForYear = useMemo(() => {
        if (!selectedYear) return [];

        const months = new Set();
        items.forEach((item) => {
            const date = new Date(getItemCreatedAt(item));
            if (!Number.isNaN(date.getTime()) && String(date.getFullYear()) === selectedYear) {
                months.add(String(date.getMonth() + 1).padStart(2, '0'));
            }
        });

        return Array.from(months).sort((a, b) => Number(a) - Number(b));
    }, [items, selectedYear, getItemCreatedAt]);

    const availableDates = useMemo(() => {
        const dates = new Set();
        items.forEach((item) => {
            const normalized = getDateOnly(getItemCreatedAt(item));
            if (normalized) dates.add(normalized);
        });

        return Array.from(dates).sort((a, b) => a.localeCompare(b));
    }, [items, getDateOnly, getItemCreatedAt]);

    const openDialog = useCallback(async () => {
        try {
            setIsPreparing(true);
            const allItems = await fetchAllItems();

            if (!allItems.length) {
                toast.error(msg.noData);
                return;
            }

            setItems(allItems);
            setExportMode('all');
            setIsOpen(true);
        } catch (error) {
            toast.error(error?.response?.data?.message || msg.prepareError);
        } finally {
            setIsPreparing(false);
        }
    }, [fetchAllItems, msg.noData, msg.prepareError]);

    const closeDialog = useCallback(() => {
        setIsOpen(false);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        if (!selectedYear && availableYears.length) {
            setSelectedYear(availableYears[0]);
        }
    }, [isOpen, selectedYear, availableYears]);

    useEffect(() => {
        if (!isOpen) return;

        if (!selectedMonth && availableMonthsForYear.length) {
            setSelectedMonth(availableMonthsForYear[0]);
        }
        if (selectedMonth && !availableMonthsForYear.includes(selectedMonth)) {
            setSelectedMonth(availableMonthsForYear[0] || '');
        }
    }, [isOpen, selectedMonth, availableMonthsForYear]);


    useEffect(() => {
        if (!isOpen) return;
        // Do not auto-select from/to date, let user pick
        // Only clear values if mode changes
    }, [isOpen]);

    const exportByMode = useCallback(async () => {
        try {
            if (exportMode === 'all') {
                await onDownload(items, 'all', {});
                toast.success(msg.successAll);
                setIsOpen(false);
                return;
            }

            if (exportMode === 'month') {
                if (!selectedYear || !selectedMonth) {
                    toast.error(msg.selectYearMonth);
                    return;
                }

                const filtered = items.filter((item) => {
                    const createdAt = new Date(getItemCreatedAt(item));
                    return !Number.isNaN(createdAt.getTime())
                        && String(createdAt.getFullYear()) === selectedYear
                        && String(createdAt.getMonth() + 1).padStart(2, '0') === selectedMonth;
                });

                if (!filtered.length) {
                    toast.error(msg.noMonthData);
                    return;
                }

                await onDownload(filtered, 'month', { selectedYear, selectedMonth });
                toast.success(msg.successMonth);
                setIsOpen(false);
                return;
            }

            if (exportMode === 'year') {
                if (!selectedYear) {
                    toast.error(msg.selectYear);
                    return;
                }

                const filtered = items.filter((item) => {
                    const createdAt = new Date(getItemCreatedAt(item));
                    return !Number.isNaN(createdAt.getTime()) && String(createdAt.getFullYear()) === selectedYear;
                });

                if (!filtered.length) {
                    toast.error(msg.noYearData);
                    return;
                }

                await onDownload(filtered, 'year', { selectedYear });
                toast.success(msg.successYear);
                setIsOpen(false);
                return;
            }

            if (!selectedFromDate || !selectedToDate) {
                toast.error(msg.selectDates);
                return;
            }

            if (selectedFromDate > selectedToDate) {
                toast.error(msg.invalidDateRange);
                return;
            }

            const filtered = items.filter((item) => {
                const dateOnly = getDateOnly(getItemCreatedAt(item));
                return dateOnly && dateOnly >= selectedFromDate && dateOnly <= selectedToDate;
            });

            if (!filtered.length) {
                toast.error(msg.noDateData);
                return;
            }

            await onDownload(filtered, 'date', { selectedFromDate, selectedToDate });
            toast.success(msg.successDate);
            setIsOpen(false);
        } catch (error) {
            toast.error(error?.response?.data?.message || msg.exportError);
        }
    }, [
        exportMode,
        items,
        selectedYear,
        selectedMonth,
        selectedFromDate,
        selectedToDate,
        onDownload,
        getItemCreatedAt,
        getDateOnly,
        msg,
    ]);

    return {
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
        openDialog,
        closeDialog,
        exportByMode,
        toDateLabel,
    };
};
