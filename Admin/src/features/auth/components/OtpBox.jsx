import React, { useState, useCallback } from "react";

const  OtpBox = React.memo(({ lenght, onChange }) => {
    const [otp, setOtp] = useState(new Array(lenght).fill(""));

    const handleChange = useCallback((element, index) => {
        const value = element.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        onChange(newOtp.join(""));

        if (value && index < lenght - 1) {
            const nextInput = document.getElementById(`otp-input-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    }, [otp, lenght, onChange]);

    const handleKeyDown = useCallback((event, index) => {
        if (event.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-input-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    }, [otp]);

    return (
        <div style={{display:"flex", gap: "5px", justifyContent:"center"}} className="otpBox">
            {otp.map((data, index) => (
                <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    maxLength="1" 
                    value={otp[index]}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-10 bg-gray-200 dark:bg-gray-700 dark:border-gray-600 text-black dark:text-[#fafafa] border-2 border-gray-300 h-10 sm:w-11.25 sm:h-11.25 text-center text-[17px]"
                />
            ))}
        </div>
    )
});

export default OtpBox;