import React, { useState } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import OtpBox from './OtpBox';
import api from '../../../services/api';
import { alertBox } from '../../../shared/utils/alert';
import { useNavigate } from 'react-router-dom';
import { verifyForgotPasswordOtp } from '../authAPI';

const VERIFY_EMAIL_ENDPOINT = '/api/user/verify-email';

const VerifyAccountForm = () => {
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleOtpChange = (value) => setOtp(value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!otp) {
            alertBox('error', 'Please enter OTP');
            return;
        }

        const email = localStorage.getItem('userEmail');
        const actionType = localStorage.getItem('actionType');
        if (!email) {
            alertBox('error', 'No email found. Please register again.');
            return;
        }

        try {
            setIsLoading(true);

            if (actionType === 'forgot-password') {
                const res = await verifyForgotPasswordOtp({ email, otp });
                if (res?.data?.error === false) {
                    localStorage.setItem('actionType', 'forgot-password-verified');
                    alertBox('Success', res?.data?.message || 'OTP verified');
                    navigate('/forgot-password');
                    return;
                }

                alertBox('error', res?.data?.message || 'Invalid OTP');
                return;
            }

            const res = await api.post(VERIFY_EMAIL_ENDPOINT, { email, otp });
            if (res?.data?.error === false) {
                localStorage.removeItem('userEmail');
                localStorage.removeItem('actionType');
                alertBox('Success', res?.data?.message || 'Email verified');
                navigate('/login');
                return;
            }
            alertBox('error', res?.data?.message || 'Invalid OTP');
        } catch (err) {
            alertBox('error', err?.response?.data?.message || err.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="text-center flex items-center justify-center flex-col">
                <OtpBox lenght={6} onChange={handleOtpChange} />
            </div>

            <div className="w-72 m-auto mt-6">
                <Button type="submit" className="btn-blue w-full">
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
                </Button>
            </div>
        </form>
    );
};

export default VerifyAccountForm;
