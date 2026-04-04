import React from 'react'
import { BarChart } from '@mui/x-charts/BarChart';

const UserReport = () => {
    return (
        <div className='w-96.5 h-115 py-5 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg'>
            <div className='w-full h-14.25 px-5 flex justify-between'>
                <div className='max-w-35.25 min-h-14.25 '>
                    <span className='text-[#6467F2] text-[14px] tracking-[-0.02em]'>User in last 30 minutes</span>
                    <h2 className='text-[32px] font-bold text-[#23272E] dark:text-[#c1c6cf] mt-2 tracking-[-0.02em] leading-8'>21.5K</h2>
                </div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 14C9.46957 14 8.96086 14.2107 8.58579 14.5858C8.21071 14.9609 8 15.4696 8 16C8 16.5304 8.21071 17.0391 8.58579 17.4142C8.96086 17.7893 9.46957 18 10 18C10.5304 18 11.0391 17.7893 11.4142 17.4142C11.7893 17.0391 12 16.5304 12 16C12 15.4696 11.7893 14.9609 11.4142 14.5858C11.0391 14.2107 10.5304 14 10 14ZM10 8C9.46957 8 8.96086 8.21071 8.58579 8.58579C8.21071 8.96086 8 9.46957 8 10C8 10.5304 8.21071 11.0391 8.58579 11.4142C8.96086 11.7893 9.46957 12 10 12C10.5304 12 11.0391 11.7893 11.4142 11.4142C11.7893 11.0391 12 10.5304 12 10C12 9.46957 11.7893 8.96086 11.4142 8.58579C11.0391 8.21071 10.5304 8 10 8ZM8 4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2C10.5304 2 11.0391 2.21071 11.4142 2.58579C11.7893 2.96086 12 3.46957 12 4C12 4.53043 11.7893 5.03914 11.4142 5.41421C11.0391 5.78929 10.5304 6 10 6C9.46957 6 8.96086 5.78929 8.58579 5.41421C8.21071 5.03914 8 4.53043 8 4Z" fill="#6A717F" />
                </svg>
            </div>

            <p className='text-[14px] tracking-[-0.02em] font-medium text-[#6A717F] mt-6.25 px-5 mb-3'>Users per minute</p>

            <div className='w-full px-5 h-8.75'>
                <BarChart
                    xAxis={[
                        {
                            id: 'barCategories',
                            data: ['1Minute', '2Minutes', '3Minutes', "4Minutes", "5Minutes", "6Minutes", "7Minutes", "8Minutes", "9Minutes", "10Minutes", "11Minutes", "12Minutes", "13Minutes", "14Minutes", "15Minutes", "16Minutes", "17Minutes", "18Minutes", "19Minutes", "20Minutes", "21Minutes", "22Minutes", "23Minutes", "24Minutes", "25Minutes", "26Minutes", "27Minutes", "28Minutes", "29Minutes", "30Minutes"],
                            height: -2,
                            hidexAxis: true,
                        },
                    ]}
                    series={[
                        {
                            data: [2, 5, 3, 8, 6, 4, 7, 9, 1, 5, 3, 8, 6, 4, 7, 9, 1, 5, 3, 8, 6, 4, 7, 9, 1, 5, 3, 8, 6, 4],
                            color: '#4EA674',

                        },
                    ]}
                    height={35}
                    width={340}
                    margin={{ left: -46, right: 0, top: 0, bottom: 0 }}
                    hideYScale={true}
                    sx={{
                        '& .MuiBarElement-root': {
                            rx: 2, // 2px border radius for all bars
                        },
                    }}
                />
            </div>

            {/* Sales by Country Header */}
            <div className='flex px-5 justify-between mt-6 '>
                <h3 className='text-[15px] font-semibold text-[#222] dark:text-white'>Sales by Country</h3>
                <h3 className='text-[15px] font-semibold text-[#222] dark:text-white'>Sales</h3>
            </div>

            <div className='relative'>
                <img src="/src/assets/Rectangle.png" alt="" className='absolute top-0 left-0 w-full h-full object-cover' />

                {/* Country Sales Rows */}
                <div
                    className='py-1 px-5'
                // style={{ backgroundImage: "url('/src/assets/Rectangle.png')", backgroundRepeat: 'no-repeat', backgroundSize: '336px 60px' }}
                >

                    {/* US */}
                    <div className='flex items-center mb-5 justify-between'>
                        <div className='flex items-center gap-2'>
                            {/* US Flag */}
                            <span className='w-8.5 h-8.5 rounded-full overflow-hidden flex items-center justify-center border border-gray-200'>
                                <img src='https://flagcdn.com/us.svg' alt='US' className='w-full h-full object-cover' />
                            </span>
                            <span className='font-semibold text-[#222] dark:text-white text-[15px]'>US</span>
                        </div>
                        <div className='flex-1 mx-3'>
                            <div className='w-full bg-gray-100 h-2 rounded-full'>
                                <div className='bg-[#6467F2] h-2 rounded-full' style={{ width: '80%' }}></div>
                            </div>
                        </div>
                        <div className='flex flex-col items-end min-w-17.5'>
                            <span className='font-semibold text-[15px] text-[#222] dark:text-white'>30k</span>
                            <span className='flex items-center text-xs text-[#4EA674] font-medium mt-0.5'>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className='mr-0.5'><path d="M5 8V2M5 2L2 5M5 2L8 5" stroke="#4EA674" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                25.8%
                            </span>
                        </div>
                    </div>
                    {/* Brazil */}
                    <div className='flex items-center mb-5 justify-between'>
                        <div className='flex items-center gap-2'>
                            {/* Brazil Flag */}
                            <span className='w-8.5 h-8.5 rounded-full overflow-hidden flex items-center justify-center border border-gray-200'>
                                <img src='https://flagcdn.com/br.svg' alt='Brazil' className='w-full h-full object-cover' />
                            </span>
                            <span className='font-semibold text-[#222] dark:text-white text-[15px]'>Brazil</span>
                        </div>
                        <div className='flex-1 mx-3'>
                            <div className='w-full bg-gray-100 h-2 rounded-full'>
                                <div className='bg-[#6467F2] h-2 rounded-full' style={{ width: '80%' }}></div>
                            </div>
                        </div>
                        <div className='flex flex-col items-end min-w-17.5'>
                            <span className='font-semibold text-[15px] text-[#222] dark:text-white'>30k</span>
                            <span className='flex items-center text-xs text-[#F25767] font-medium mt-0.5'>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className='mr-0.5'><path d="M5 2v6M5 8l3-3M5 8L2 5" stroke="#F25767" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                15.8%
                            </span>
                        </div>
                    </div>
                    {/* Australia */}
                    <div className='flex items-center mb-5 justify-between'>
                        <div className='flex items-center gap-2'>
                            {/* Australia Flag */}
                            <span className='w-8.5 h-8.5 rounded-full overflow-hidden flex items-center justify-center border border-gray-200'>
                                <img src='https://flagcdn.com/au.svg' alt='Australia' className='w-full h-full object-cover' />
                            </span>
                            <span className='font-semibold text-[#222] dark:text-white text-[15px]'>Australia</span>
                        </div>
                        <div className='flex-1 mx-3'>
                            <div className='w-full bg-gray-100 h-2 rounded-full'>
                                <div className='bg-[#6467F2] h-2 rounded-full' style={{ width: '67%' }}></div>
                            </div>
                        </div>
                        <div className='flex flex-col items-end min-w-17.5'>
                            <span className='font-semibold text-[15px] text-[#222] dark:text-white'>25k</span>
                            <span className='flex items-center text-xs text-[#4EA674] font-medium mt-0.5'>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className='mr-0.5'><path d="M5 8V2M5 2L2 5M5 2L8 5" stroke="#4EA674" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                35.8%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Insight Button */}
            <div className='flex py-1 px-5 justify-center'>
                <button className='w-[90%] py-2 border border-[#6467F2] rounded-full text-[#6467F2] font-semibold text-[16px] hover:bg-[#6467F2] hover:text-white transition-colors duration-200'>
                    View Insight
                </button>
            </div>
        </div>
    )
}

export default UserReport;