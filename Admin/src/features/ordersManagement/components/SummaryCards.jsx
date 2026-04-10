import React from 'react';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';
import { FiMoreVertical } from 'react-icons/fi';
import { useOrder } from '../../../Context/order/useOrder';
import { getOrderSummary } from '../OrderManagementAPI';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const summaryCardPeriodOptions = [
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Month-wise', value: 'daywise' },
  { label: 'Year-wise', value: 'month' },
];

const getDefaultCardSettings = () => ({
  period: '7days',
  year: String(new Date().getFullYear()),
  month: String(new Date().getMonth() + 1).padStart(2, '0'),
});

const getPeriodLabel = (settings) => {
  if (settings.period === 'month') {
    return `${settings.year} (Year-wise)`;
  }

  if (settings.period === 'daywise') {
    const monthLabel = monthNames[Number(settings.month) - 1] || '';
    return `${monthLabel} ${settings.year} (Month-wise)`;
  }

  return 'Last 7 days';
};

const downloadCsv = (rows, fileName) => {
  const csvText = rows
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
};

const SummaryCard = ({ card }) => {
  const {
    summaryPeriod,
    summaryYear,
    summaryMonth,
  } = useOrder();
  const [openMenu, setOpenMenu] = React.useState(false);
  const [settings, setSettings] = React.useState(getDefaultCardSettings);
  const [dynamicCard, setDynamicCard] = React.useState(card);
  const [availableYears, setAvailableYears] = React.useState([]);
  const [availableMonths, setAvailableMonths] = React.useState([]);

  React.useEffect(() => {
    setDynamicCard(card);
  }, [card]);

  React.useEffect(() => {
    setSettings({
      period: summaryPeriod || '7days',
      year: summaryYear || String(new Date().getFullYear()),
      month: summaryMonth || String(new Date().getMonth() + 1).padStart(2, '0'),
    });
    setDynamicCard(card);
  }, [summaryPeriod, summaryYear, summaryMonth, card]);

  React.useEffect(() => {
    if (!openMenu) {
      return undefined;
    }

    const handleOutside = (event) => {
      if (!event.target.closest('.order-summary-menu') && !event.target.closest('.order-summary-trigger')) {
        setOpenMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [openMenu]);

  const yearOptions = React.useMemo(() => {
    if (availableYears.length) {
      return availableYears;
    }

    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, index) => currentYear - index);
  }, [availableYears]);

  const monthOptions = React.useMemo(() => {
    if (availableMonths.length) {
      return availableMonths;
    }

    return Array.from({ length: 12 }, (_, index) => index + 1);
  }, [availableMonths]);

  const fetchCardData = React.useCallback(async (nextSettings) => {
    const params = { period: nextSettings.period };

    if (nextSettings.period === 'month' || nextSettings.period === 'daywise') {
      params.year = Number(nextSettings.year);
    }

    if (nextSettings.period === 'daywise') {
      params.month = Number(nextSettings.month);
    }

    const response = await getOrderSummary(params);
    const payload = response?.data?.data || {};
    const matchedCard = Array.isArray(payload.summaryCards)
      ? payload.summaryCards.find((item) => item?.title === card.title)
      : null;

    if (matchedCard) {
      setDynamicCard(matchedCard);
    }

    setAvailableYears(Array.isArray(payload.availableYears) ? payload.availableYears : []);
    setAvailableMonths(Array.isArray(payload.availableMonths) ? payload.availableMonths : []);
  }, [card.title]);

  const updateSettings = React.useCallback(async (patch) => {
    const nextSettings = {
      ...settings,
      ...patch,
    };

    setSettings(nextSettings);

    try {
      await fetchCardData(nextSettings);
    } catch {
      // Keep previous card values if scoped summary request fails.
    }
  }, [settings, fetchCardData]);

  const handleExport = React.useCallback(() => {
    const rows = [
      ['Metric', 'Value', 'Change', 'Period'],
      [dynamicCard.title, dynamicCard.value, dynamicCard.change, getPeriodLabel(settings)],
    ];

    const fileName = String(dynamicCard.title || 'order-summary')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    downloadCsv(rows, `${fileName}.csv`);
    setOpenMenu(false);
  }, [dynamicCard, settings]);

  const displayCard = dynamicCard || card;

  return (
    <div className="relative p-4 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg">
      <button
        type="button"
        className="order-summary-trigger absolute right-3 top-3 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        aria-label={`${card.title} actions`}
        onClick={() => setOpenMenu((prev) => !prev)}
      >
        <FiMoreVertical />
      </button>

      {openMenu ? (
        <div className="order-summary-menu absolute right-3 top-11 z-30 min-w-48 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950">
          {summaryCardPeriodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-gray-900 ${settings.period === option.value ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}
              onClick={() => updateSettings({ period: option.value })}
            >
              {option.label}
            </button>
          ))}

          {(settings.period === 'month' || settings.period === 'daywise') ? (
            <div className="px-3 pb-3 pt-1">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Year</label>
              <select
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                value={settings.year}
                onChange={(event) => updateSettings({ year: event.target.value })}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </select>
            </div>
          ) : null}

          {settings.period === 'daywise' ? (
            <div className="px-3 pb-3">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Month</label>
              <select
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                value={settings.month}
                onChange={(event) => updateSettings({ month: event.target.value })}
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

      <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{displayCard.title}</p>
      <div className="mt-4 flex items-end gap-3">
        <span className="text-[34px] font-bold leading-none text-slate-900 dark:text-slate-100">{displayCard.value}</span>
        <span className="mb-1 flex items-center gap-1 text-sm font-semibold" style={{ color: displayCard.changeColor }}>
          {displayCard.changeDirection === 'up' ? <FaArrowUp /> : <FaArrowDown />}
          {displayCard.change}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{getPeriodLabel(settings)}</p>
    </div>
  );
};

const SummaryCards = () => {
  const { summaryCards } = useOrder();

  return (
    <div className="mb-5 grid gap-4 xl:grid-cols-4 md:grid-cols-2">
      {summaryCards.map((card) => (
        <SummaryCard key={card.title} card={card} />
      ))}
    </div>
  );
};

export default SummaryCards;
