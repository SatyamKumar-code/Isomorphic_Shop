import React, { useState } from 'react'
import BackButton from '../components/backButton'
import { BiDotsVerticalRounded } from 'react-icons/bi'
import { MdWatchLater } from "react-icons/md";
import { Link } from 'react-router-dom';
import { SiRazorpay } from "react-icons/si";
import { TiTick } from "react-icons/ti";
import { TbCoinRupeeFilled } from "react-icons/tb";

const CheckOut = () => {
    const [selectedPayment, setSelectedPayment] = useState('razorpay');
    const razorpayMethods = ['UPI', 'Credit Card', 'Debit Card', 'Netbanking', 'Wallet', 'EMI'];


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
                <div className='rounded-lg bg-gray-100 px-4 pt-3'>
                    <div className='flex items-center justify-between gap-3'>
                        <div>
                            <h4 className='text-lg font-bold'>Choose Payment Method</h4>
                            <p className='text-[12px] text-gray-500'>Use Razorpay for online payments or place the order with COD.</p>
                        </div>
                        <span className='text-[12px] font-semibold uppercase tracking-wide text-gray-500'>
                            {selectedPayment === 'razorpay' ? 'Razorpay selected' : 'COD selected'}
                        </span>
                    </div>

                    <div className='mt-4 space-y-3'>
                        <button
                            type='button'
                            onClick={() => setSelectedPayment('COD')}
                            className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition ${selectedPayment === 'COD' ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-gray-200'}`}
                        >
                            <div className='flex items-center gap-3'>
                                <span className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600'>
                                    <TbCoinRupeeFilled className='text-lg' />
                                </span>
                                <div>
                                    <h4 className='font-semibold text-gray-900'>Cash on Delivery</h4>
                                    <p className='text-[12px] text-gray-500'>Pay when the order is delivered</p>
                                </div>
                            </div>
                            {selectedPayment === 'COD' && <TiTick className='text-2xl text-green-500' />}
                        </button>

                        <button
                            type='button'
                            onClick={() => setSelectedPayment('razorpay')}
                            className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition ${selectedPayment === 'razorpay' ? 'border-blue-200 ring-2 ring-blue-100' : 'border-gray-200'}`}
                        >
                            <div className='flex items-center gap-3'>
                                <span className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600'>
                                    <SiRazorpay className='text-lg' />
                                </span>
                                <div>
                                    <h4 className='font-semibold text-gray-900'>Razorpay</h4>
                                    <p className='text-[12px] text-gray-500'>UPI, card, netbanking, wallet, EMI</p>
                                </div>
                            </div>
                            {selectedPayment === 'razorpay' && <TiTick className='text-2xl text-green-500' />}
                        </button>
                    </div>

                    <div className='mt-3 flex flex-wrap gap-2'>
                        {razorpayMethods.map((method) => (
                            <span key={method} className='rounded-full bg-white px-3 py-1 text-[12px] font-medium text-gray-600 shadow-sm'>
                                {method}
                            </span>
                        ))}
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
                        <button type='button' className='mt-4 w-full rounded-full bg-blue-500 p-3 font-bold text-white'>
                            {selectedPayment === 'COD' ? 'Place COD Order' : 'Continue to Razorpay'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckOut