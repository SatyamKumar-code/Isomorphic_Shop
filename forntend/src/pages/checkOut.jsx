import React, { useState } from 'react'
import BackButton from '../components/backButton'
import { BiDotsVerticalRounded } from 'react-icons/bi'
import { MdWatchLater } from "react-icons/md";
import { Link } from 'react-router-dom';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import { SiRazorpay } from "react-icons/si";
import { TiTick } from "react-icons/ti";
import { TbCoinRupeeFilled } from "react-icons/tb";

const CheckOut = () => {
    const [selectedPayment, setSelectedPayment] = useState('razorpay');


    return (
        <div className='relative w-full h-screen'>
            <div className='flex items-center justify-between w-full'>
                <BackButton />
                <h2 className='font-bold'>Check Out</h2>
                <div >
                    {/* <BiDotsVerticalRounded className='text-2xl' /> */}
                </div>
            </div>
            <div className='flex gap-4 my-4 leading-3'>
                <div className='w-10 h-10 items-center flex justify-center bg-gray-100 rounded-full'>
                    <img src="location.png" />
                </div>
                <div>
                    <h4 className='font-bold text-[14px]'>Delivery Location</h4>
                    <p className='text-gray-500 text-[12px] my-2'>123 Main Street, City, Country</p>
                </div>
            </div>

            <div className='flex gap-4 my-4 leading-3'>
                <div className='w-10 h-10 items-center flex justify-center bg-gray-100 rounded-full' >
                    <MdWatchLater className='text-2xl text-indigo-500' />
                </div>
                <div>
                    <h4 className='font-bold text-[14px]'>Delivery Time</h4>
                    <p className='text-gray-500 text-[12px] my-2'>Expected delivery within 2-3 days</p>
                </div>
            </div>


            <div className='fixed bottom-0 left-0 w-full'>
                <div className='bg-gray-100 px-4 pt-2 rounded-lg'>
                    <h4 className='font-bold text-lg'>Choose Payment Method</h4>
                    <div >
                        <div className='flex items-center justify-between mt-2 gap-4' onClick={() => setSelectedPayment('razorpay')}>
                            <div className='flex items-center gap-2'>
                                <SiRazorpay />
                                <h4 className={`${selectedPayment === 'razorpay' ? 'text-blue-500' : 'text-gray-500'} font-semibold`}>Razorpay</h4>
                            </div>
                            {
                                selectedPayment === 'razorpay' && <TiTick className='text-green-500 text-2xl' />
                            }
                        </div>
                        <div className='flex items-center justify-between mt-2 gap-4' onClick={() => setSelectedPayment('COD')}>
                            <div className='flex items-center gap-2'>
                                <TbCoinRupeeFilled className='text-xl'/>
                                <h4 className={`${selectedPayment === 'COD' ? 'text-blue-500' : 'text-gray-500'} font-semibold`}>COD</h4>
                            </div>
                            {
                                selectedPayment === 'COD' && <TiTick className='text-green-500 text-2xl' />
                            }
                        </div>
                    </div>
                </div>
                <div className='bg-gray-100 py-3 rounded-lg'>
                    <hr />
                </div>
                <div className='bg-gray-100 px-4 pb-4 rounded-lg'>
                    <h4 className='font-bold text-lg'>Order Summary</h4>
                    <div>
                        <div className='flex items-center justify-between mt-2'>
                            <span className='font-semibold text-gray-600'>Items</span>
                            <span className='font-bold text-gray-600'>3</span>
                        </div>
                        <div className='flex items-center justify-between mt-2'>
                            <span className='font-semibold text-gray-600'>Subtotal</span>
                            <span className='font-bold text-gray-600'>$391.96</span>
                        </div>
                        <div className='flex items-center justify-between mt-2'>
                            <span className='font-semibold text-gray-600'>Discount</span>
                            <span className='font-bold text-gray-600'>$4.00</span>
                        </div>
                        <div className='flex items-center justify-between mt-2'>
                            <span className='font-semibold text-gray-600'>Delivery Charges</span>
                            <span className='font-bold text-gray-600'>$2.00</span>
                        </div>
                        <hr className='my-2' />
                        <div className='flex items-center justify-between mt-2'>
                            <span className='font-bold text-gray-900'>Total</span>
                            <span className='font-bold text-gray-900'>$397.96</span>
                        </div>
                        <Link to='/checkout'>
                            <button className='w-full bg-blue-500 text-white p-3 rounded-full font-bold mt-4'>Check Out</button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckOut