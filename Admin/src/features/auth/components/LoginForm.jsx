import { useEffect, useState } from "react";
import { useAuth } from "../../../Context/auth/useAuth";
import { useNavigate } from "react-router-dom";
import { FaRegEye, FaEyeSlash } from 'react-icons/fa';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { alertBox } from "../../../shared/utils/alert";

const LoginForm = () => {
    const { login, isLoading, isLoggedIn } = useAuth();
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
    }, [ isLoggedIn ]);

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

    return (
        <form className='w-full px-8 mt-3' onSubmit={handleSubmit}>
            <div className='form-group mb-4 w-full'>
                <h4 className='text-[14px] font-[500] mb-1'>
                    Email
                </h4>
                <input
                    type="email"
                    id="email"
                    name='email'
                    value={formData.email}
                    disabled={isLoading === true ? true : false}
                    onChange={onChangeInput}
                    className='w-full h-[50px] border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3'
                />
            </div>

            <div className='form-group mb-4 w-full'>
                <h4 className='text-[14px] font-[500] mb-1'>
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
                        className='w-full h-[50px] border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3'
                    />
                    <Button className='absolute! top-[7px] right-[10px] z-50 rounded-full! w-[35px]! h-[35px]! min-w-[35px]! text-gray-600!'
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
                    // onClick={forgotPassword}
                    className='text-primary text-[15px] font-[700] text-[rgba(0,0,0,0.7)] hover:underline hover:text-gray-700! cursor-pointer'>
                    Forgot Password?
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
        </form>
    );
};

export default LoginForm;

