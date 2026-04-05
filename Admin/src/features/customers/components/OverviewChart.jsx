import React from "react";
import LineAreaChartCard from "../../../shared/components/charts/LineAreaChartCard";

const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

const createXLabels = (chartData) => {
    if (!chartData.length) {
        return [];
    }

    return WEEK_LABELS.slice(0, chartData.length);
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
    const selectedChartData = resolveSeriesData(chartSeries, activeRange, activeStat);
    const axisYMeta = createYAxisMeta(selectedChartData);
    const axisXLabels = createXLabels(selectedChartData);

    return (
        <div className="w-full xl:flex-1 xl:min-w-0">
            <LineAreaChartCard
                variant="customersOverview"
                title={title}
                stats={stats}
                ranges={ranges}
                activeRange={activeRange}
                onRangeChange={onRangeChange}
                activeStat={activeStat}
                onStatChange={onStatChange}
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
            />
        </div>
    );
};

export default OverviewChart;