import React from "react";
import LineAreaChartCard from "../../../shared/components/charts/LineAreaChartCard";
import { useCustomers } from "../../../Context/customers/useCustomers";

const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const slugify = (value) => String(value || "chart").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

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

const formatAxisValue = (value) => {
    const toSingleDecimal = (num) => Number(num.toFixed(1)).toString();

    if (value >= 1000) {
        return `${toSingleDecimal(value / 1000)}k`;
    }

    if (!Number.isInteger(value)) {
        return toSingleDecimal(value);
    }

    return `${value}`;
};

const getYAxisStep = (maxValue) => {
    if (maxValue <= 50) {
        return 10;
    }

    if (maxValue <= 100) {
        return 20;
    }

    if (maxValue <= 500) {
        return 100;
    }

    if (maxValue <= 1000) {
        return 200;
    }

    if (maxValue <= 5000) {
        return 1000;
    }

    return 5000;
};

const createYAxisMeta = (chartData) => {
    if (!chartData.length) {
        return {
            labels: ["0"],
            min: 0,
            max: 0,
        };
    }

    const maxValue = Math.max(...chartData);
    const step = Math.ceil(maxValue * 1.25 / 5);
    const domainMax = step * 5;

    return {
        labels: Array.from({ length: 6 }, (_, index) => formatAxisValue(step * index)),
        min: 0,
        max: domainMax,
    };
};

const createXLabels = (chartData, analyticsPeriod) => {
    if (!chartData.length) {
        return [];
    }

    if (analyticsPeriod === "year") {
        return MONTH_LABELS.slice(0, chartData.length);
    }

    if (analyticsPeriod === "month") {
        return Array.from({ length: chartData.length }, (_, index) => `${index + 1}`);
    }

    if (chartData.length <= WEEK_LABELS.length) {
        return WEEK_LABELS.slice(0, chartData.length);
    }

    return Array.from({ length: chartData.length }, (_, index) => `${index + 1}`);
};

const resolveSeriesData = (chartSeries, activeRange, activeStat) => {
    if (!chartSeries || typeof chartSeries !== "object") {
        return [];
    }

    const byRange = chartSeries[activeRange];

    if (Array.isArray(byRange)) {
        return byRange;
    }

    if (byRange && typeof byRange === "object") {
        const byRangeAndStat = byRange[activeStat];
        if (Array.isArray(byRangeAndStat)) {
            return byRangeAndStat;
        }
    }

    const byStat = chartSeries[activeStat];
    if (Array.isArray(byStat)) {
        return byStat;
    }

    if (byStat && typeof byStat === "object") {
        const byStatAndRange = byStat[activeRange];
        if (Array.isArray(byStatAndRange)) {
            return byStatAndRange;
        }
    }

    return [];
};

const hasRenderableSeriesData = (series) => {
    if (!Array.isArray(series) || !series.length) {
        return false;
    }

    return series.some((point) => point !== null && point !== undefined);
};

const OverviewChart = ({
    title,
    stats,
    ranges,
    activeRange,
    onRangeChange,
    activeStat,
    onStatChange,
    chartSeries,
    activePointIndex,
    tooltip,
}) => {
    const {
        analyticsPeriod,
        setAnalyticsPeriod,
        periodOptions,
        monthOptions,
        selectedYear,
        setSelectedYear,
        selectedMonth,
        setSelectedMonth,
        availableYears,
        xLabelsByRange,
    } = useCustomers();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const visibleStats = React.useMemo(() => {
        if (!Array.isArray(stats) || !stats.length) {
            return [];
        }

        const rangeValues = Array.isArray(ranges) && ranges.length
            ? ranges.map((range) => range.value)
            : Object.keys(chartSeries || {});

        return stats.filter((stat) => {
            const statKey = stat?.key ?? stat?.valueKey ?? stat?.label;
            if (!statKey) {
                return false;
            }

            return rangeValues.some((rangeValue) => hasRenderableSeriesData(resolveSeriesData(chartSeries, rangeValue, statKey)));
        });
    }, [stats, ranges, chartSeries]);

    const resolvedActiveStat = React.useMemo(() => {
        const hasSelected = visibleStats.some((stat) => {
            const statKey = stat?.key ?? stat?.valueKey ?? stat?.label;
            return statKey === activeStat;
        });

        if (hasSelected) {
            return activeStat;
        }

        const fallback = visibleStats[0];
        return fallback ? (fallback.key ?? fallback.valueKey ?? fallback.label) : activeStat;
    }, [visibleStats, activeStat]);

    React.useEffect(() => {
        if (!isMenuOpen) {
            return undefined;
        }

        const handleOutsideClick = (event) => {
            const clickedMenu = event.target.closest(".chart-more-menu");
            const clickedTrigger = event.target.closest(".chart-more-menu-trigger");

            if (!clickedMenu && !clickedTrigger) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isMenuOpen]);

    const selectedChartData = resolveSeriesData(chartSeries, activeRange, resolvedActiveStat);
    const axisYMeta = createYAxisMeta(selectedChartData);
    const axisXLabels = Array.isArray(xLabelsByRange?.[activeRange])
        ? xLabelsByRange[activeRange]
        : createXLabels(selectedChartData, analyticsPeriod);

    const handleExportChart = React.useCallback(() => {
        const headers = ["Range", "Label", "Active Customers", "Repeat Customers", "Shop Visitor", "Conversion Rate"];
        const rows = [headers];

        ranges.forEach((range) => {
            const rangeName = range.value;
            const activeCustomers = resolveSeriesData(chartSeries, rangeName, "activeCustomers");
            const repeatCustomers = resolveSeriesData(chartSeries, rangeName, "repeatCustomers");
            const shopVisitor = resolveSeriesData(chartSeries, rangeName, "shopVisitor");
            const conversionRate = resolveSeriesData(chartSeries, rangeName, "conversionRate");
            const labels = Array.isArray(xLabelsByRange?.[rangeName])
                ? xLabelsByRange[rangeName]
                : createXLabels(activeCustomers, analyticsPeriod);

            labels.forEach((label, index) => {
                rows.push([
                    rangeName,
                    label || `Point ${index + 1}`,
                    activeCustomers[index] ?? "",
                    repeatCustomers[index] ?? "",
                    shopVisitor[index] ?? "",
                    conversionRate[index] ?? "",
                ]);
            });
        });

        downloadCsv(rows, `customers-overview-${slugify(activeRange)}.csv`);
        setIsMenuOpen(false);
    }, [activeRange, chartSeries, ranges, analyticsPeriod, xLabelsByRange]);

    const moreMenuContent = (
        <>
            {periodOptions.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-gray-900 ${analyticsPeriod === option.value ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"}`}
                    onClick={() => {
                        setAnalyticsPeriod(option.value);
                        setIsMenuOpen(false);
                    }}
                >
                    {option.label}
                </button>
            ))}
            <div className="h-px w-full bg-slate-200 dark:bg-slate-700" />
            {(analyticsPeriod === "daywise" || analyticsPeriod === "month") ? (
                <div className="px-3 py-3">
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Year</label>
                    <select
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                        value={selectedYear}
                        onChange={(event) => setSelectedYear(event.target.value)}
                    >
                        {availableYears.map((year) => (
                            <option key={year} value={String(year)}>{year}</option>
                        ))}
                    </select>
                </div>
            ) : null}
            {analyticsPeriod === "daywise" ? (
                <div className="px-3 pb-3">
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Month</label>
                    <select
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                        value={selectedMonth}
                        onChange={(event) => setSelectedMonth(event.target.value)}
                    >
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
                onClick={handleExportChart}
            >
                Export CSV
            </button>
        </>
    );

    return (
        <div className="w-full xl:flex-1 xl:min-w-0">
            <LineAreaChartCard
                variant="customersOverview"
                title={title}
                stats={visibleStats}
                ranges={ranges}
                activeRange={activeRange}
                onRangeChange={onRangeChange}
                activeStat={resolvedActiveStat}
                onStatChange={onStatChange ? (nextStat) => onStatChange(nextStat) : undefined}
                rangeWrapperClassName="flex items-center gap-2"
                rangeGroupClassName="flex -mt-1 min-w-37 min-h-6 p-1 gap-1 items-center justify-center bg-[#EAF8E7] rounded-md"
                rangeButtonBaseClassName="py-1 px-2 rounded-md font-medium text-[12px]"
                activeRangeButtonClassName="bg-white text-[#4EA674]"
                inactiveRangeButtonClassName="text-[#6A717F] hover:bg-[#DDE6EB]"
                chartData={selectedChartData}
                yLabels={axisYMeta.labels}
                yDomainMin={axisYMeta.min}
                yDomainMax={axisYMeta.max}
                xLabels={axisXLabels}
                activePointIndex={activePointIndex}
                tooltip={tooltip}
                showMoreIcon
                onMoreClick={() => setIsMenuOpen((current) => !current)}
                moreMenuContent={moreMenuContent}
                isMoreMenuOpen={isMenuOpen}
            />
        </div>
    );
};

export default OverviewChart;