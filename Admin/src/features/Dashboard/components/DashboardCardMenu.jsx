import React from 'react';
import { FiMoreVertical } from 'react-icons/fi';
import { exportCardData } from '../DashboardPageAPI';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const summaryCardPeriodOptions = [
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Month-wise', value: 'daywise' },
    { label: 'Year-wise', value: 'month' },
];

export const DashboardCardMenu = ({
    cardData,
    cardSettings,
    onSettingsChange,
    availableYears = [],
    availableMonths = [],
    onExport,
}) => {

    const [openMenu, setOpenMenu] = React.useState(false);

    React.useEffect(() => {
        if (!openMenu) {
            return undefined;
        }

        const handleOutside = (event) => {
            if (!event.target.closest('.dashboard-card-menu') && !event.target.closest('.dashboard-card-trigger')) {
                setOpenMenu(false);
            }
        };

        document.addEventListener('mousedown', handleOutside);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
        };
    }, [openMenu]);

    const yearOptions = React.useMemo(() => {
        if (availableYears && availableYears.length) {
            return availableYears;
        }

        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, index) => currentYear - index);
    }, [availableYears]);

    const monthOptions = React.useMemo(() => {
        if (availableMonths && availableMonths.length) {
            return availableMonths;
        }

        return Array.from({ length: 12 }, (_, index) => index + 1);
    }, [availableMonths]);

    const handleExport = React.useCallback(() => {
        if (onExport) {
            onExport();
        } else if (cardData) {
            exportCardData(cardData);
        }
        setOpenMenu(false);
    }, [cardData, onExport]);

    return (
        <>
            <button
                type="button"
                className="dashboard-card-trigger absolute right-3 top-3 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                aria-label={`${cardData?.title || 'Card'} actions`}
                onClick={() => setOpenMenu((prev) => !prev)}
            >
                <FiMoreVertical />
            </button>

            {openMenu ? (
                <div className="dashboard-card-menu absolute right-3 top-11 z-30 min-w-48 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950">
                    {summaryCardPeriodOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-gray-900 ${cardSettings.period === option.value
                                ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-700 dark:text-slate-200'
                                }`}
                            onClick={() => onSettingsChange({ period: option.value })}
                        >
                            {option.label}
                        </button>
                    ))}

                    {(cardSettings.period === 'month' || cardSettings.period === 'daywise') ? (
                        <div className="px-3 pb-3 pt-1">
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                                Year
                            </label>
                            <select
                                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                value={cardSettings.year}
                                onChange={(event) => onSettingsChange({ year: event.target.value })}
                            >
                                {yearOptions.map((year) => (
                                    <option key={year} value={String(year)}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    {cardSettings.period === 'daywise' ? (
                        <div className="px-3 pb-3">
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                                Month
                            </label>
                            <select
                                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                value={cardSettings.month}
                                onChange={(event) => onSettingsChange({ month: event.target.value })}
                            >
                                {monthOptions.map((monthValue) => (
                                    <option key={monthValue} value={String(monthValue).padStart(2, '0')}>
                                        {`${String(monthValue).padStart(2, '0')} - ${monthNames[Number(monthValue) - 1]}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    <button
                        type="button"
                        className="block w-full border-t border-slate-200 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-gray-900"
                        onClick={handleExport}
                    >
                        Export CSV
                    </button>
                </div>
            ) : null}
        </>
    );
};

export default DashboardCardMenu;
