import Button from '@mui/material/Button';
import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CgLogIn } from 'react-icons/cg';
import { FaRegUser } from 'react-icons/fa';
import RegisterForm from '../components/RegisterForm';
import { registerSeller, socialLogin } from '../authAPI.js';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { firebaseApp } from '../../../firebase';
import { alertBox } from '../../../shared/utils/alert';

const SignUp = () => {
    const [isPasswordShow, setisPasswordShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formFields, setFormFields] = useState({
        name: '',
        email: '',
        password: ''
    });

    const history = useNavigate();

    const goToVerifyAccount = (email) => {
        localStorage.setItem("userEmail", email);
        localStorage.setItem("actionType", "seller-register");
        window.location.assign('/verify-account');
    };

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setFormFields((current) => ({
            ...current,
            [name]: value
        }));
    }

    const valideValue = Object.values(formFields).every(el => el);

    const handleGoogleAuth = () => {
        const auth = getAuth(firebaseApp);
        const googleProvider = new GoogleAuthProvider();

        setIsLoading(true);

        signInWithPopup(auth, googleProvider)
            .then((result) => {
                const user = result.user;
                const googleUserData = {
                    name: user.providerData[0].displayName || '',
                    email: user.providerData[0].email || '',
                    avatar: user.providerData[0].photoURL || '',
                };

                // Use server social-login endpoint which will create-or-login the user
                socialLogin({ ...googleUserData, role: 'seller' })
                    .then((res) => {
                        setIsLoading(false);
                        if (res?.data?.error === false) {
                            alertBox('Success', 'Logged in with Google');
                            window.location.assign('/');
                        } else {
                            alertBox('error', res?.data?.message || 'Social login failed');
                        }
                    })
                    .catch((error) => {
                        setIsLoading(false);
                        alertBox('error', error?.response?.data?.message || error.message || 'Social login failed');
                    });
            })
            .catch((error) => {
                alertBox("error", error.message || "Google authentication failed");
                setIsLoading(false);
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formFields.name === "") {
            alertBox("error", "Please enter full name")
            return false
        }
        if (formFields.email === "") {
            alertBox("error", "Please enter email")
            return false
        }
        if (formFields.password === "") {
            alertBox("error", "Please enter password")
            return false
        }

        setIsLoading(true);

        registerSeller(formFields).then((res) => {
            setIsLoading(false);
            if (res?.data?.error !== true) {
                alertBox("Success", res?.data?.message);
                goToVerifyAccount(formFields.email);
                setFormFields({
                    name: '',
                    email: '',
                    password: ''
                });
            } else {
                alertBox("error", res?.data?.message);
            }
        }).catch((error) => {
            alertBox("error", error?.response?.data?.message || error.message || "Seller registration failed");
            setIsLoading(false);
        });
    }

    return (
        <section className='bg-white w-full '>
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
            <img src="https://t3.ftcdn.net/jpg/05/88/24/10/360_F_588241010_cdQJ2QTsyDtt36jZsAFR45aAXICnPAzR.jpg"
                className='w-full fixed top-0 left-0 opacity-20' />

            <div className='loginBox card md:w-150 w-full h-auto pb-20 mx-auto pt-5 lg:pt-20 relative z-50'>
                <div className='text-center'>
                    <img src="/logo.svg" className='m-auto' />
                </div>

                <h1 className='text-center text-[18px] sm:text-[35px] font-extrabold mt-4'>
                    Create your seller account
                    <br />
                    and wait for admin approval.
                </h1>

                <RegisterForm
                    formFields={formFields}
                    isLoading={isLoading}
                    isPasswordShow={isPasswordShow}
                    onChangeInput={onChangeInput}
                    onTogglePassword={() => setisPasswordShow((current) => !current)}
                    onSubmit={handleSubmit}
                    isValid={valideValue}
                    onGoogleAuth={handleGoogleAuth}
                />

                <div className='px-8 pb-2 pt-3 text-center text-[14px] text-[rgba(0,0,0,0.7)]'>
                    Already have a seller account?{' '}
                    <Link to='/login' className='font-bold hover:underline'>Sign In</Link>
                </div>

            </div>
        </section>
    )
}

export default SignUp;