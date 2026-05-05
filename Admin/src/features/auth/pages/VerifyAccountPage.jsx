import Button from '@mui/material/Button';
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CgLogIn } from 'react-icons/cg';
import { FaRegUser } from 'react-icons/fa';
import VerifyAccountForm from '../components/VerifyAccountForm';



const VerifyAccount = () => {



  return (
    <section className='w-full h-screen relative bg-white dark:bg-gray-900'>
      <header className='w-full static lg:fixed top-0 left-0 px-4 py-3 flex items-center justify-center sm:justify-between z-50'>
        <Link to="/">
          <img src="/logo1.svg" alt="Logo"
            className='w-37.5! dark:bg-blue-50' />
        </Link>


        <div className='hidden sm:flex items-center gap-0'>
          <NavLink to="/login" exact={true} activeClassName="active">
            <Button className='rounded-full! text-[rgba(0,0,0,0.8)]! px-5! flex dark:text-white! gap-1'>
              <CgLogIn className='text-[18px] text-black dark:text-white' /> Login
            </Button>
          </NavLink>

          <NavLink to="/sign-up" exact={true} activeClassName="active">
            <Button className='rounded-full! text-[rgba(0,0,0,0.8)]! px-5! flex  dark:text-white! gap-1'>
              <FaRegUser className='text-[15px] text-black dark:text-white' /> Sign Up
            </Button>
          </NavLink>
        </div>
      </header>

      <div className='loginBox card md:w-150 w-full h-auto px-3 pb-20 mx-auto pt-5 lg:pt-20 relative z-50'>
        <div className='text-center'>
          <img src="/verify.png" className='w-25 m-auto' />
        </div>

        <h1 className='text-center text-[18px] text-black dark:text-[#c1c6cf] sm:text-[35px] font-extrabold mt-4'>
          Welcome Back!
          <br />
          Please Verify Your Email.
        </h1>

        <br />
        <p className='text-center text-black dark:text-[#c1c6cf] text-[15px]'>OTP send to
          <span className='text-primary font-bold'> {localStorage.getItem("userEmail")}</span></p>

        <br />

        <VerifyAccountForm />

      </div>
    </section>
  )
}

export default VerifyAccount;