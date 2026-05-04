import React from "react";
import LineAreaChartCard from "../../../shared/components/charts/LineAreaChartCard";
import DashboardCardMenu from "../components/DashboardCardMenu";
import { useDashboardCardData } from "../hooks/useDashboardCardData";

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

const createYAxisMeta = (chartData) => {
    if (!chartData.length) {
        return {
            labels: ["0"],
            min: 0,
            max: 0,
        };
    }

    const maxValue = Math.max(...chartData);
    const step = Math.ceil((maxValue * 1.25) / 5);
    const domainMax = step * 5;

    return {
        labels: Array.from({ length: 6 }, (_, index) => formatAxisValue(step * index)),
        min: 0,
        max: domainMax,
    };
};

const WeeklyReportCard = ({
    title,
    stats,
    ranges,
    activeRange,
    onRangeChange,
    activeStat,
    onStatChange,
    chartSeries,
    xLabels,
}) => {
    const { cardSettings, availableYears, availableMonths, updateCardSettings } = useDashboardCardData();
    const selectedChartData = resolveSeriesData(chartSeries, activeRange, activeStat);
    const axisYMeta = createYAxisMeta(selectedChartData);

    // dashboard card settings and export handled by DashboardCardMenu

    const handleExport = React.useCallback(() => {
        const headers = ["Day", "Value"];
        const rows = [
            headers,
            ...xLabels.map((label, index) => [label, selectedChartData[index] ?? 0]),
        ];

        downloadCsv(rows, `${String(title || "weekly-report").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.csv`);
    }, [selectedChartData, title, xLabels]);

    return (
        <div className="w-full min-w-105 h-115 ml-5 flex-1">
            <div className="relative">
                <DashboardCardMenu
                    cardData={{ title }}
                    cardSettings={cardSettings}
                    onSettingsChange={updateCardSettings}
                    availableYears={availableYears}
                    availableMonths={availableMonths}
                    onExport={handleExport}
                />

                <LineAreaChartCard
                    variant="dashboardWeekly"
                    title={title}
                    stats={stats}
                    ranges={ranges}
                    activeRange={activeRange}
                    onRangeChange={onRangeChange}
                    activeStat={activeStat}
                    onStatChange={onStatChange}
                    chartData={selectedChartData}
                    xLabels={xLabels}
                    yLabels={axisYMeta.labels}
                    yDomainMin={axisYMeta.min}
                    yDomainMax={axisYMeta.max}
                    showMoreIcon={false}
                />
            </div>
        </div>
    );
};

export default WeeklyReportCard;
