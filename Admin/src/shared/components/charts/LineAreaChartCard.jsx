import React, { useMemo, useRef, useState } from "react";
import { FiMoreVertical } from "react-icons/fi";

const mergeClasses = (...classes) => classes.filter(Boolean).join(" ");
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const HOVER_LINE_TOLERANCE = 18;

const buildSmoothLinePath = (coords) => {
    if (!coords.length) {
        return "";
    }

    if (coords.length === 1) {
        const [{ x, y }] = coords;
        return `M ${x} ${y}`;
    }

    if (coords.length === 2) {
        const [start, end] = coords;
        return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    }

    const path = [`M ${coords[0].x} ${coords[0].y}`];

    for (let index = 0; index < coords.length - 1; index += 1) {
        const current = coords[index];
        const next = coords[index + 1];
        const previous = coords[index - 1] || current;
        const afterNext = coords[index + 2] || next;

        const controlPoint1X = current.x + (next.x - previous.x) / 6;
        const controlPoint1Y = current.y + (next.y - previous.y) / 6;
        const controlPoint2X = next.x - (afterNext.x - current.x) / 6;
        const controlPoint2Y = next.y - (afterNext.y - current.y) / 6;

        path.push(`C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${next.x} ${next.y}`);
    }

    return path.join(" ");
};

const buildAreaPath = (points, width, height, paddingX, paddingTop, paddingBottom, yDomainMin, yDomainMax) => {
    if (!points.length) {
        return { line: "", area: "", coords: [] };
    }

    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingTop - paddingBottom;
    const dataMax = Math.max(...points);
    const dataMin = Math.min(...points);
    const max = typeof yDomainMax === "number" ? Math.max(yDomainMax, dataMax) : dataMax;
    const min = typeof yDomainMin === "number" ? Math.min(yDomainMin, dataMin) : dataMin;
    const range = max - min || 1;
    const xStep = points.length > 1 ? plotWidth / (points.length - 1) : 0;

    const coords = points.map((point, index) => ({
        x: paddingX + xStep * index,
        y: paddingTop + plotHeight - ((point - min) / range) * plotHeight,
    }));

    const line = buildSmoothLinePath(coords);
    const area = `${line} L ${paddingX + plotWidth} ${height - paddingBottom} L ${paddingX} ${height - paddingBottom} Z`;

    return { line, area, coords };
};

const moreIcon = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 14C9.46957 14 8.96086 14.2107 8.58579 14.5858C8.21071 14.9609 8 15.4696 8 16C8 16.5304 8.21071 17.0391 8.58579 17.4142C8.96086 17.7893 9.46957 18 10 18C10.5304 18 11.0391 17.7893 11.4142 17.4142C11.7893 17.0391 12 16.5304 12 16C12 15.4696 11.7893 14.9609 11.4142 14.5858C11.0391 14.2107 10.5304 14 10 14ZM10 8C9.46957 8 8.96086 8.21071 8.58579 8.58579C8.21071 8.96086 8 9.46957 8 10C8 10.5304 8.21071 11.0391 8.58579 11.4142C8.96086 11.7893 9.46957 12 10 12C10.5304 12 11.0391 11.7893 11.4142 11.4142C11.7893 11.0391 12 10.5304 12 10C12 9.46957 11.7893 8.96086 11.4142 8.58579C11.0391 8.21071 10.5304 8 10 8ZM8 4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2C10.5304 2 11.0391 2.21071 11.4142 2.58579C11.7893 2.96071 12 3.46957 12 4C12 4.53043 11.7893 5.03914 11.4142 5.41421C11.0391 5.78929 10.5304 6 10 6C9.46957 6 8.96086 5.78929 8.58579 5.41421C8.21071 5.03914 8 4.53043 8 4Z" fill="currentColor" />
    </svg>
);

const SHARED_AREA_CHART_PRESET = {
    outerClassName: "p-4 h-full bg-white shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg",
    headerClassName: "mb-4 flex items-start justify-between gap-3",
    titleClassName: "text-[18px] font-semibold text-slate-900 dark:text-slate-50",
    actionsClassName: "flex items-start gap-2",
    rangeGroupClassName: "flex items-center gap-1 rounded-xl p-1",
    rangeWrapperClassName: "flex items-center gap-2",
    rangeButtonBaseClassName: "rounded-lg px-3 py-2 text-[12px] font-medium transition",
    activeRangeButtonClassName: "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300",
    inactiveRangeButtonClassName: "border border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-300",
    chartContainerClassName: "relative overflow-hidden rounded-xl",
    chartBackgroundClassName: "bg-linear-to-b from-emerald-50/70 to-white dark:from-emerald-950/20 dark:to-gray-950",
    chartClassName: "h-full w-full",
    yAxisClassName: "text-[10px] fill-slate-400 dark:fill-slate-500",
    xAxisClassName: "text-[10px] fill-slate-400 dark:fill-slate-500",
    lineColor: "#4EA674",
    areaFill: "rgba(74, 166, 116, 0.12)",
    pointFill: "#d1ead7",
    activePointFill: "#4EA674",
    pointStroke: "#4EA674",
    activePointStroke: "#fff",
    pointRadius: 3,
    activePointRadius: 5,
    pointStrokeWidth: 2,
    yAxisLabelX: 0,
    tooltipClassName: "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-[12px] text-emerald-900 shadow-sm",
    tooltipTitleClassName: "font-medium",
    tooltipValueClassName: "",
    tooltipConnectorClassName: "mx-auto mt-1 h-22 w-px border-l border-dashed border-emerald-300",
    tooltipWrapperClassName: "pointer-events-none absolute -translate-x-1/2 -translate-y-full",
    tooltipTransform: "translate(0%, -10%)",
};

const STYLE_PRESETS = {
    default: {
        ...SHARED_AREA_CHART_PRESET,
        statsClassName: "grid gap-3",
        statItemClassName: "flex flex-col justify-between gap-2",
        statValueClassName: "text-[22px] font-semibold text-slate-900 dark:text-slate-50",
        statLabelClassName: "text-[12px] text-slate-500 dark:text-slate-400",
    },
    dashboardWeekly: {
        ...SHARED_AREA_CHART_PRESET,
        headerClassName: "w-full min-h-9.5 gap-8 flex items-center justify-between",
        titleClassName: "w-full max-w-118.5 text-[18px] text-[#23272E] dark:text-[#c1c6cf] font-bold leading-4.5",
        rangeWrapperClassName: "flex items-center gap-2",
        rangeGroupClassName: "flex min-w-41.25 min-h-9.5 p-1 gap-1 items-center justify-center bg-[#EAF8E7] rounded-xl",
        rangeButtonBaseClassName: "py-2 px-3 rounded-lg font-medium text-[12px]",
        activeRangeButtonClassName: "bg-white text-[#4EA674]",
        inactiveRangeButtonClassName: "text-[#6A717F]",
        statsClassName: "w-full min-h-[78px] gap-5 flex items-center my-5",
        statItemClassName: "flex flex-col text-[24px] w-full justify-between gap-2 border-b-3",
        activeStatItemClassName: "border-b-2 border-[#4EA674]",
        inactiveStatItemClassName: "border-transparent ",
        statValueClassName: "text-6 font-bold text-[#23272E] dark:text-[#c1c6cf]",
        statLabelClassName: "text-[#8B909A] text-[13px] font-medium leading-4.5 tracking-[-0.02em]",
        chartContainerClassName: "relative my-1 w-full min-h-[210px]",
        chartBackgroundClassName: "rounded-xl bg-white dark:bg-gray-950",
        chartClassName: "h-[265px] w-[104%] -ml-2.5",
        yAxisClassName: "text-[10px] fill-[#8B909A] dark:fill-[#c1c6cf]",
        xAxisClassName: "text-[10px] fill-[#8B909A] dark:fill-[#c1c6cf]",
        lineColor: "#4EA674",
        areaFill: "rgba(111, 207, 151, 0.20)",
        yAxisLabelX: -3,
        xAxisLabelY: 244,
        paddingX: 25,
        showPoints: true,
    },
    customersOverview: {
        ...SHARED_AREA_CHART_PRESET,
        rangeWrapperClassName: "flex items-start gap-2",
        headerClassName: "mb-2 flex items-start justify-between gap-3",
        rangeGroupClassName: "flex items-start gap-2",
        rangeButtonBaseClassName: "rounded-full px-3 py-1 text-[12px] font-medium",
        statsClassName: "mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4",
        statItemClassName: "flex flex-col text-[24px] w-full justify-between gap-2 border-b-3",
        activeStatItemClassName: "border-b-2 border-[#4EA674]",
        inactiveStatItemClassName: "border-transparent",
        statValueClassName: "text-[22px] font-semibold text-slate-900 dark:text-slate-50",
        statLabelClassName: "text-[12px] text-slate-500 dark:text-slate-400",
        chartContainerClassName: "relative mt-2 h-65 overflow-hidden rounded-xl",
        chartBackgroundClassName: "bg-linear-to-b from-emerald-50/70 to-white dark:from-emerald-950/20 dark:to-gray-950",
        chartClassName: "h-full w-full",
        paddingX: 10,
        yAxisLabelX: -23,
        xAxisLabelY: 244,
        tooltipConnectorClassName: "mx-auto mt-1 h-22 w-px border-l border-dashed border-emerald-300",
    },
};

const LineAreaChartCard = ({
    variant = "default",
    title,
    stats = [],
    ranges = [],
    activeRange,
    onRangeChange,
    showMoreIcon = true,
    chartData = [],
    xLabels = [],
    xLabelPositions,
    yLabels = [],
    yLabelPositions,
    activePointIndex,
    tooltip,
    onMoreClick,
    moreMenuContent,
    isMoreMenuOpen = false,
    width = 720,
    height = 250,
    paddingX,
    paddingTop = 18,
    paddingBottom = 28,
    lineColor,
    areaFill,
    pointFill,
    activePointFill,
    pointStroke,
    activePointStroke,
    showPoints,
    outerClassName,
    headerClassName,
    titleClassName,
    actionsClassName,
    rangeGroupClassName,
    rangeWrapperClassName,
    rangeButtonBaseClassName,
    activeRangeButtonClassName,
    inactiveRangeButtonClassName,
    statsClassName,
    statItemClassName,
    activeStatItemClassName,
    inactiveStatItemClassName,
    statValueClassName,
    statLabelClassName,
    chartContainerClassName,
    chartBackgroundClassName,
    chartClassName,
    yAxisClassName,
    xAxisClassName,
    pointRadius,
    activePointRadius,
    pointStrokeWidth,
    xAxisLabelY,
    yAxisLabelX,
    yAxisLabelValueFormatter,
    yDomainMin,
    yDomainMax,
    xAxisLabelFormatter,
    tooltipClassName,
    tooltipTitleClassName,
    tooltipValueClassName,
    tooltipConnectorClassName,
    tooltipWrapperClassName,
    activeStat,
    onStatChange,
    enableHoverTooltip = true,
    tooltipTitleFormatter,
    tooltipValueFormatter,
}) => {
    const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
    const [hoverPosition, setHoverPosition] = useState(null);
    const svgRef = useRef(null);

    const preset = STYLE_PRESETS[variant] || STYLE_PRESETS.default;
    const resolvedOuterClassName = outerClassName ?? preset.outerClassName;
    const resolvedHeaderClassName = headerClassName ?? preset.headerClassName;
    const resolvedTitleClassName = titleClassName ?? preset.titleClassName;
    const resolvedActionsClassName = actionsClassName ?? preset.actionsClassName;
    const resolvedRangeGroupClassName = rangeGroupClassName ?? preset.rangeGroupClassName;
    const resolvedRangeWrapperClassName = rangeWrapperClassName ?? preset.rangeWrapperClassName;
    const resolvedRangeButtonBaseClassName = rangeButtonBaseClassName ?? preset.rangeButtonBaseClassName;
    const resolvedActiveRangeButtonClassName = activeRangeButtonClassName ?? preset.activeRangeButtonClassName;
    const resolvedInactiveRangeButtonClassName = inactiveRangeButtonClassName ?? preset.inactiveRangeButtonClassName;
    const resolvedStatsClassName = statsClassName ?? preset.statsClassName;
    const resolvedStatItemClassName = statItemClassName ?? preset.statItemClassName;
    const resolvedActiveStatItemClassName = activeStatItemClassName ?? preset.activeStatItemClassName;
    const resolvedInactiveStatItemClassName = inactiveStatItemClassName ?? preset.inactiveStatItemClassName;
    const resolvedStatValueClassName = statValueClassName ?? preset.statValueClassName;
    const resolvedStatLabelClassName = statLabelClassName ?? preset.statLabelClassName;
    const resolvedChartContainerClassName = chartContainerClassName ?? preset.chartContainerClassName;
    const resolvedChartBackgroundClassName = chartBackgroundClassName ?? preset.chartBackgroundClassName;
    const resolvedChartClassName = chartClassName ?? preset.chartClassName;
    const resolvedYAxisClassName = yAxisClassName ?? preset.yAxisClassName;
    const resolvedXAxisClassName = xAxisClassName ?? preset.xAxisClassName;
    const resolvedLineColor = lineColor ?? preset.lineColor;
    const resolvedAreaFill = areaFill ?? preset.areaFill;
    const resolvedPointFill = pointFill ?? preset.pointFill;
    const resolvedActivePointFill = activePointFill ?? preset.activePointFill;
    const resolvedPointStroke = pointStroke ?? preset.pointStroke;
    const resolvedActivePointStroke = activePointStroke ?? preset.activePointStroke;
    const resolvedShowPoints = showPoints ?? preset.showPoints ?? true;
    const resolvedPointRadius = pointRadius ?? preset.pointRadius;
    const resolvedActivePointRadius = activePointRadius ?? preset.activePointRadius;
    const resolvedPointStrokeWidth = pointStrokeWidth ?? preset.pointStrokeWidth;
    const resolvedTooltipClassName = tooltipClassName ?? preset.tooltipClassName;
    const resolvedTooltipTitleClassName = tooltipTitleClassName ?? preset.tooltipTitleClassName;
    const resolvedTooltipValueClassName = tooltipValueClassName ?? preset.tooltipValueClassName;
    const resolvedTooltipConnectorClassName = tooltipConnectorClassName ?? preset.tooltipConnectorClassName;
    const resolvedTooltipWrapperClassName = tooltipWrapperClassName ?? preset.tooltipWrapperClassName;
    const resolvedTooltipTransform = preset.tooltipTransform;
    const resolvedPaddingX = paddingX ?? preset.paddingX ?? 24;

    const { line, area, coords } = buildAreaPath(chartData, width, height, resolvedPaddingX, paddingTop, paddingBottom, yDomainMin, yDomainMax);
    const resolvedXAxisLabelY = xAxisLabelY ?? preset.xAxisLabelY ?? height - 16;
    const resolvedYAxisLabelX = yAxisLabelX ?? preset.yAxisLabelX;
    const hoveredPoint = hoveredPointIndex !== null ? coords[hoveredPointIndex] : null;

    const xPositions =
        xLabelPositions ??
        (xLabels.length === coords.length && coords.length > 0
            ? coords.map((point) => point.x)
            : xLabels.map((_, index) => resolvedPaddingX + (xLabels.length > 1 ? ((width - resolvedPaddingX * 2) / (xLabels.length - 1)) * index : 0)));

    const yPositions =
        yLabelPositions ??
        yLabels.map((_, index) => {
            if (yLabels.length <= 1) {
                return height / 2;
            }

            const step = (height - paddingTop - paddingBottom) / (yLabels.length - 1);
            return height - paddingBottom - step * index;
        });

    const interactivePointIndex = hoveredPointIndex ?? activePointIndex;

    const handleChartMouseMove = (event) => {
        if (!enableHoverTooltip || !coords.length || !svgRef.current) {
            return;
        }

        const rect = svgRef.current.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            return;
        }

        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;
        const svgX = (pointerX / rect.width) * width;
        const svgY = (pointerY / rect.height) * height;

        const plotLeft = resolvedPaddingX;
        const plotRight = width - resolvedPaddingX;
        const plotTop = paddingTop;
        const plotBottom = height - paddingBottom;

        if (svgX < plotLeft || svgX > plotRight || svgY < plotTop || svgY > plotBottom) {
            setHoveredPointIndex(null);
            setHoverPosition(null);
            return;
        }

        let segmentIndex = 0;
        for (let index = 0; index < coords.length - 1; index += 1) {
            if (svgX >= coords[index].x && svgX <= coords[index + 1].x) {
                segmentIndex = index;
                break;
            }
        }

        const leftPoint = coords[segmentIndex];
        const rightPoint = coords[Math.min(segmentIndex + 1, coords.length - 1)];
        const segmentWidth = rightPoint.x - leftPoint.x || 1;
        const ratio = clamp((svgX - leftPoint.x) / segmentWidth, 0, 1);
        const lineYAtX = leftPoint.y + (rightPoint.y - leftPoint.y) * ratio;

        if (svgY < lineYAtX - HOVER_LINE_TOLERANCE) {
            setHoveredPointIndex(null);
            setHoverPosition(null);
            return;
        }

        let nearestIndex = 0;
        let nearestDistance = Infinity;

        coords.forEach((point, index) => {
            const distance = Math.abs(point.x - svgX);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = index;
            }
        });

        setHoveredPointIndex(nearestIndex);
        setHoverPosition({
            left: `${clamp(pointerX, 24, rect.width - 24)}px`,
            top: `${clamp(pointerY, 18, rect.height - 18)}px`,
        });
    };

    const handleChartMouseLeave = () => {
        setHoveredPointIndex(null);
        setHoverPosition(null);
    };

    const resolvedTooltip = useMemo(() => {
        if (hoveredPointIndex === null || !coords[hoveredPointIndex]) {
            return tooltip;
        }

        const point = coords[hoveredPointIndex];
        const rawTitle = xLabels[hoveredPointIndex] ?? `Point ${hoveredPointIndex + 1}`;
        const rawValue = chartData[hoveredPointIndex];

        return {
            title: tooltipTitleFormatter ? tooltipTitleFormatter(rawTitle, hoveredPointIndex) : rawTitle,
            value: tooltipValueFormatter
                ? tooltipValueFormatter(rawValue, hoveredPointIndex)
                : typeof rawValue === "number"
                    ? rawValue.toLocaleString()
                    : rawValue,
            left: hoverPosition?.left ?? `${(point.x / width) * 100}%`,
            top: hoverPosition?.top ?? `${(point.y / height) * 100}%`,
            style: {
                transform: resolvedTooltipTransform,
            },
            connectorClassName: "hidden",
        };
    }, [hoveredPointIndex, coords, xLabels, chartData, tooltip, tooltipTitleFormatter, tooltipValueFormatter, width, height, hoverPosition, resolvedTooltipTransform]);

    return (
        <div className={resolvedOuterClassName}>
            <div className={resolvedHeaderClassName}>
                <h3 className={resolvedTitleClassName}>{title}</h3>

                <div className={mergeClasses("relative", resolvedActionsClassName, resolvedRangeWrapperClassName)}>
                    {ranges.length > 0 && (
                        <div className={resolvedRangeGroupClassName}>
                            {ranges.map((range) => {
                                const isActive = activeRange === range.value;

                                return (
                                    <button
                                        key={range.value}
                                        type="button"
                                        className={mergeClasses(resolvedRangeButtonBaseClassName, isActive ? resolvedActiveRangeButtonClassName : resolvedInactiveRangeButtonClassName)}
                                        onClick={onRangeChange ? () => onRangeChange(range.value) : undefined}
                                        disabled={!onRangeChange}
                                    >
                                        {range.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {showMoreIcon && (
                        <button
                            type="button"
                            className="chart-more-menu-trigger mt-1 text-black dark:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="More options"
                            onClick={onMoreClick}
                            disabled={!onMoreClick}
                        >
                            {moreIcon}
                        </button>
                    )}

                    {isMoreMenuOpen && moreMenuContent ? (
                        <div className="chart-more-menu absolute right-0 top-full z-30 mt-2 min-w-44 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950">
                            {moreMenuContent}
                        </div>
                    ) : null}
                </div>
            </div>

            {stats.length > 0 && (
                <div className={resolvedStatsClassName}>
                    {stats.map((stat) => {
                        const statKey = stat.key ?? stat.valueKey ?? stat.label;
                        const isActiveStat = activeStat === statKey;
                        const isStatInteractive = Boolean(onStatChange);
                        const statItemClass = mergeClasses(
                            resolvedStatItemClassName,
                            isStatInteractive ? "cursor-pointer border-0 bg-transparent p-0 text-left transition" : "",
                            isActiveStat ? resolvedActiveStatItemClassName : resolvedInactiveStatItemClassName,
                            stat.className,
                        );

                        if (isStatInteractive) {
                            return (
                                <button
                                    key={statKey}
                                    type="button"
                                    className={statItemClass}
                                    onClick={() => onStatChange(statKey)}
                                    aria-pressed={isActiveStat}
                                >
                                    <span className={mergeClasses(resolvedStatValueClassName, stat.valueClassName)}>{stat.value}</span>
                                    <span className={mergeClasses(resolvedStatLabelClassName, stat.labelClassName)}>{stat.label}</span>
                                </button>
                            );
                        }

                        return (
                            <div key={statKey} className={statItemClass}>
                                <span className={mergeClasses(resolvedStatValueClassName, stat.valueClassName)}>{stat.value}</span>
                                <span className={mergeClasses(resolvedStatLabelClassName, stat.labelClassName)}>{stat.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className={mergeClasses(resolvedChartContainerClassName, resolvedChartBackgroundClassName)}>
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${width} ${height}`}
                    className={resolvedChartClassName}
                    onMouseMove={handleChartMouseMove}
                    onMouseLeave={handleChartMouseLeave}
                >
                    {yLabels.length > 0 && (
                        <g>
                            {yLabels.map((label, index) => (
                                <text key={`${label}-${index}`} x={resolvedYAxisLabelX} y={yPositions[index]} className={resolvedYAxisClassName}>
                                    {yAxisLabelValueFormatter ? yAxisLabelValueFormatter(label, index) : label}
                                </text>
                            ))}
                        </g>
                    )}

                    {area && <path d={area} fill={resolvedAreaFill} />}
                    {line && (
                        <path
                            d={line}
                            fill="none"
                            stroke={resolvedLineColor}
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                    )}

                    {hoveredPoint && (
                        <line
                            x1={hoveredPoint.x}
                            y1={paddingTop}
                            x2={hoveredPoint.x}
                            y2={height - paddingBottom}
                            stroke={resolvedLineColor}
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.35"
                        />
                    )}

                    {resolvedShowPoints &&
                        coords.map((point, index) => {
                            const isActive = index === interactivePointIndex;
                            const shouldRenderPoint = hoveredPointIndex !== null && isActive;

                            if (!shouldRenderPoint) {
                                return null;
                            }

                            return (
                                <circle
                                    key={`${point.x}-${point.y}`}
                                    cx={point.x}
                                    cy={point.y}
                                    r={isActive ? resolvedActivePointRadius : resolvedPointRadius}
                                    fill={isActive ? resolvedActivePointFill : resolvedPointFill}
                                    stroke={isActive ? resolvedActivePointStroke : resolvedPointStroke}
                                    strokeWidth={resolvedPointStrokeWidth}
                                />
                            );
                        })}

                    {xLabels.length > 0 &&
                        xLabels.map((label, index) => (
                            <text key={label} x={xPositions[index]} y={resolvedXAxisLabelY} textAnchor="middle" className={resolvedXAxisClassName}>
                                {xAxisLabelFormatter ? xAxisLabelFormatter(label, index) : label}
                            </text>
                        ))}
                </svg>

                {resolvedTooltip && (
                    <div
                        className={mergeClasses(resolvedTooltipWrapperClassName, resolvedTooltip.className)}
                        style={{ left: resolvedTooltip.left, top: resolvedTooltip.top, ...resolvedTooltip.style }}
                    >
                        <div className={resolvedTooltipClassName}>
                            <div className={resolvedTooltipTitleClassName}>{resolvedTooltip.title}</div>
                            <div className={resolvedTooltipValueClassName}>{resolvedTooltip.value}</div>
                        </div>
                        <div className={mergeClasses(resolvedTooltipConnectorClassName, resolvedTooltip.connectorClassName)} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LineAreaChartCard;