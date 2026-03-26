import React, { useState } from 'react'
import BackButton from '../components/backButton'
import { BiDotsVerticalRounded } from "react-icons/bi";
import { MdDeleteForever } from "react-icons/md";
import { FiMinus } from "react-icons/fi";
import { FiPlus } from "react-icons/fi";

const Cart = () => {
    const [cartItems, setCartItems] = useState("1");

    const itemIncrease = () => {
        const newValue = parseInt(cartItems) + 1;
        setCartItems(newValue.toString());
    }
    const itemDecrease = () => {
        const newValue = parseInt(cartItems) - 1;
        if (newValue >= 1) {
            setCartItems(newValue.toString());
        }
    }
    return (
        <div className='relative w-full h-screen'>
            <div className='absolute top-0 left-0 w-full'>
                <div className='flex items-center justify-between w-full'>
                    <BackButton />
                    <h2 className='font-bold'>Cart</h2>
                    <div className='w-10 h-10 items-center justify-center flex rounded-full bg-gray-100'>
                        <BiDotsVerticalRounded className='text-2xl' />
                    </div>
                </div>
            </div>
            <div className='w-full h-full mb-75 overflow-y-auto'>
                <div className='flex w-full h-27.5 items-center rounded-lg bg-gray-100 mt-16'>
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFYqoKTu_o3Zns2yExbst2Co84Gpc2Q1RJbA&s" className='w-31.5 h-24.75 rounded-xl' />
                    <div className='ml-4'>
                        <h4 className='font-bold text-[14px]'>Product Name</h4>
                        <p className='text-gray-500 text-[12px] my-2'>brand name</p>
                        <span className='text-blue-500 font-bold text-[14px]'>$99.99</span>
                    </div>
                    <div className='relative items-between ml-auto mr-4'>
                        <div className='justify-end mb-8 flex'>
                            <MdDeleteForever className='text-3xl text-red-400' />
                        </div>
                        <div className='flex items-center justify-center mt-2'>
                            <button className='bg-blue-500 text-white w-7 h-7 items-center justify-center flex p-[8px] rounded-full' onClick={itemDecrease}><FiMinus /></button>
                            <span className='font-semibold text-lg mx-2'>{cartItems}</span>
                            <button className='bg-blue-500 text-white flex items-center justify-center w-7 h-7 rounded-full' onClick={itemIncrease}><FiPlus /></button>
                        </div>
                    </div>
                </div>

                <div className='flex w-full h-27.5 items-center rounded-lg bg-gray-100 mt-3'>
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFYqoKTu_o3Zns2yExbst2Co84Gpc2Q1RJbA&s" className='w-31.5 h-24.75 rounded-xl' />
                    <div className='ml-4'>
                        <h4 className='font-bold text-[14px]'>Product Name</h4>
                        <p className='text-gray-500 text-[12px] my-2'>brand name</p>
                        <span className='text-blue-500 font-bold text-[14px]'>$99.99</span>
                    </div>
                    <div className='relative items-between ml-auto mr-4'>
                        <div className='justify-end mb-8 flex'>
                            <MdDeleteForever className='text-3xl text-red-400' />
                        </div>
                        <div className='flex items-center justify-center mt-2'>
                            <button className='bg-blue-500 text-white w-7 h-7 items-center justify-center flex p-[8px] rounded-full' onClick={itemDecrease}><FiMinus /></button>
                            <span className='font-semibold text-lg mx-2'>{cartItems}</span>
                            <button className='bg-blue-500 text-white flex items-center justify-center w-7 h-7 rounded-full' onClick={itemIncrease}><FiPlus /></button>
                        </div>
                    </div>
                </div>

                <div className='flex w-full h-27.5 items-center rounded-lg bg-gray-100 mt-3'>
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFYqoKTu_o3Zns2yExbst2Co84Gpc2Q1RJbA&s" className='w-31.5 h-24.75 rounded-xl' />
                    <div className='ml-4'>
                        <h4 className='font-bold text-[14px]'>Product Name</h4>
                        <p className='text-gray-500 text-[12px] my-2'>brand name</p>
                        <span className='text-blue-500 font-bold text-[14px]'>$99.99</span>
                    </div>
                    <div className='relative items-between ml-auto mr-4'>
                        <div className='justify-end mb-8 flex'>
                            <MdDeleteForever className='text-3xl text-red-400' />
                        </div>
                        <div className='flex items-center justify-center mt-2'>
                            <button className='bg-blue-500 text-white w-7 h-7 items-center justify-center flex p-[8px] rounded-full' onClick={itemDecrease}><FiMinus /></button>
                            <span className='font-semibold text-lg mx-2'>{cartItems}</span>
                            <button className='bg-blue-500 text-white flex items-center justify-center w-7 h-7 rounded-full' onClick={itemIncrease}><FiPlus /></button>
                        </div>
                    </div>
                </div>

                <div className='flex w-full h-27.5 items-center rounded-lg bg-gray-100 mt-3'>
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFYqoKTu_o3Zns2yExbst2Co84Gpc2Q1RJbA&s" className='w-31.5 h-24.75 rounded-xl' />
                    <div className='ml-4'>
                        <h4 className='font-bold text-[14px]'>Product Name</h4>
                        <p className='text-gray-500 text-[12px] my-2'>brand name</p>
                        <span className='text-blue-500 font-bold text-[14px]'>$99.99</span>
                    </div>
                    <div className='relative items-between ml-auto mr-4'>
                        <div className='justify-end mb-8 flex'>
                            <MdDeleteForever className='text-3xl text-red-400' />
                        </div>
                        <div className='flex items-center justify-center mt-2'>
                            <button className='bg-blue-500 text-white w-7 h-7 items-center justify-center flex p-[8px] rounded-full' onClick={itemDecrease}><FiMinus /></button>
                            <span className='font-semibold text-lg mx-2'>{cartItems}</span>
                            <button className='bg-blue-500 text-white flex items-center justify-center w-7 h-7 rounded-full' onClick={itemIncrease}><FiPlus /></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className='fixed bottom-0 left-0 w-full p-4 bg-white rounded-t-lg'>
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
                    <button className='w-full bg-blue-500 text-white p-3 rounded-full font-bold mt-4'>Check Out</button>
                </div>
            </div>
        </div>
    )
}

export default Cart