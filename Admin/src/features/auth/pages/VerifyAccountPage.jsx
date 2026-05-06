import Button from '@mui/material/Button';
import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CgLogIn } from 'react-icons/cg';
import { FaRegUser } from 'react-icons/fa';
import VerifyAccountForm from '../components/VerifyAccountForm';
import { forgotPasswordRequest } from '../authAPI';
import { alertBox } from '../../../shared/utils/alert';



const VerifyAccount = () => {
  const [isResendLoading, setIsResendLoading] = useState(false);
  const email = localStorage.getItem('userEmail') || '';

  const getStored = (key, fallback = null) => {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) { return fallback; }
  };

  const initialCount = Number(getStored(`resendCount_${email}`, 0)) || 0;
  const initialExpiry = Number(getStored(`resendExpiry_${email}`, 0)) || 0;

  const [resendCount, setResendCount] = useState(initialCount);
  const [cooldownExpiry, setCooldownExpiry] = useState(initialExpiry);
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    return initialExpiry > Date.now() ? Math.ceil((initialExpiry - Date.now()) / 1000) : 0;
  });

  useEffect(() => {
    let timer = null;
    if (cooldownExpiry && cooldownExpiry > Date.now()) {
      setRemainingSeconds(Math.ceil((cooldownExpiry - Date.now()) / 1000));
      timer = setInterval(() => {
        const rem = Math.ceil((cooldownExpiry - Date.now()) / 1000);
        if (rem <= 0) {
          setRemainingSeconds(0);
          setCooldownExpiry(0);
          try { localStorage.removeItem(`resendExpiry_${email}`); } catch (e) { }
          clearInterval(timer);
        } else {
          setRemainingSeconds(rem);
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownExpiry, email]);

  const getCooldownSeconds = (count) => {
    if (count <= 1) return 15;
    if (count === 2) return 30;
    return 60; // for 3rd and subsequent attempts
  };

  const startCooldown = (newCount) => {
    const seconds = getCooldownSeconds(newCount);
    const expiry = Date.now() + seconds * 1000;
    setCooldownExpiry(expiry);
    setRemainingSeconds(seconds);
    try {
      localStorage.setItem(`resendCount_${email}`, String(newCount));
      localStorage.setItem(`resendExpiry_${email}`, String(expiry));
    } catch (e) { }
  };

  const handleResend = async () => {
    if (!email) {
      alertBox('error', 'No email found to resend OTP');
      return;
    }

    if (remainingSeconds > 0) {
      alertBox('error', `Please wait ${remainingSeconds}s before resending OTP`);
      return;
    }

    try {
      setIsResendLoading(true);
      const res = await forgotPasswordRequest({ email });
      if (res?.data?.error === false) {
        const newCount = resendCount + 1;
        setResendCount(newCount);
        startCooldown(newCount);
        alertBox('Success', res?.data?.message || 'OTP resent successfully');
        return;
      }
      alertBox('error', res?.data?.message || 'Unable to resend OTP');
    } catch (err) {
      alertBox('error', err?.response?.data?.message || err.message || 'Unable to resend OTP');
    } finally {
      setIsResendLoading(false);
    }
  };



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
        <p className='text-center text-black dark:text-[#c1c6cf] text-[15px]'>OTP sent to
          <span className='text-primary font-bold'> {localStorage.getItem("userEmail")}</span>
        </p>

        <div className='text-center mt-3'>
          <Button onClick={handleResend} className='text-sm text-[#1976d2]!' disabled={isResendLoading || remainingSeconds > 0}>
            {isResendLoading ? 'Resending...' : (remainingSeconds > 0 ? `Resend OTP (${remainingSeconds}s)` : 'Resend OTP')}
          </Button>
        </div>

        <br />

        <VerifyAccountForm />

      </div>
    </section>
  )
}

export default VerifyAccount;