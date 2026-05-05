import Button from '@mui/material/Button';
import React, { useMemo, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CgLogIn } from 'react-icons/cg';
import { FaRegEye, FaRegUser, FaEyeSlash } from 'react-icons/fa';
import { CircularProgress } from '@mui/material';
import { alertBox } from '../../../shared/utils/alert';
import { forgotPasswordRequest, resetPasswordWithOtp } from '../authAPI';

const ForgotPassword = () => {
    const actionType = localStorage.getItem('actionType');
    const isResetStep = actionType === 'forgot-password-verified';
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordShow, setIsPasswordShow] = useState(false);
    const [isConfirmPasswordShow, setIsConfirmPasswordShow] = useState(false);

    const [formFields, setFormFields] = useState({
        email: localStorage.getItem('userEmail') || '',
        newPassword: '',
        confirmPassword: ''
    });

    const navigate = useNavigate();

    const forgotPassword = async (e) => {
        e.preventDefault();

        if (formFields.email.trim() === "") {
            alertBox('error', 'Please enter email');
            return false
        }

        try {
            setIsLoading(true);
            const email = formFields.email.trim();
            const res = await forgotPasswordRequest({ email });

            if (res?.data?.error === false) {
                localStorage.setItem('userEmail', email);
                localStorage.setItem('actionType', 'forgot-password');
                alertBox('Success', res?.data?.message || 'OTP sent to your email');
                navigate('/verify-account');
                return;
            }

            alertBox('error', res?.data?.message || 'Unable to send OTP');
        } catch (error) {
            alertBox('error', error?.response?.data?.message || error.message || 'Unable to send OTP');
        } finally {
            setIsLoading(false);
        }

    }

    const resetPassword = async (e) => {
        e.preventDefault();

        const email = localStorage.getItem('userEmail') || formFields.email.trim();
        if (!email) {
            alertBox('error', 'Email not found. Please restart forgot password flow.');
            navigate('/login');
            return;
        }

        if (!formFields.newPassword) {
            alertBox('error', 'Please enter new password');
            return;
        }

        if (formFields.newPassword !== formFields.confirmPassword) {
            alertBox('error', 'Password and confirm password not matched');
            return;
        }

        try {
            setIsLoading(true);
            const res = await resetPasswordWithOtp({
                email,
                newPassword: formFields.newPassword,
                confirmPassword: formFields.confirmPassword
            });

            if (res?.data?.error === false) {
                alertBox('Success', res?.data?.message || 'Password reset successfully');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('actionType');
                navigate('/login');
                return;
            }

            alertBox('error', res?.data?.message || 'Password reset failed');
        } catch (error) {
            alertBox('error', error?.response?.data?.message || error.message || 'Password reset failed');
        } finally {
            setIsLoading(false);
        }
    };

    const isResetValid = useMemo(() => {
        if (!isResetStep) return true;
        return !!formFields.newPassword && !!formFields.confirmPassword;
    }, [formFields.newPassword, formFields.confirmPassword, isResetStep]);

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setFormFields({
            ...formFields,
            [name]: value
        });
    }

    return (
        <section className='w-full h-screen relative' style={{ background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%' }}>
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
                            <FaRegUser className='text-[15px]' /> Sign Up
                        </Button>
                    </NavLink>
                </div>
            </header>

            <div className='loginBox card md:w-150 w-full h-auto px-3 pb-20 mx-auto pt-5 lg:pt-20 relative z-50'>
                <div className='text-center'>
                    <img src="/logo.svg" className='m-auto' />
                </div>

                <h1 className='text-center text-[18px] sm:text-[35px] font-extrabold mt-4'>
                    {
                        isResetStep
                            ? 'Set your new password.'
                            : <>
                                Having trouble to sign in?
                                <br />
                                Reset your password.
                            </>
                    }
                </h1>


                <br />

                <form className='w-full px-3 sm:px-8 mt-3' onSubmit={isResetStep ? resetPassword : forgotPassword}>
                    {
                        isResetStep ? (
                            <>
                                <div className='form-group mb-4 w-full'>
                                    <h4 className='text-[14px] font-medium mb-1'>
                                        New Password
                                    </h4>
                                    <div className='relative w-full'>
                                        <input
                                            type={isPasswordShow ? 'text' : 'password'}
                                            name='newPassword'
                                            value={formFields.newPassword}
                                            disabled={isLoading}
                                            onChange={onChangeInput}
                                            className='w-full h-12.5 border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3'
                                        />
                                        <Button
                                            type='button'
                                            className='absolute! top-1.75 right-2.5 z-50 rounded-full! w-8.75! h-8.75! min-w-8.75! text-gray-600!'
                                            onClick={() => setIsPasswordShow((prev) => !prev)}
                                        >
                                            {isPasswordShow ? <FaEyeSlash className='text-[18px]' /> : <FaRegEye className='text-[18px]' />}
                                        </Button>
                                    </div>
                                </div>

                                <div className='form-group mb-4 w-full'>
                                    <h4 className='text-[14px] font-medium mb-1'>
                                        Confirm Password
                                    </h4>
                                    <div className='relative w-full'>
                                        <input
                                            type={isConfirmPasswordShow ? 'text' : 'password'}
                                            name='confirmPassword'
                                            value={formFields.confirmPassword}
                                            disabled={isLoading}
                                            onChange={onChangeInput}
                                            className='w-full h-12.5 border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3'
                                        />
                                        <Button
                                            type='button'
                                            className='absolute! top-1.75 right-2.5 z-50 rounded-full! w-8.75! h-8.75! min-w-8.75! text-gray-600!'
                                            onClick={() => setIsConfirmPasswordShow((prev) => !prev)}
                                        >
                                            {isConfirmPasswordShow ? <FaEyeSlash className='text-[18px]' /> : <FaRegEye className='text-[18px]' />}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className='form-group mb-4 w-full'>
                                <h4 className='text-[14px] font-medium mb-1'>
                                    Email
                                </h4>
                                <input
                                    type="email"
                                    id="email"
                                    name='email'
                                    value={formFields.email}
                                    disabled={isLoading === true ? true : false}
                                    onChange={onChangeInput}
                                    placeholder="Enter your email"
                                    className='w-full h-12.5 border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3'
                                />
                            </div>
                        )
                    }

                    <Button
                        type='submit'
                        disabled={!isResetValid || isLoading}
                        className='btn-blue w-full '>
                        {
                            isLoading === true ? <CircularProgress color='inherit' />
                                :
                                (isResetStep ? 'Change Password' : 'Reset Password')
                        }
                    </Button>
                    <br /><br />
                    <div className='text-center flex items-center justify-center gap-4'>
                        <span>{isResetStep ? 'Remember your password?' : "Don't want to reset?"}</span>
                        <Link to='/login'
                            className='text-primary font-bold text-[15px] hover:underline hover:text-gray-700'>
                            Sign In?
                        </Link>
                    </div>
                </form>

            </div>
        </section>
    )
}

export default ForgotPassword;