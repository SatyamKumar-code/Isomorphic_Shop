import React from 'react'
import Badge from '@mui/material/Badge';
import DarkModeToggle from './DarkModeToggelButton';
import { useAuth } from '../../Context/auth/useAuth';

const Header = ({ title = 'Dashboard', searchPlaceholder = 'Search data, users, or reports' }) => {
  const { userData } = useAuth();
  const accessMode = userData?.accessMode || (userData?.role === 'admin' ? 'admin-global' : userData?.role === 'seller' ? 'seller-scoped' : 'user');
  const isGlobalAdmin = accessMode === 'admin-global';

  return (
    <div>
      <header className='header h-24 ml-65 w-[calc(100%-217px)] flex items-center justify-between pl-5 pr-11 py-3 bg-white dark:bg-gray-950 dark:shadow-md  shadow-md shadow-gray-300 dark:shadow-gray-700' >
        <h2 className='font-bold text-black dark:text-white'>{title}</h2>

        <div className='flex items-center md:gap-4 lg:gap-8'>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${isGlobalAdmin ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
            {isGlobalAdmin ? 'Admin Global' : 'Seller Scoped'}
          </span>

          <div className='p-1.5 flex items-center justify-between pr-4 pl-6 lg:w-101.75  h-12 rounded-full bg-[#e7e8e8] dark:bg-[#f7fafa52] focus:outline-none focus:ring-2 focus:ring-blue-500'>
            <input type='text' placeholder={searchPlaceholder} className='bg-transparent w-full text-[#4B5563] dark:text-white border-none focus:outline-none' />
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.3269 14.44L18.8 17.8M17.68 8.84C17.68 13.1699 14.1699 16.68 9.84 16.68C5.51009 16.68 2 13.1699 2 8.84C2 4.51009 5.51009 1 9.84 1C14.1699 1 17.68 4.51009 17.68 8.84Z" stroke-width="2" stroke-linecap="round" className='stroke-[#4B5563] dark:stroke-white' />
            </svg>
          </div>
          <Badge color="error" badgeContent=" " variant="dot" overlap="circular" className='cursor-pointer'>
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.33333 17.5H11.6667C11.6667 18.4166 10.9167 19.1666 10 19.1666C9.08333 19.1666 8.33333 18.4166 8.33333 17.5ZM17.5 15.8333V16.6666H2.5V15.8333L4.16667 14.1666V9.16663C4.16667 6.58329 5.83333 4.33329 8.33333 3.58329V3.33329C8.33333 2.41663 9.08333 1.66663 10 1.66663C10.9167 1.66663 11.6667 2.41663 11.6667 3.33329V3.58329C14.1667 4.33329 15.8333 6.58329 15.8333 9.16663V14.1666L17.5 15.8333ZM14.1667 9.16663C14.1667 6.83329 12.3333 4.99996 10 4.99996C7.66667 4.99996 5.83333 6.83329 5.83333 9.16663V15H14.1667V9.16663Z" className='fill-[#4B5563] dark:fill-white' />
            </svg>
          </Badge>

          <DarkModeToggle />

          <img src="user.png" alt="" className='w-10 h-10' />
        </div>

      </header>
    </div>
  )
}

export default Header