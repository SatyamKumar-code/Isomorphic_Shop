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

const createYAxisLabels = (chartData) => {
    if (!chartData.length) return ["0"];

    const rawMax = Math.max(...chartData);
    if (rawMax === 0) return ["0"];

    const maxY = Math.ceil(rawMax * 1.3);
    const step = Math.ceil(maxY / 5) || 1;

    // If values are small (below 1000) show raw numbers, otherwise show K units
    if (maxY < 1000) {
        return Array.from({ length: 6 }, (_, index) => String(step * index));
    }

    return Array.from({ length: 6 }, (_, index) => {
        const value = Math.round(step * index);
        return `${Math.round(value / 1000)}K`;
    });
};

const createYAxisDomainMax = (chartData) => {
    if (!chartData.length) return 0;
    const rawMax = Math.max(...chartData);
    return Math.ceil(rawMax * 1.3);
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
    const yDomainMax = createYAxisDomainMax(selectedChartData);

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
                    yLabels={createYAxisLabels(selectedChartData)}
                    yDomainMin={0}
                    yDomainMax={yDomainMax}
                    showMoreIcon={false}
                />
            </div>
        </div>
    );
};

export default WeeklyReportCard;
