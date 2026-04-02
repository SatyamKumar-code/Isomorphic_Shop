import Button from '@mui/material/Button';
import React, { useState } from 'react'
import { Link,useNavigate, NavLink } from 'react-router-dom';
import { CgLogIn } from 'react-icons/cg';
import LoadingButton from '@mui/lab/LoadingButton';
import { FcGoogle } from 'react-icons/fc';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from '../../../firebase';
import LoginForm from '../components/LoginForm';

const auth = getAuth(firebaseApp);

const googleProvider = new GoogleAuthProvider();

const Login = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [isPasswordShow, setisPasswordShow] = useState(false);
    const [formFields, setFormFields] = useState({
        email: '',
        password: ''
    });
    const history = useNavigate();

    const forgotPassword = () => {

        if (formFields.email === "") {
            context.alertBox("error", "Please enter email id")
            return false
        } else {
            context.alertBox("Success", `OTP send to ${formFields.email}`)
            localStorage.setItem("userEmail", formFields.email);
            localStorage.setItem("actionType", "forgot-password");

            postData("/api/user/forget-password", {
                email: formFields.email
            }).then((res) => {
                if (res?.error === false) {
                    context.alertBox("Success", res?.message);
                    history('/verify-account');
                } else {
                    context.alertBox("error", res?.message);
                }
            })
        }

    }

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setFormFields({
            ...formFields,
            [name]: value
        });
    }

    const valideValue = Object.values(formFields).every(el => el);

    const handleSubmit = (e) => {
        e.preventDefault();

        setIsLoading(true);

        if (formFields.email === "") {
            context.alertBox("error", "Please enter email")
            return false
        }
        if (formFields.password === "") {
            context.alertBox("error", "Please enter password")
            return false
        }

        postData("/api/user/login", formFields, { withCredentials: true }).then((res) => {
            setIsLoading(true);
            
            if (res?.error !== true) {
                if(res?.user?.role !== "admin"){
                    context.alertBox("error", "You are not authorized to access this page");
                    setIsLoading(false);
                    return false;
                }
                setIsLoading(false);
                context.alertBox("Success", res?.message);
                setFormFields({
                    email: '',
                    password: ''
                });
                localStorage.setItem("accessToken", res?.user?.accessToken);
                localStorage.setItem("refreshToken", res?.user?.refreshToken);

                context.setIsLoggedIn(true);

                history('/');
            } else {
                context.alertBox("error", res?.message);
                setIsLoading(false);
            }

        })
    }

    const authWithGoogle = () => {
        setLoadingGoogle(true);
        signInWithPopup(auth, googleProvider)
            .then((result) => {
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                const user = result.user;

                const field = {
                    name: user.providerData[0].displayName,
                    email: user.providerData[0].email,
                    password: null,
                    avatar: user.providerData[0].photoURL,
                    mobile: user.providerData[0].phoneNumber,
                    role: "admin",

                }

                // postData("/api/user/authWithGoogle", field).then((res) => {
            
                //     if (res?.error !== true) {
                //         setIsLoading(false);
                //         console.log(res);
                        
                //         if(res?.user?.role !== "ADMIN"){
                //             context.alertBox("error", "You are not authorized to access this page");
                //             setLoadingGoogle(false);
                //             return false;
                //         }


                //         context.alertBox("Success", res?.message);
                //         localStorage.setItem("accessToken", res?.user?.accessToken);
                //         localStorage.setItem("refreshToken", res?.user?.refreshToken);
                //         setIsLoading(false);
                //         context.setIsLoggedIn(true);
                //         setLoadingGoogle(false);
                //         history('/');
                //     } else {
                //         context.alertBox("error", res?.message);
                //         setIsLoading(false); 
                //         setLoadingGoogle(false);
                //     }

                // })

            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                const email = error.customData ? error.customData.email : undefined;
                const credential = GoogleAuthProvider.credentialFromError(error);
                setLoadingGoogle(false);
                setIsLoading(false);
                context.alertBox("error", errorMessage || "Google sign-in failed");
            })

    }


  return (
    <section className='bg-white dark:bg-gray-800 w-full '>
        <header className='w-full static lg:fixed top-0 left-0 px-4 py-3 flex items-center justify-center sm:justify-between z-50'>
            <Link to="/">
                <img src="/logo1.svg" alt="Logo"
                className='w-[150px]!'/>
            </Link>


            <div className='hidden sm:flex items-center gap-0 sm:hidden'>
              <NavLink to="/login" exact={true} activeClassName="active">
                <Button className='rounded-full! text-[rgba(0,0,0,0.8)]! px-5! flex gap-1'>
                   <CgLogIn className='text-[18px]' /> Login
                </Button>
              </NavLink>
            </div>
        </header>
             <img src="https://t3.ftcdn.net/jpg/05/88/24/10/360_F_588241010_cdQJ2QTsyDtt36jZsAFR45aAXICnPAzR.jpg" 
        className='w-full fixed top-0 left-0 opacity-20'/>

        <div className='loginBox card md:w-[600px] w-full h-auto pb-20 mx-auto pt-5 lg:pt-20 relative z-50'>
            <div className='text-center'>
                <img src="/logo.svg"  className='m-auto'/>
            </div>

            <h1 className='text-center text-[18px] sm:text-[35px] font-[800] mt-4'>
                Welcome Back
                !<br />
                sign in with your credentials.
            </h1>

            <div className='flex items-center justify-center w-full mt-5 gap-4'>

                <LoadingButton
                    size="small"
                    onClick={authWithGoogle}
                    endIcon={<FcGoogle />}
                    loading={loadingGoogle}
                    loadingPosition="end"
                    variant="outlined"
                    className='bg-none! py-2! text-[15px]! capitalize! px-5! text-[rgba(0,0,0,0.7)]!'
                >
                    Signin with Google
                </LoadingButton>
            </div>

            <br />
            
            <div className='w-full flex items-center justify-center gap-3'>
                <span className='flex items-center w-[100px] h-[1px] bg-[rgba(0,0,0,0.2)]'></span>
                   <span className='text-[10px] lg:text-[14px] font-[500]'>Or, Sign in with your email</span>
                <span className='flex items-center w-[100px] h-[1px] bg-[rgba(0,0,0,0.2)]'></span>
            </div>

            <br />

            {/* <form /> */}

            <LoginForm />

            

        </div> 
    </section>
  )
}

export default Login;