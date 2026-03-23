import React from 'react'
import { FaBell } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";
import Banner from '../components/Banner/baner';
import Product from '../components/product';
import { Link } from 'react-router-dom';

const Home = () => {
    

    return (
        <div className='p-3'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                    <img src="profile.png" alt="" width="45px!" height="45px" />
                    <div className='ml-2 leading-4 '>
                        <span className='text-gray-600'>Hello!</span>
                        <h2 className='font-bold'>user.name</h2>
                    </div>
                </div>
                <div className='w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full cursor-pointer'>
                    <FaBell className='text-lg text-gray-500' />
                </div>
            </div>
            <div className='flex mt-4 w-full items-center gap-1 bg-gray-100 rounded-full'>
                <FaSearch className='text-gray-500 ml-2' />
                <input type="text" placeholder="Search..." className='bg-transparent border-none focus:outline-none w-full h-10' />
            </div>
            <div className='mt-4'>
                <Banner />
            </div>
            <div className='mt-4'>
                <div className='flex items-center justify-between mb-2'>
                    <h2 className='font-bold'>Featured</h2>
                    <Link to="/products" className='text-blue-500'>
                        See All
                    </Link>
                </div>
                <Product />
            </div>

            <div className='mt-4'>
                <div className='flex items-center justify-between mb-2'>
                    <h2 className='font-bold'>Most Popular</h2>
                    <Link to="/products" className='text-blue-500'>
                        See All
                    </Link>
                </div>
                <Product />
            </div>
        </div>
    )
}

export default Home