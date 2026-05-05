import { useEffect, useState } from "react";
import { useAuth } from "../../../Context/auth/useAuth";
import { useNavigate } from "react-router-dom";
import { FaRegEye, FaEyeSlash } from 'react-icons/fa';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { alertBox } from "../../../shared/utils/alert";
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { firebaseApp } from "../../../firebase";
import { forgotPasswordRequest } from '../authAPI.js';
import { FcGoogle } from "react-icons/fc";

const LoginForm = () => {
    const { login, isLoading, isLoggedIn } = useAuth();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isForgotLoading, setIsForgotLoading] = useState(false);
    const [isPasswordShow, setisPasswordShow] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    }

    useEffect(() => {
        if (isLoggedIn === true) {
            navigate("/");
        }
    }, [isLoggedIn]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formData.email === "") {
            alertBox("error", "Please enter email")
            return false
        }
        if (formData.password === "") {
            alertBox("error", "Please enter password")
            return false
        }

        login(formData);
    };

    const handleGoogleAuth = () => {
        const auth = getAuth(firebaseApp);
        const googleProvider = new GoogleAuthProvider();

        setIsGoogleLoading(true);

        signInWithPopup(auth, googleProvider)
            .then((result) => {
                const user = result.user;
                const googleUserData = {
                    name: user.providerData[0].displayName || '',
                    email: user.providerData[0].email || '',
                    password: 'google-auth-' + user.uid,
                    avatar: user.providerData[0].photoURL || '',
                };

                // Use social-login endpoint on server which will create-or-login based on email
                import('../authAPI.js').then(({ socialLogin }) => {
                    socialLogin({
                        name: googleUserData.name,
                        email: googleUserData.email,
                        avatar: googleUserData.avatar,
                        role: 'seller'
                    }).then((res) => {
                        setIsGoogleLoading(false);
                        if (res?.data?.error === false) {
                            // refresh profile from auth context
                            try {
                                // eslint-disable-next-line react-hooks/rules-of-hooks
                                const auth = require('../../../Context/auth/useAuth');
                            } catch (e) { }
                            alertBox('Success', 'Logged in with Google');
                            // trigger a full page reload to pick up cookies and profile
                            window.location.assign('/');
                        } else {
                            alertBox('error', res?.data?.message || 'Social login failed');
                        }
                    }).catch((err) => {
                        setIsGoogleLoading(false);
                        alertBox('error', err?.response?.data?.message || err.message || 'Social login failed');
                    });
                }).catch((e) => {
                    setIsGoogleLoading(false);
                    alertBox('error', 'Unable to load auth API');
                });
            })
            .catch((error) => {
                setIsGoogleLoading(false);
                alertBox('error', error.message || 'Google authentication failed');
            });
    };

    const handleForgotPassword = async () => {
        const email = formData.email?.trim();

        if (!email) {
            alertBox("error", "Please enter email first");
            return;
        }

        try {
            setIsForgotLoading(true);
            const res = await forgotPasswordRequest({ email });

            if (res?.data?.error === false) {
                localStorage.setItem("userEmail", email);
                localStorage.setItem("actionType", "forgot-password");
                alertBox("Success", res?.data?.message || "OTP sent to your email");
                navigate('/verify-account');
                return;
            }

            alertBox("error", res?.data?.message || "Unable to process forgot password request");
        } catch (error) {
            alertBox("error", error?.response?.data?.message || error.message || "Unable to process forgot password request");
        } finally {
            setIsForgotLoading(false);
        }
    };

    return (
        <form className='w-full px-8 mt-3' onSubmit={handleSubmit}>
            <div className='form-group mb-4 w-full'>
                <h4 className='text-[14px] font-medium mb-1'>
                    Email
                </h4>
                <input
                    type="email"
                    id="email"
                    name='email'
                    value={formData.email}
                    disabled={isLoading === true ? true : false}
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
                        id="password"
                        name='password'
                        value={formData.password}
                        disabled={isLoading === true ? true : false}
                        onChange={onChangeInput}
                        type={isPasswordShow === false ? "password" : "text"}
                        className='w-full h-12.5 border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3'
                    />
                    <Button className='absolute! top-1.75 right-2.5 z-50 rounded-full! w-8.75! h-8.75! min-w-8.75! text-gray-600!'
                        onClick={() => setisPasswordShow(!isPasswordShow)}
                    >
                        {
                            isPasswordShow === false ? (
                                <FaRegEye className='text-[18px]' />
                            ) : (
                                <FaEyeSlash className='text-[18px]' />
                            )
                        }
                    </Button>
                </div>

            </div>

            <div className='form-group mb-4 w-full flex items-center justify-between'>
                <FormControlLabel
                    control={<Checkbox defaultChecked />}
                    label="Remember me"
                />
                <a
                    onClick={handleForgotPassword}
                    className='text-primary text-[15px] font-bold text-[rgba(0,0,0,0.7)] hover:underline hover:text-gray-700! cursor-pointer'>
                    {isForgotLoading ? "Checking..." : "Forgot Password?"}
                </a>
            </div>


            <Button
                type='submit'
                disabled={isLoading}
                className='btn-blue w-full '
            >
                {
                    isLoading === true ? <CircularProgress color='inherit' />
                        :
                        "Log in"
                }

            </Button>
            <div className='w-full text-center my-3 text-[14px] text-[rgba(0,0,0,0.6)]'>or</div>

            <Button
                variant='outlined'
                onClick={handleGoogleAuth}
                disabled={isGoogleLoading || isLoading}
                className='w-full h-12.5 border-none! bg-[rgba(0,0,0,0.1)]! hover:bg-[rgba(0,0,0,0.05)]! transition-colors'
            >
                {
                    isGoogleLoading === true ? <CircularProgress size={20} color='inherit' />
                        :
                        <>
                            <FcGoogle className='text-[20px]' />
                            "Sign in with Google"
                        </>
                }
            </Button>
        </form>
    );
};

export default LoginForm;

