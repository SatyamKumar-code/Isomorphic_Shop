import React, { useContext, useEffect} from 'react'
import { FaBell } from "react-icons/fa";
import Banner from '../components/Banner/baner';
import Product from '../components/product';
import { Link } from 'react-router-dom';
import { MyContext } from '../App';
import { fetchDataFromApi } from '../utils/api';
import SerchBox from '../components/serchBox';

const Home = () => {
    const context = useContext(MyContext);



    useEffect(() => {
        fetchDataFromApi("/api/user/userData").then((res) => {
            context?.setUserData(res?.user);
        });

    }, [context.setUserData]);


    return (
        <div >
            <div className='flex items-center justify-between'>
                {
                    context?.isLoggedIn === true && (
                        <>
                            <div className='flex items-center'>
                                <img src="profile.png" alt="" width="45px!" height="45px" />
                                <div className='ml-2 leading-4 '>
                                    <span className='text-gray-600'>Hello!</span>
                                    <h2 className='font-bold'>{context.userData?.name}</h2>
                                </div>
                            </div>
                            <div className='w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full cursor-pointer'>
                                <FaBell className='text-lg text-gray-500' />
                            </div>
                        </>
                    ) 
                        
                }

            </div>
            <SerchBox />
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