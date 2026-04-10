import React from 'react'
import { FaArrowDown } from "react-icons/fa";
import { Button } from '@mui/material';


const PendingAndCanceledCard = ({
    title = "Pending & Canceled",
    periodLabel = "Last 7 days",
    pendingLabel = "Pending",
    pendingValue = "509",
    pendingChange = "user 204",
    pendingChangeColor = "#21C45D",
    canceledLabel = "Canceled",
    canceledValue = "94",
    canceledChange = "14.4%",
    canceledChangeColor = "#F87272",
}) => {
    return (
        <div className='ml-5 my-4 p-5 gap-2 w-97.5 h-55.5 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg'>
            <div className='w-full min-h-6.5 flex items-center justify-between'>
                <h1 className='text-[#23272E] dark:text-[#c1c6cf] font-bold text-[18px] font-lato'>{title}</h1>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 14C9.46957 14 8.96086 14.2107 8.58579 14.5858C8.21071 14.9609 8 15.4696 8 16C8 16.5304 8.21071 17.0391 8.58579 17.4142C8.96086 17.7893 9.46957 18 10 18C10.5304 18 11.0391 17.7893 11.4142 17.4142C11.7893 17.0391 12 16.5304 12 16C12 15.4696 11.7893 14.9609 11.4142 14.5858C11.0391 14.2107 10.5304 14 10 14ZM10 8C9.46957 8 8.96086 8.21071 8.58579 8.58579C8.21071 8.96086 8 9.46957 8 10C8 10.5304 8.21071 11.0391 8.58579 11.4142C8.96086 11.7893 9.46957 12 10 12C10.5304 12 11.0391 11.7893 11.4142 11.4142C11.7893 11.0391 12 10.5304 12 10C12 9.46957 11.7893 8.96086 11.4142 8.58579C11.0391 8.21071 10.5304 8 10 8ZM8 4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2C10.5304 2 11.0391 2.21071 11.4142 2.58579C11.7893 2.96086 12 3.46957 12 4C12 4.53043 11.7893 5.03914 11.4142 5.41421C11.0391 5.78929 10.5304 6 10 6C9.46957 6 8.96086 5.78929 8.58579 5.41421C8.21071 5.03914 8 4.53043 8 4Z" fill="#6A717F" />
                </svg>
            </div>
            <p className='text-[#6A717F] text-[14px] leading-normal tracking-[-0.02em] font-lato mb-3 '>{periodLabel}</p>
            <div className='flex w-full items-center gap-4'>
                <div className='w-[50%] gap-1.75'>
                    <p className='text-[#6A717F] text-[14px] leading-normal tracking-[-0.02em] font-lato'>{pendingLabel}</p>
                    <div className='min-w-27.25 min-h-6.5 flex gap-[3.5px] '>
                        <h2 className='text-[#23272E] dark:text-[#c1c6cf] font-bold text-[22px] leading-normal font-lato'>{pendingValue}</h2>
                        <p className='text-[14px] leading-normal tracking-[-0.02em] font-lato flex items-center gap-1 ' style={{ color: pendingChangeColor }}>{pendingChange}</p>
                    </div>
                </div>

                <div className='w-[50%] gap-1.75'>
                    <p className='text-[#6A717F] text-[14px] leading-normal tracking-[-0.02em] font-lato'>{canceledLabel}</p>
                    <div className='min-w-27.25 min-h-6.5 flex gap-2 '>
                        <h2 className='text-[#EF4343] dark:text-[#c1c6cf] font-bold text-[22px] leading-normal font-lato'>{canceledValue}</h2>
                        <p className='text-[14px] leading-normal tracking-[-0.02em] font-lato flex items-center gap-1 ' style={{ color: canceledChangeColor }}><FaArrowDown />{canceledChange}</p>
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