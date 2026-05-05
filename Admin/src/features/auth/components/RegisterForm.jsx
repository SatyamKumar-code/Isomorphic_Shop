import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import React from 'react';
import { FaEyeSlash, FaRegEye } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

const RegisterForm = ({
    formFields,
    isLoading,
    isPasswordShow,
    onChangeInput,
    onTogglePassword,
    onSubmit,
    isValid,
    onGoogleAuth,
}) => {
    return (
        <form className='w-full px-8 mt-3' onSubmit={onSubmit}>
            <div className='form-group mb-4 w-full'>
                <h4 className='text-[14px] font-medium mb-1'>
                    Full Name
                </h4>
                <input
                    type="text"
                    name='name'
                    value={formFields.name}
                    disabled={isLoading === true}
                    onChange={onChangeInput}
                    className='w-full h-12.5 border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3'
                />
            </div>

            <div className='form-group mb-4 w-full'>
                <h4 className='text-[14px] font-medium mb-1'>
                    Email
                </h4>
                <input
                    type="email"
                    name='email'
                    value={formFields.email}
                    disabled={isLoading === true}
                    onChange={onChangeInput}
                    className='w-full h-12.5 border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3'
                />
            </div>

            <div className='form-group mb-4 w-full'>
                <h4 className='text-[14px] font-medium mb-1'>
                    Password
                </h4>
                <div className='relative w-full'>
                    <input
                        type={isPasswordShow === false ? 'password' : 'text'}
                        name='password'
                        value={formFields.password}
                        disabled={isLoading === true}
                        onChange={onChangeInput}
                        className='w-full h-12.5 border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3'
                    />
                    <Button
                        type='button'
                        className='absolute! top-1.75 right-2.5 z-50 rounded-full! w-8.75! h-8.75! min-w-8.75! text-gray-600!'
                        onClick={onTogglePassword}
                    >
                        {isPasswordShow === false ? (
                            <FaRegEye className='text-[18px]' />
                        ) : (
                            <FaEyeSlash className='text-[18px]' />
                        )}
                    </Button>
                </div>
            </div>

            <div className='mb-5 rounded-xl border border-dashed border-[rgba(0,0,0,0.12)] bg-[rgba(78,166,116,0.06)] px-4 py-3 text-[13px] leading-5 text-[rgba(0,0,0,0.72)]'>
                Seller accounts are verified by email first, then reviewed by admin before product access is enabled.
            </div>

            <div className='form-group mb-4 w-full flex items-center justify-between'>
                <FormControlLabel
                    control={<Checkbox defaultChecked />}
                    label="Remember me"
                />
                <span className='text-[12px] text-[rgba(0,0,0,0.55)]'>Seller registration only</span>
            </div>

            <Button
                type="submit"
                className={`btn-blue w-full`}
                disabled={!isValid || isLoading}
            >
                {isLoading === true ? <CircularProgress color='inherit' size={24} /> : 'Create Seller Account'}
            </Button>
            <div className='flex items-center gap-3 my-4'>
                <div className='flex-1 h-px bg-[rgba(0,0,0,0.1)]'></div>
                <span className='text-[12px] text-[rgba(0,0,0,0.5)]'>OR</span>
                <div className='flex-1 h-px bg-[rgba(0,0,0,0.1)]'></div>
            </div>

            <Button
                type='button'
                onClick={onGoogleAuth}
                disabled={isLoading}
                className='w-full h-12.5 border-2 border-[rgba(0,0,0,0.1)] rounded-md flex items-center justify-center gap-3 bg-[rgba(0,0,0,0.1)]! hover:bg-[rgba(0,0,0,0.05)]! transition-colors'
            >
                <FcGoogle className='text-[20px]' />
                <span className='text-[14px] font-medium'>Sign up with Google</span>
            </Button>

        </form>
    );
};

export default RegisterForm;