import React, { useContext, useState } from 'react'
import Button from '@mui/material/Button';
import { MyContext } from '../App';
import { postData } from '../utils/api';
import { useNavigate } from 'react-router-dom';


const VerifyEmail = () => {

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = [];

  const context = useContext(MyContext);
  const navigate = useNavigate();

  const handleOtpChange = (element, index) => {
    const value = element.value.replace(/[^0-9]/g, '');
    if (!value) return;
    let newOtp = [...otp];
    newOtp[index] = value[0];
    setOtp(newOtp);
    // Move to next input
    if (value && index < 5 && inputs[index + 1]) {
      inputs[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        let newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0 && inputs[index - 1]) {
        inputs[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputs[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputs[index + 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');

    if (enteredOtp.length < 6) {
      context.alertBox("error", "Please enter a valid 6-digit OTP");
      return;
    }

    const email = localStorage.getItem("Email");

    if (!email) {
      context.alertBox("error", "Email not found. Please register again.");
      return;
    }

    postData("/api/user/verify-email", { email, otp: enteredOtp })
      .then(response => {
        if (response.error === false) {
          context.alertBox("Success", "Email verified successfully!");
          localStorage.removeItem("Email");
          navigate('/login');
        } else {
          context.alertBox("error", "Invalid OTP. Please try again.");
        }
      })
      .catch(error => {
        context.alertBox("error", "An error occurred. Please try again.");
      });
  }


  return (
    <div className='w-full h-screen flex-col bg-amber-50 p-6 pt-40 relative overflow-hidden'>
      <h2 className='text-2xl font-semibold text-center'>
        Verify Email
      </h2>
      <p className='text-center text-gray-400 mt-2 mb-6'>
        OTP sent to your email <br /> our <a href='#' className='text-blue-500 hover:underline'>{localStorage.getItem("Email")}</a>
      </p>

      <form onSubmit={handleSubmit} className='w-full flex-col justify-center items-center max-w-md mx-auto'>
        <div className='w-full flex-col justify-center items-center max-w-md mx-auto'>
          <div className='flex justify-center gap-2 mt-5 mb-5'>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <input
                key={i}
                ref={el => inputs[i] = el}
                type='text'
                inputMode='numeric'
                maxLength={1}
                className='w-12 h-12 text-center text-xl border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150'
                value={otp[i]}
                onChange={e => handleOtpChange(e.target, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                autoFocus={i === 0}
              />
            ))}
          </div>


          <Button
            type='submit'
            className='w-full! p-2 bg-blue-500! text-white! mt-5! rounded-md hover:bg-blue-600! transition duration-300'
          >
            Verify Email
          </Button>
        </div>
      </form>
      <div className='w-full absolute -bottom-10 left-0 right-0 justify-items-center'>
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

export default VerifyEmail;