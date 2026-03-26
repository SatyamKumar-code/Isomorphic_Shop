import React, { useState } from 'react'
import { FaSearch } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";


const SerchBox = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm("");
    };


    return (
        <div className='flex relative mt-4 w-full items-center gap-1 bg-gray-100 rounded-full'>
            <FaSearch className='text-gray-500 ml-2' />
            <input type="text" placeholder="Search..." className='bg-transparent border-none focus:outline-none w-full h-10' value={searchTerm} onChange={handleInputChange} />
            {searchTerm && (
                <div className='absolute right-2 w-5 h-5 flex items-center justify-center bg-gray-700 rounded-full cursor-pointer' onClick={clearSearch}>
                    <RxCross2 className='text-white font-bold' />
                </div>
            )}
        </div>
    )
}

export default SerchBox