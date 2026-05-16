import React, { useContext, useEffect } from 'react'
import { FaUser } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { MdEmail } from "react-icons/md";
import { IoMdShare } from "react-icons/io";
import { MdHelp } from "react-icons/md";
import { Link, useNavigate } from 'react-router-dom';
import { MyContext } from '../App';
import Footer from '../components/footer';
import { MdShoppingBag } from 'react-icons/md'
import { fetchDataFromApi } from '../utils/api';

const Profile = () => {

    const context = useContext(MyContext);
    const navigate = useNavigate();
    const isAuthReady = context?.isAuthReady;


    const handleLogout = () => {
        fetchDataFromApi("/api/user/logout").finally(() => {
            // server clears auth cookies on logout
            context.setUserData(null);
            context.setIsLoggedIn(false);
            navigate("/login");
        });
    }

    useEffect(() => {
        if (isAuthReady && !context?.isLoggedIn) {
            navigate("/login");
        }
    }, [context?.isLoggedIn, isAuthReady, navigate]);

    if (!isAuthReady) {
        return null;
    }

    return (
        context?.isLoggedIn === true && (
            <div className='profile-container w-full mt-15 h-screen'>
                <div className='profile mb-5  justify-items-center'>
                    <img src={context?.userData?.avatar || "profile.png"} className='w-22 h-22 rounded-full object-cover' />
                    <h1 className='text-3xl font-bold'>{context?.userData?.name || 'User'}</h1>
                    <p className='text-gray-600'>{context?.userData?.email || ''}</p>
                </div>
                <Link to="/profile/manage" className='relative flex mt-3 w-full justify-start items-center gap-3 rounded-lg bg-gray-100 p-3 transition hover:bg-gray-200'>
                    <FaUser className='text-xl text-gray-700' />
                    <div>
                        <h1 className='font-bold text-gray-700'>Profile</h1>
                        <p className='text-xs text-gray-500'>Update photo and name</p>
                    </div>
                    <IoIosArrowForward className='absolute right-2 text-2xl text-gray-700' />
                </Link>

                <div className='relative flex mt-3 w-full justify-start items-center gap-3 bg-gray-100 p-3 rounded-lg'>
                    <Link to="/setting" className='flex items-center gap-3 w-full'>
                        <IoSettings className='text-xl text-gray-700' />
                        <h1 className='font-bold text-gray-700'>Setting</h1>
                        <IoIosArrowForward className='absolute right-2 text-2xl text-gray-700' />
                    </Link>
                </div>

                <div className='relative flex mt-3 w-full justify-start items-center gap-3 bg-gray-100 p-3 rounded-lg'>
                    <Link to="/orders" className='flex items-center gap-3 w-full'>
                        <MdShoppingBag className='text-xl text-gray-700' />
                        <h1 className='font-bold text-gray-700'>Orders</h1>
                        <IoIosArrowForward className='absolute right-2 text-2xl text-gray-700' />
                    </Link>
                </div>

                <div className='relative flex mt-3 w-full justify-start items-center gap-3 bg-gray-100 p-3 rounded-lg'>
                    <MdEmail className='text-xl text-gray-700' />
                    <h1 className='font-bold text-gray-700'>Contact</h1>
                    <IoIosArrowForward className='absolute right-2 text-2xl text-gray-700' />
                </div>

                <div className='relative flex mt-3 w-full justify-start items-center gap-3 bg-gray-100 p-3 rounded-lg'>
                    <IoMdShare className='text-xl text-gray-700' />
                    <h1 className='font-bold text-gray-700'>Share App</h1>
                    <IoIosArrowForward className='absolute right-2 text-2xl text-gray-700' />
                </div>

                <div className='relative flex mt-3 w-full justify-start items-center gap-3 bg-gray-100 p-3 rounded-lg'>
                    <MdHelp className='text-xl text-gray-700' />
                    <h1 className='font-bold text-gray-700'>Help</h1>
                    <IoIosArrowForward className='absolute right-2 text-2xl text-gray-700' />
                </div>

                <div>
                    <button
                        className='w-full bg-red-500 text-white p-3 rounded-lg mt-5'
                        onClick={handleLogout}
                    >Logout</button>
                </div>

                <Footer />

            </div>
        )
    )
}

export default Profile