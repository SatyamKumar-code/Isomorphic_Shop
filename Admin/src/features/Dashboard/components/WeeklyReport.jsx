import React from "react";
import LineAreaChartCard from "../../../shared/components/charts/LineAreaChartCard";

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
    if (!chartData.length) {
        return ["0K"];
    }

    const maxY = Math.ceil(Math.max(...chartData) * 1.3);
    const step = maxY / 5;

    return Array.from({ length: 6 }, (_, index) => {
        const value = Math.round(step * index);
        return `${Math.round(value / 1000)}K`;
    });
};

const createYAxisDomainMax = (chartData) => {
    if (!chartData.length) {
        return 0;
    }

    return Math.ceil(Math.max(...chartData) * 1.3);
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
    const selectedChartData = resolveSeriesData(chartSeries, activeRange, activeStat);
    const yDomainMax = createYAxisDomainMax(selectedChartData);

    return (
        <div className="w-full min-w-105 h-115 ml-5 flex-1">
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
            />
        </div>
    );
};

export default WeeklyReportCard;
