import React from 'react'
import { FaArrowLeftLong } from "react-icons/fa6";
import { IoIosArrowForward } from 'react-icons/io';
import { FaBell } from "react-icons/fa";
import { GrLanguage } from "react-icons/gr";
import { MdOutlinePrivacyTip } from "react-icons/md";
import { MdHelpCenter } from "react-icons/md";
import { FcAbout } from "react-icons/fc";
import { Link } from 'react-router-dom';
import BackButton from '../components/backButton';

const Setting = () => {
    return (
        <div className='mt-5 w-full h-screen'>
            <div className='flex items-center'>
                <BackButton />
                <div className='justify-center flex items-center w-full'>
                    <h1 className='text-xl font-bold'>Setting</h1>
                </div>
            </div>
            <div>
                <h1 className='text-[16px] font-bold mt-5'>Account</h1>
                <div className='relative flex items-center mt-3 bg-gray-100 rounded-lg w-full'>
                    <img src="profile.png" className='w-15 h-15 rounded-full' />
                    <div className='ml-3'>
                        <h1 className='text-md font-bold'>Satyam kumar</h1>
                        <p className='text-gray-600'>satyamkumar@example.com</p>

                    </div>
                    <IoIosArrowForward className='absolute right-2 text-2xl text-gray-700' />
                </div>
                <hr className='my-3' />

                <h1 className='text-[16px] font-bold mt-5'>Setting</h1>

                <div className='relative flex mt-3   w-full justify-start items-center gap-3 bg-gray-100 p-3 rounded-lg'>
                    <FaBell className='text-xl text-gray-700' />
                    <h1 className='font-bold text-gray-700'>Notifcation</h1>
                    <IoIosArrowForward className='absolute right-2 text-2xl text-gray-700' />
                </div>

                <div className='relative flex mt-3 w-full justify-start items-center gap-3 bg-gray-100 p-3 rounded-lg'>
                    <GrLanguage className='text-xl text-gray-700' />
                    <h1 className='font-bold text-gray-700'>Language</h1>
                    <IoIosArrowForward className='absolute right-2 text-2xl text-gray-700' />

                </div>

                <div className='relative flex mt-3 w-full justify-start items-center gap-3 bg-gray-100 p-3 rounded-lg'>
                    <MdOutlinePrivacyTip className='text-xl text-gray-700' />
                    <h1 className='font-bold text-gray-700'>Privacy</h1>
                    <IoIosArrowForward className='absolute right-2 text-2xl text-gray-700' />
                </div>

                <h1 className='text-[16px] font-bold mt-5'>Payments</h1>

                <Link to="/refund-accounts" className='relative flex mt-3 w-full items-center gap-3 rounded-2xl bg-gray-100 p-4 transition hover:bg-gray-200'>
                    <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm'>
                        <FaBell className='text-xl text-gray-700' />
                    </div>
                    <div className='min-w-0 flex-1'>
                        <h1 className='font-bold text-gray-900'>Refund Accounts</h1>
                        <p className='text-sm text-gray-600'>Update bank details used for COD refunds</p>
                    </div>
                    <IoIosArrowForward className='shrink-0 text-2xl text-gray-700' />
                </Link>

                <div className='relative flex mt-3 w-full justify-start items-center gap-3 bg-gray-100 p-3 rounded-lg'>
                    <FcAbout className='text-xl text-gray-700' />
                    <h1 className='font-bold text-gray-700'>Help Center</h1>
                    <IoIosArrowForward className='absolute right-2 text-2xl text-gray-700' />
                </div>

                <div className='relative flex mt-3 w-full justify-start items-center gap-3 bg-gray-100 p-3 rounded-lg'>
                    <MdHelpCenter className='text-xl text-gray-700' />
                    <h1 className='font-bold text-gray-700'>About</h1>
                    <IoIosArrowForward className='absolute right-2 text-2xl text-gray-700' />
                </div>
            </div>

        </div>
    )
}

export default Setting