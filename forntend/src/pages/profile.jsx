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

const Profile = () => {

    const context = useContext(MyContext);
    const navigate = useNavigate();


    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        context.setUserData(null);
        context.setIsLoggedIn(false);
        navigate("/login");
    }

    useEffect(() => {
        if (!context?.isLoggedIn) {
            navigate("/login");
        }
    }, [context?.isLoggedIn, navigate]);

    return (
        context?.isLoggedIn === true && (
            <div className='profile-container w-full mt-15 h-screen'>
                <div className='profile mb-5  justify-items-center'>
                    <img src="profile.png" className='w-22 h-22 rounded-full' />
                    <h1 className='text-3xl font-bold'>Satyam kumar</h1>
                    <p className='text-gray-600'>Satyamkumar@gmail.com</p>
                </div>
                <div className='relative flex mt-3   w-full justify-start items-center gap-3 bg-gray-100 p-3 rounded-lg'>
                    <FaUser className='text-xl text-gray-700' />
                    <h1 className='font-bold text-gray-700'>Profile</h1>
                    <IoIosArrowForward className='absolute right-2 text-2xl text-gray-700' />
                </div>

                <div className='relative flex mt-3 w-full justify-start items-center gap-3 bg-gray-100 p-3 rounded-lg'>
                    <Link to="/setting" className='flex items-center gap-3 w-full'>
                        <IoSettings className='text-xl text-gray-700' />
                        <h1 className='font-bold text-gray-700'>Setting</h1>
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