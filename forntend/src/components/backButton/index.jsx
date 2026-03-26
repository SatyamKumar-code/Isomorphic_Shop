import React from 'react'
import { FaArrowLeftLong } from 'react-icons/fa6';

const BackButton = () => {
    const handleBack = () => {
        window.history.back();
    }
    return (
        <div>
            <div className='w-10 h-10 bg-gray-100 rounded-full items-center justify-center flex cursor-pointer' onClick={handleBack}>
                <FaArrowLeftLong />
            </div>
        </div>
    )
}

export default BackButton