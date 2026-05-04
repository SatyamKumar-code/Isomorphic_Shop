import React from 'react'
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { Button } from '@mui/material';
import DashboardCardMenu from './DashboardCardMenu';
import { getDashboardPeriodLabel, useDashboardCardData } from '../hooks/useDashboardCardData';


const TotalOrdersCard = ({
    title = "Total Orders",
}) => {
    const {
        cardSettings,
        summaryCards,
        availableYears,
        availableMonths,
        updateCardSettings,
    } = useDashboardCardData();

    const displayCard = summaryCards.find((card) => card.title === title) || {};

    const cardData = {
        title: displayCard.title || title,
        periodLabel: getDashboardPeriodLabel(cardSettings),
        value: displayCard.value || "0",
        change: displayCard.change || "0.0%",
        changeColor: displayCard.changeColor || "#21C45D",
        changeDirection: displayCard.changeDirection || "up",
        previousValue: displayCard.previousValue || "0",
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
            <h1 className='text-[#23272E] dark:text-[#c1c6cf] font-bold text-[18px] font-lato'>{cardData.title}</h1>
            <p className='text-[#6A717F] text-[14px] leading-normal tracking-[-0.02em] font-lato mb-3 '>{cardData.periodLabel}</p>
            <div className='min-w-52 min-h-9.5 flex items-center gap-4'>
                <h2 className='text-[#23272E] dark:text-[#c1c6cf] font-bold text-[32px] leading-normal font-lato'>{cardData.value}</h2>
                <div className='min-w-23.75 min-h-4.75 flex gap-1 '>
                    <p className='text-[#000000] dark:text-[#c1c6cf] text-[14px] leading-normal tracking-[-0.02em] font-lato flex items-center gap-1 '>Orders</p>
                    <p className='text-[14px] leading-normal tracking-[-0.02em] font-lato flex items-center gap-1 ' style={{ color: cardData.changeColor }}>
                        {cardData.changeDirection === 'down' ? <FaArrowDown /> : <FaArrowUp />}
                        {cardData.change}
                    </p>
                </div>
            </div>

            <p className='text-[#6A717F] text-[14px] leading-normal tracking-normal font-lato'>vs previous period: <span className='text-[#6467F2]'>{cardData.previousValue} ({cardData.change})</span></p>

            <div className='flex justify-end mt-4 mb-5'>
                <Button variant="outlined" className='bg-[#6467F2] text-white text-[16px] tracking-[-0.02em] font-lato leading-6.5 rounded-full! normal-case!'>Details
                </Button>
            </div>
        </div>
    )
}

export default TotalOrdersCard;