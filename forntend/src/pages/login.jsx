import React, { useState } from 'react'
import { IoMdEye } from "react-icons/io";
import { IoMdEyeOff } from "react-icons/io";
import Checkbox from '@mui/material/Checkbox';
import { FcGoogle } from "react-icons/fc";
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';

const label = { slotProps: { input: { 'aria-label': 'Checkbox demo' } } };

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className='w-full h-screen flex-col bg-amber-50 p-6 relative'>
      <h2 className='text-2xl font-semibold text-center'>
        Login
      </h2>
      <p className='text-center text-gray-400 mt-2 mb-6'>
        By signing in you are agreeing <br /> our <a href='#' className='text-blue-500 hover:underline'>Terms and privacy policy</a>
      </p>

      <div className='flex items-center justify-center gap-5 text-gray-600'>
        <h4 className='text-blue-500 underline'>Login</h4>
        <Link to='/register' className='hover:text-blue-500 hover:underline'>Register</Link>
      </div>

      <form action="#">
        <div className='w-full flex-col justify-center items-center max-w-md'>
          <input type='text' placeholder='Email Address' className='w-full p-3 mt-5 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500' />
          <div className='relative'>
            <input type={showPassword ? 'text' : 'password'} placeholder='Password' className='w-full p-3 mt-5 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500' />
            <button
              type='button'
              className='absolute right-3 top-8.5 text-2xl text-gray-600'
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
            </button>
          </div>
          <div className='flex items-center justify-between my-3'>
            <div className='flex items-center'>
              <Checkbox {...label} className='text-gray-500!' />
              <span className='text-gray-500 text-[15px] -ml-2'>Remember Password</span>
            </div>
            <Link to='/forgot-password' className='text-blue-500 hover:underline'>Forgot Password?</Link>
          </div>
          <Button className='w-full! p-2 bg-blue-500! text-white! mt-5 rounded-md hover:bg-blue-600! transition duration-300'>Login</Button>
        </div>
        <p className='text-center font-medium my-4 text-gray-500'>Or continue with social account</p>
        <Button className='flex gap-3 w-full bg-[#f1f1f1]! text-black!'

        >
          <FcGoogle className='text-[20px]' />
          Login with Google
        </Button>
      </form>
      <div className='w-full absolute bottom-10 left-0 right-0 flex items-center justify-center'>
        <img src="image.png" alt="" />
      </div>
      <div className='w-full absolute bottom-0 left-0 right-0 flex items-center justify-end'>
        <img src="image2.png" alt="" />
      </div>
      <div>
        <img src="Subtract.png" alt="" className='w-full absolute bottom-0 left-0 right-0' />
      </div>
    </div>
  )
}

export default Login;