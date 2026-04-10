import React from "react";
import { FiMoreVertical } from "react-icons/fi";
import { useCustomers } from "../../../Context/customers/useCustomers";
import { getCustomersAnalytics } from "../CustomersAPI";

const slugify = (value) => String(value || "summary").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const summaryCardPeriodOptions = [
    { label: "Last 7 Days", value: "7days" },
    { label: "Month-wise", value: "daywise" },
    { label: "Year-wise", value: "month" },
];

const getCardPeriodLabel = (settings) => {
    if (settings.period === "year") {
        return "Year-wise";
    }

    if (settings.period === "month") {
        return `${settings.year || ""} (Year-wise)`;
    }

    if (settings.period === "daywise") {
        const monthLabel = monthNames[Number(settings.month) - 1] || "";
        return `${monthLabel} ${settings.year || ""} (Month-wise)`;
    }

    return "Last 7 days";
};

const getDefaultCardSettings = () => ({
    period: "7days",
    year: "",
    month: "",
});

const toCardMap = (cards = []) => cards.reduce((accumulator, item) => {
    if (item?.title) {
        accumulator[item.title] = item;
    }
    return accumulator;
}, {});

const getResolvedSettings = (settings, availableYears) => {
    const fallbackYear = availableYears[availableYears.length - 1] || new Date().getFullYear();
    const period = settings?.period || "7days";
    const year = settings?.year || String(fallbackYear);
    const month = settings?.month || String(new Date().getMonth() + 1);

    return {
        period,
        year: period === "7days" ? "" : year,
        month: period === "daywise" ? month : "",
    };
};

const downloadCsv = (rows, fileName) => {
    const csvText = rows
        .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const SummaryCards = () => {
    const { summaryCards, monthOptions, availableYears, isSellerView } = useCustomers();
    const [openCardTitle, setOpenCardTitle] = React.useState(null);
    const [cardSettings, setCardSettings] = React.useState({});
    const [cardDataMap, setCardDataMap] = React.useState({});
    const [baseCardMap, setBaseCardMap] = React.useState({});
    const containerClassName = isSellerView
        ? "grid grid-cols-2 gap-4 md:grid-cols-4 xl:w-full"
        : "space-y-4 xl:w-[28%]";

    React.useEffect(() => {
        if (!openCardTitle) {
            return undefined;
        }

        const handleOutsideClick = (event) => {
            const clickedMenu = event.target.closest(".summary-card-menu");
            const clickedTrigger = event.target.closest(".summary-card-menu-trigger");

            if (!clickedMenu && !clickedTrigger) {
                setOpenCardTitle(null);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [openCardTitle]);

    React.useEffect(() => {
        let isMounted = true;

        const loadFixedBaseCards = async () => {
            if (Object.keys(baseCardMap).length) {
                return;
            }

            try {
                const response = await getCustomersAnalytics({ period: "7days", ...(isSellerView ? { role: "seller" } : {}) });
                const payload = response.data?.data || response.data || {};
                const cards = Array.isArray(payload.summaryCards) ? payload.summaryCards : [];

                if (!isMounted || !cards.length) {
                    return;
                }

                setBaseCardMap(toCardMap(cards));
            } catch {
                if (!isMounted || !Array.isArray(summaryCards) || !summaryCards.length) {
                    return;
                }

                setBaseCardMap(toCardMap(summaryCards));
            }
        };

        loadFixedBaseCards();

        return () => {
            isMounted = false;
        };
    }, [baseCardMap, summaryCards]);

    const getSettingsForCard = React.useCallback((cardTitle) => {
        return cardSettings[cardTitle] || getDefaultCardSettings();
    }, [cardSettings]);

    const fetchCardData = React.useCallback(async (cardTitle, nextSettings) => {
        const resolved = getResolvedSettings(nextSettings, availableYears);
        const params = { period: resolved.period };

        if (resolved.year) {
            params.year = Number(resolved.year);
        }

        if (resolved.month) {
            params.month = Number(resolved.month);
        }

        const response = await getCustomersAnalytics({ ...params, ...(isSellerView ? { role: "seller" } : {}) });
        const payload = response.data?.data || response.data || {};
        const nextCard = Array.isArray(payload.summaryCards)
            ? payload.summaryCards.find((item) => item?.title === cardTitle)
            : null;

        if (nextCard) {
            setCardDataMap((current) => ({
                ...current,
                [cardTitle]: nextCard,
            }));
        }
    }, [availableYears, isSellerView]);

    const updateCardSettings = React.useCallback(async (cardTitle, patch) => {
        const nextSettings = {
            ...(cardSettings[cardTitle] || getDefaultCardSettings()),
            ...patch,
        };

        setCardSettings((current) => ({
            ...current,
            [cardTitle]: nextSettings,
        }));

        try {
            await fetchCardData(cardTitle, nextSettings);
        } catch {
            // Keep existing card values when scoped request fails.
        }
    }, [cardSettings, fetchCardData]);

    const handleExportCard = React.useCallback((card, settings) => {
        const headers = ["Metric", "Value", "Change", "Period"];
        const rows = [
            headers,
            [card.title, card.value, card.change, getCardPeriodLabel(settings)],
        ];

        downloadCsv(rows, `${slugify(card.title)}.csv`);
        setOpenCardTitle(null);
    }, []);

    return (
        <div className={containerClassName}>
            {summaryCards.map((card) => {
                const settings = getSettingsForCard(card.title);
                const baseCard = baseCardMap[card.title] || card;
                const displayCard = cardDataMap[card.title] || baseCard;
                const parsedChange = Number.parseFloat(String(displayCard.change || "").replace("%", ""));
                const backendSaysNegative = String(displayCard.changeColor || "").toLowerCase() === "#ef4444";
                const isNegativeChange = backendSaysNegative || (Number.isFinite(parsedChange) && parsedChange < 0);
                const changeIndicator = isNegativeChange ? "↓" : "↑";
                const changeColor = displayCard.changeColor || (isNegativeChange ? "#EF4444" : "#22C55E");

                return (
                    <div
                        key={card.title}
                        className="relative p-4 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg"
                    >
                        <button
                            type="button"
                            className="summary-card-menu-trigger absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            aria-label={`${card.title} actions`}
                            title="More options"
                            onClick={() => setOpenCardTitle((current) => (current === card.title ? null : card.title))}
                        >
                            <FiMoreVertical />
                        </button>

                        {openCardTitle === card.title ? (
                            <div className="summary-card-menu absolute right-3 top-11 z-30 min-w-44 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950">
                                {summaryCardPeriodOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-gray-900 ${settings.period === option.value ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"}`}
                                        onClick={() => updateCardSettings(card.title, { period: option.value })}
                                    >
                                        {option.label}
                                    </button>
                                ))}

                                <div className="h-px w-full bg-slate-200 dark:bg-slate-700" />

                                {(settings.period === "daywise" || settings.period === "month") ? (
                                    <div className="px-3 py-3">
                                        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Year</label>
                                        <select
                                            className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                            value={settings.year}
                                            onChange={(event) => updateCardSettings(card.title, { year: event.target.value })}
                                        >
                                            <option value="">Select year</option>
                                            {availableYears.map((year) => (
                                                <option key={year} value={String(year)}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}

                                {settings.period === "daywise" ? (
                                    <div className="px-3 pb-3">
                                        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Month</label>
                                        <select
                                            className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                            value={settings.month}
                                            onChange={(event) => updateCardSettings(card.title, { month: event.target.value })}
                                        >
                                            <option value="">Select month</option>
                                            {monthOptions.map((month) => (
                                                <option key={month.value} value={String(month.value)}>{month.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}

                                <div className="h-px w-full bg-slate-200 dark:bg-slate-700" />

                                <button
                                    type="button"
                                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                                    onClick={() => handleExportCard(displayCard, settings)}
                                >
                                    Export CSV
                                </button>
                            </div>
                        ) : null}

                        <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-50">{displayCard.title}</div>
                        <div className="mt-4 flex items-end gap-3">
                            <div className="text-[28px] font-semibold leading-none text-slate-950 dark:text-slate-50">{displayCard.value}</div>
                            <div className="mb-1 text-[12px] font-semibold" style={{ color: changeColor }}>{changeIndicator} {displayCard.change}</div>
                        </div>
                        <div className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">{getCardPeriodLabel(settings)}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default SummaryCards;