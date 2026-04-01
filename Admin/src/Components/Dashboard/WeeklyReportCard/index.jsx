import React from 'react';
import { LineChart, lineElementClasses } from '@mui/x-charts/LineChart';
import Box from '@mui/material/Box';
import './styles.css';

const margin = { right: 10 };
const uData = [17000, 25000, 21000, 14500, 19080, 19000, 13000];
const xLabels = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
];

// Calculate y-axis max as 30% more than the highest value in uData
const maxY = Math.ceil(Math.max(...uData) * 1.3);

const stats = [
    { value: '52k', label: 'Customers' },
    { value: '3.5k', label: 'Total Products' },
    { value: '2.5k', label: 'Stock Products' },
    { value: '0.5k', label: 'Out of Stock' },
    { value: '250k', label: 'Revenue' },
];

const WeeklyReportCard = () => {
    return (
        <div className="max-w-197.5 h-115 ml-5 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg p-6">
            <div className="w-full min-h-9.5 gap-8 flex items-center justify-between">
                <span className="w-full max-w-118.5 text-[18px] text-[#23272E] dark:text-[#c1c6cf] font-bold leading-4.5 ">Report for this week</span>
                <div className="flex items-center gap-2">
                    <div className="flex min-w-41.25 min-h-9.5 p-1 gap-1 items-center justify-center bg-[#EAF8E7] rounded-xl ">
                        <button className="bg-white text-[#4EA674] py-2 px-3 rounded-lg font-medium text-[12px] ">This week</button>
                        <button className=" text-[#6A717F] py-2 px-3 rounded-lg font-medium text-[12px] ">Last week</button>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 14C9.46957 14 8.96086 14.2107 8.58579 14.5858C8.21071 14.9609 8 15.4696 8 16C8 16.5304 8.21071 17.0391 8.58579 17.4142C8.96086 17.7893 9.46957 18 10 18C10.5304 18 11.0391 17.7893 11.4142 17.4142C11.7893 17.0391 12 16.5304 12 16C12 15.4696 11.7893 14.9609 11.4142 14.5858C11.0391 14.2107 10.5304 14 10 14ZM10 8C9.46957 8 8.96086 8.21071 8.58579 8.58579C8.21071 8.96086 8 9.46957 8 10C8 10.5304 8.21071 11.0391 8.58579 11.4142C8.96086 11.7893 9.46957 12 10 12C10.5304 12 11.0391 11.7893 11.4142 11.4142C11.7893 11.0391 12 10.5304 12 10C12 9.46957 11.7893 8.96086 11.4142 8.58579C11.0391 8.21071 10.5304 8 10 8ZM8 4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2C10.5304 2 11.0391 2.21071 11.4142 2.58579C11.7893 2.96086 12 3.46957 12 4C12 4.53043 11.7893 5.03914 11.4142 5.41421C11.0391 5.78929 10.5304 6 10 6C9.46957 6 8.96086 5.78929 8.58579 5.41421C8.21071 5.03914 8 4.53043 8 4Z" fill="black" />
                    </svg>
                </div>
            </div>

            <div className="w-full min-h-[78px] gap-5 flex items-center my-5">
                {stats.map((stat) => (
                    <div className="flex flex-col w-full justify-between gap-2 border-b-2 border-[#4EA674]" key={stat.label}>
                        <span className="text-6 font-bold text-[#23272E] dark:text-[#c1c6cf]">{stat.value}</span>
                        <span className="text-[#8B909A] text-[13px] font-medium leading-4.5 tracking-[-0.02em]">{stat.label}</span>
                    </div>
                ))}
            </div>

            <div className="my-5 w-full min-h-[298px]">
                {/* SVG gradient definition */}
                <svg width="0" height="0">
                    <defs>
                        <linearGradient id="myGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6FCF97" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#6FCF97" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>
                </svg>
                <Box sx={{ width: '104%', height: "265px", borderRadius: 2, marginLeft: -2.5 }} className="bg-white dark:bg-gray-950 ">
                    <LineChart
                        series={[{
                            data: uData,
                            area: true,
                            showMark: false,
                            valueFormatter: (v) => `${v / 1000}K`,
                        }]}
                        xAxis={[{ scaleType: 'point', data: xLabels, height: 28 }]}
                        yAxis={[{
                            min: 0,
                            max: maxY,
                            width: 35,
                            valueFormatter: (v) => `${v / 1000}K`,
                            tickNumber: 6,
                        }]}
                        sx={{
                            [`& .${lineElementClasses.root}`]: {
                                display: 'none',
                            },
                            '& .MuiChartsAxis-tickLabel': { fill: 'var(--chart-text-color) !important' },
                            '& .MuiChartsAxis-label': { fill: 'var(--chart-text-color) !important' },
                            '& .MuiChartsLegend-root': { color: 'var(--chart-text-color) !important' },
                            '& .MuiChartsTooltip-root': { color: 'var(--chart-text-color) !important' },
                            '& text': { fill: 'var(--chart-text-color) !important' },
                        }}
                        margin={margin}
                        slotProps={{
                            area: {
                                style: { fill: 'url(#myGradient)' }
                            }
                        }}
                    />
                </Box>
            </div>
        </div>
    );
};

export default WeeklyReportCard;
