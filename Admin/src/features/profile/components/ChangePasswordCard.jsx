import React, { useState } from 'react'
import Button from '@mui/material/Button';
import { FaRegEye, FaEyeSlash } from 'react-icons/fa';
import { CircularProgress } from '@mui/material';
import { alertBox } from '../../../shared/utils/alert';
import { useAuth } from '../../../Context/auth/useAuth';

const ChangePasswordCard = () => {

    const { userData } = useAuth();

    const [currentPasswordShow, setcurrentPasswordShow] = useState(false);
    const [newPasswordShow, setnewPasswordShow] = useState(false);
    const [confirmPasswordShow, setconfirmPasswordShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formFields, setFormFields] = useState({
        email: userData.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setFormFields({
            ...formFields,
            [name]: value
        });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (formFields.currentPassword === "") {
            setIsLoading(false);
            alertBox("error", "Please enter current password")
            return;
        }
        if (formFields.newPassword === "") {
            setIsLoading(false);
            alertBox("error", "Please enter new password")
            return;
        }
        if (formFields.confirmPassword === "") {
            setIsLoading(false);
            alertBox("error", "Please enter confirm password")
            return;
        }

        if (formFields.newPassword !== formFields.confirmPassword) {
            setIsLoading(false);
            alertBox("error", "New and confirm password do not match")
            return;
        }

        setIsLoading(false);
        alertBox("Success", "Password changed successfully")

    };


    return (
        <div className="py-4 px-5 flex flex-col gap-3 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg">
            <div className='flex items-center justify-between'>
                <h4 className="text-lg text-[#23272E] dark:text-[#c1c6cf] font-bold leading-6.5">Change Password</h4>
                <a href="#" className="text-[14px] text-blue-500 underline">Need help</a>
            </div>
            <form onSubmit={handleSubmit} >
                <div className="relative flex flex-col gap-1 mb-2">
                    <label className="text-[15px] font-medium text-gray-700">Current Password</label>
                    <input
                        type={currentPasswordShow === false ? "password" : "text"}
                        className='w-full h-[50px] border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3'
                        name='currentPassword'
                        value={formFields.currentPassword}
                        placeholder='Enter Current Password'
                        autoComplete="new-password"
                        disabled={isLoading === true ? true : false}
                        onChange={onChangeInput}
                    />
                    <Button className='absolute! top-[32px] right-[5px] z-50 rounded-full! w-[35px]! h-[35px]! min-w-[35px]! text-gray-600!'
                        onClick={() => setcurrentPasswordShow(!currentPasswordShow)}
                    >
                        {
                            currentPasswordShow === false ? (
                                <FaRegEye className='text-[18px]' />
                            ) : (
                                <FaEyeSlash className='text-[18px]' />
                            )
                        }
                    </Button>
                    <a href="#" className="text-sm text-[#6467F2] hover:underline mt-1">Forgot Current Password? Click here</a>
                </div>
                <div className="relative flex flex-col gap-1 mb-2">
                    <label className="text-[15px] font-medium text-gray-700">New Password</label>
                    <input
                        type={newPasswordShow === false ? "password" : "text"}
                        className='w-full h-[50px] border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3'
                        name='newPassword'
                        value={formFields.newPassword}
                        placeholder='Enter New Password'
                        disabled={isLoading === true ? true : false}
                        onChange={onChangeInput}
                    />
                    <Button className='absolute! top-[32px] right-[5px] z-50 rounded-full! w-[35px]! h-[35px]! min-w-[35px]! text-gray-600!'
                        onClick={() => setnewPasswordShow(!newPasswordShow)}
                    >
                        {
                            newPasswordShow === false ? (
                                <FaRegEye className='text-[18px]' />
                            ) : (
                                <FaEyeSlash className='text-[18px]' />
                            )
                        }
                    </Button>
                </div>
                <div className="relative flex flex-col gap-1 mb-2">
                    <label className="text-[15px] font-medium text-gray-700">Re-enter Password</label>
                    <input
                        type={confirmPasswordShow === false ? "password" : "text"}
                        className='w-full h-[50px] border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3'
                        name='confirmPassword'
                        value={formFields.confirmPassword}
                        placeholder='Enter Confirm Password'
                        disabled={isLoading === true ? true : false}
                        onChange={onChangeInput}
                    />
                    <Button className='absolute! top-[32px] right-[5px] z-50 rounded-full! w-[35px]! h-[35px]! min-w-[35px]! text-gray-600!'
                        onClick={() => setconfirmPasswordShow(!confirmPasswordShow)}
                    >
                        {
                            confirmPasswordShow === false ? (
                                <FaRegEye className='text-[18px]' />
                            ) : (
                                <FaEyeSlash className='text-[18px]' />
                            )
                        }
                    </Button>
                </div>
                <button 
                type='submit'
                disabled={isLoading === true ? true : false}
                className="mt-2 mb-2 w-full cursor-pointer bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600 transition font-semibold">
                    {
                        isLoading === true ? <CircularProgress color='inherit' />
                            :
                            "Change Password"
                    }
                </button>
            </form>
            
        </div>
    )
}

export default ChangePasswordCard