import React from 'react'
import { FaArrowDown } from "react-icons/fa";
import { Button } from '@mui/material';
import DashboardCardMenu from './DashboardCardMenu';
import { getDashboardPeriodLabel, useDashboardCardData } from '../hooks/useDashboardCardData';


const PendingAndCanceledCard = ({
    title = "Pending & Canceled",
}) => {
    const {
        cardSettings,
        tabs,
        availableYears,
        availableMonths,
        updateCardSettings,
    } = useDashboardCardData();

    const pendingCount = tabs.find((tab) => tab.label === "Pending")?.count ?? 0;
    const canceledCount = tabs.find((tab) => tab.label === "Cancelled")?.count ?? 0;

    const cardData = {
        title,
        periodLabel: getDashboardPeriodLabel(cardSettings),
        value: `${pendingCount} / ${canceledCount}`,
        change: `${pendingCount} / ${canceledCount}`,
    };

    return (
        <div className='relative ml-5 my-4 p-5 gap-2 w-97.5 h-55.5 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg'>
            <DashboardCardMenu
                cardData={cardData}
                cardSettings={cardSettings}
                onSettingsChange={updateCardSettings}
                availableYears={availableYears}
                availableMonths={availableMonths}
            />
            <h1 className='text-[#23272E] dark:text-[#c1c6cf] font-bold text-[18px] font-lato'>{title}</h1>
            <p className='text-[#6A717F] text-[14px] leading-normal tracking-[-0.02em] font-lato mb-3 '>{cardData.periodLabel}</p>
            <div className='flex w-full items-center gap-4'>
                <div className='w-[50%] gap-1.75'>
                    <p className='text-[#6A717F] text-[14px] leading-normal tracking-[-0.02em] font-lato'>Pending</p>
                    <div className='min-w-27.25 min-h-6.5 flex gap-[3.5px] '>
                        <h2 className='text-[#23272E] dark:text-[#c1c6cf] font-bold text-[22px] leading-normal font-lato'>{String(pendingCount)}</h2>
                        <p className='text-[14px] leading-normal tracking-[-0.02em] font-lato flex items-center gap-1 ' style={{ color: '#21C45D' }}>{pendingCount}</p>
                    </div>
                </div>

                <div className='w-[50%] gap-1.75'>
                    <p className='text-[#6A717F] text-[14px] leading-normal tracking-[-0.02em] font-lato'>Canceled</p>
                    <div className='min-w-27.25 min-h-6.5 flex gap-2 '>
                        <h2 className='text-[#EF4343] dark:text-[#c1c6cf] font-bold text-[22px] leading-normal font-lato'>{String(canceledCount)}</h2>
                        <p className='text-[14px] leading-normal tracking-[-0.02em] font-lato flex items-center gap-1 ' style={{ color: '#F87272' }}><FaArrowDown />{canceledCount}</p>
                    </div>
                </div>
            </div>



            <div className='flex justify-end mt-4 mb-5'>
                <Button variant="outlined" className='bg-[#6467F2] text-white text-[16px] tracking-[-0.02em] font-lato leading-6.5 rounded-full! normal-case!'>Details
                </Button>
            </div>
        </div>
    )
}

export default PendingAndCanceledCard;