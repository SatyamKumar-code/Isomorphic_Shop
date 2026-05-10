import React from 'react'
import { FaArrowLeftLong } from 'react-icons/fa6';

const BackButton = () => {
    const handleBack = () => {
        window.history.back();
    }
    return (
        <button
            onClick={handleBack}
            className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors'
            aria-label='Go back'
            type='button'
        >
            <FaArrowLeftLong />
        </button>
    )
}

export default BackButton