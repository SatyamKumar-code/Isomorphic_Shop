import Button from '@mui/material/Button';
import React from 'react'
import { Link, NavLink } from 'react-router-dom';
import { CgLogIn } from 'react-icons/cg';
import LoginForm from '../components/LoginForm';

const Login = () => {
    return (
        <section className='bg-white dark:bg-gray-800 w-full '>
            <header className='w-full static lg:fixed top-0 left-0 px-4 py-3 flex items-center justify-center sm:justify-between z-50'>
                <Link to="/">
                    <img src="/logo1.svg" alt="Logo"
                        className='w-37.5!' />
                </Link>


                <div className='hidden sm:flex items-center gap-0'>
                    <NavLink to="/login" exact={true} activeClassName="active">
                        <Button className='rounded-full! text-[rgba(0,0,0,0.8)]! px-5! flex gap-1'>
                            <CgLogIn className='text-[18px]' /> Login
                        </Button>
                    </NavLink>

                    <NavLink to="/sign-up" exact={true} activeClassName="active">
                        <Button className='rounded-full! text-[rgba(0,0,0,0.8)]! px-5! flex gap-1'>
                            <span className='text-[15px]'>Seller Sign Up</span>
                        </Button>
                    </NavLink>
                </div>
            </header>
            <img src="https://t3.ftcdn.net/jpg/05/88/24/10/360_F_588241010_cdQJ2QTsyDtt36jZsAFR45aAXICnPAzR.jpg"
                className='w-full fixed top-0 left-0 opacity-20' />

            <div className='loginBox card md:w-150 w-full h-auto pb-20 mx-auto pt-5 lg:pt-20 relative z-50'>
                <div className='text-center'>
                    <img src="/logo.svg" className='m-auto' />
                </div>

                <h1 className='text-center text-[18px] sm:text-[35px] font-extrabold mt-4'>
                    Welcome Back!
                    <br />
                    Sign in with your seller or admin credentials.
                </h1>

                <LoginForm />

                <div className='px-8 pb-2 pt-3 text-center text-[14px] text-[rgba(0,0,0,0.7)]'>
                    New seller?{' '}
                    <Link to='/sign-up' className='font-bold hover:underline'>Create an account</Link>
                </div>


            </div>
        </section>
    )
}

export default Login;