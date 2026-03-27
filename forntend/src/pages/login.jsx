import React, { useContext, useState } from 'react'
import { IoMdEye } from "react-icons/io";
import { IoMdEyeOff } from "react-icons/io";
import Checkbox from '@mui/material/Checkbox';
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { postData } from '../utils/api';
import { MyContext } from '../App';

const label = { slotProps: { input: { 'aria-label': 'Checkbox demo' } } };

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formFields, setFormFields] = useState({
    email: '',
    password: ''
  });

  const context = useContext(MyContext);
  const navigate = useNavigate();

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields({
      ...formFields,
      [name]: value
    })
  };

  const valideValue = Object.values(formFields).every(el => el);

  const handleSubmit = (e) => {
    e.preventDefault();

    setIsLoading(true);

    if (formFields.email === "") {
      context.alertBox("error", "Please enter email id")
      setIsLoading(false);
      return false;
    }
    if (formFields.password === "") {
      context.alertBox("error", "Please enter password")
      setIsLoading(false);
      return false;
    }

    postData("/api/user/login", formFields).then((res) => {
      if (res.error === false) {
        context.alertBox("Success", res.message);
        setIsLoading(false);
        localStorage.setItem("accessToken", res?.user?.accessToken);
        localStorage.setItem("refreshToken", res?.user?.refreshToken);
        context?.setIsLoggedIn(true);
        navigate('/');
        return true;
      } else {
        context.alertBox("error", res.message);
        setIsLoading(false);
        return false;
      }
    }).catch((err) => {
      context.alertBox("error", "Something went wrong. Please try again later.");
      setIsLoading(false);
      return false;
    });
    
  }

  return (
    <div className='login-page w-full h-screen flex-col bg-amber-50 p-6 relative overflow-hidden'>
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

      <form onSubmit={handleSubmit} className='w-full flex-col justify-center items-center max-w-md mx-auto'>
        <div className='w-full flex-col justify-center items-center max-w-md'>
          <input
            type='text'
            name='email'
            value={formFields.email}
            onChange={onChangeInput}
            placeholder='Email Address'
            className='w-full p-3 mt-5 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500'
          />
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              name='password'
              value={formFields.password}
              onChange={onChangeInput}
              placeholder='Password'
              className='w-full p-3 mt-5 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500'
            />
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
          <Button
            type='submit'
            disabled={isLoading}
            className='w-full! p-2 bg-blue-500! text-white! mt-5 rounded-md hover:bg-blue-600! transition duration-300'
          >
            Login
          </Button>
        </div>
        <p className='text-center font-medium my-4 text-gray-500'>Or continue with social account</p>
        <Button className='flex gap-3 w-full bg-[#f1f1f1]! text-black!'

        >
          <FcGoogle className='text-[20px]' />
          Login with Google
        </Button>
      </form>
      <div className='w-full absolute bottom-0 left-0 right-0 justify-items-center'>
        <img src="image.png" alt="" />
      </div>
      <div className='w-full absolute -bottom-10 left-0 right-0 justify-items-center'>
        <img src="image2.png" alt="" />
      </div>
      <div className='w-full absolute -bottom-10 left-0 right-0 justify-items-center'>
        <img src="Subtract.png" alt="" />
      </div>
    </div>
  )
}

export default Login;