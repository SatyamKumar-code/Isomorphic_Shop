import React, { useContext, useEffect, useState } from 'react'
import { FaBell } from "react-icons/fa";
import Banner from '../components/Banner/baner';
import Product from '../components/product';
import { Link } from 'react-router-dom';
import { MyContext } from '../App';
import { fetchDataFromApi } from '../utils/api';
import { getNotifications } from '../utils/notificationsAPI';
import { useNavigate } from 'react-router-dom';
import SerchBox from '../components/serchBox';
import Footer from '../components/footer';

const Home = () => {
    const context = useContext(MyContext);



    const [unread, setUnread] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (!context?.isLoggedIn) {
            return;
        }

        fetchDataFromApi("/api/user/userData").then((res) => {
            context?.setUserData(res?.data || null);
        });

    }, [context?.isLoggedIn, context?.setUserData]);

    useEffect(() => {
        if (!context?.isLoggedIn) return;

        getNotifications({ limit: 1 }).then(res => {
            if (res?.error === false && res?.data) {
                setUnread(res.data.unreadCount || 0);
            }
        });
    }, [context?.isLoggedIn]);


    return (
        <div >
            <div className='flex items-center justify-between'>
                {
                    context?.isLoggedIn === true && (
                        <>
                            <div className='flex items-center'>
                                <img src={context.userData?.avatar || "profile.png"} alt="Profile" className='w-11.25 h-11.25 rounded-full object-cover' />
                                <div className='ml-2 leading-4 '>
                                    <span className='text-gray-600'>Hello!</span>
                                    <h2 className='font-bold'>{context.userData?.name}</h2>
                                </div>
                            </div>
                            <div onClick={() => navigate('/notifications')} className='relative w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full cursor-pointer'>
                                <FaBell className='text-lg text-gray-500' />
                                {unread > 0 && (
                                    <span className='absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center'>{unread}</span>
                                )}
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
                <Product endpoint="/api/product/latest" />
            </div>

            <div className='mt-4'>
                <div className='flex items-center justify-between mb-2'>
                    <h2 className='font-bold'>Most Popular</h2>
                    <Link to="/products" className='text-blue-500'>
                        See All
                    </Link>
                </div>
                <Product endpoint="/api/product/top-rated" />
            </div>
            <Footer />
        </div>
    )
}

export default Home