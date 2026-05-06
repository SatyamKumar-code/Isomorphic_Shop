import React, { useEffect, useState } from 'react'
import { FaSearch } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { useNavigate } from 'react-router-dom';


const SerchBox = ({ value = '', onChange, onSearch, placeholder = 'Search...' }) => {
    const [searchTerm, setSearchTerm] = useState(value);
    const navigate = useNavigate();

    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    const handleInputChange = (e) => {
        const nextValue = e.target.value;
        setSearchTerm(nextValue);
        onChange?.(nextValue);
    };

    const clearSearch = () => {
        setSearchTerm("");
        onChange?.("");
        onSearch?.("");
    };

    const submitSearch = () => {
        const trimmedValue = searchTerm.trim();

        if (onSearch) {
            onSearch(trimmedValue);
            return;
        }

        navigate(`/search${trimmedValue ? `?q=${encodeURIComponent(trimmedValue)}` : ''}`);
    };


    return (
        <div className='flex relative mt-4 w-full items-center gap-1 bg-gray-100 rounded-full'>
            <FaSearch className='text-gray-500 ml-2' />
            <input
                type="text"
                placeholder={placeholder}
                className='bg-transparent border-none focus:outline-none w-full h-10'
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        submitSearch();
                    }
                }}
            />
            {searchTerm && (
                <div className='absolute right-10 w-5 h-5 flex items-center justify-center bg-gray-700 rounded-full cursor-pointer' onClick={clearSearch}>
                    <RxCross2 className='text-white font-bold' />
                </div>
            )}
            <button
                type='button'
                className='absolute right-2 rounded-full bg-blue-500 px-3 py-1 text-[12px] font-semibold text-white'
                onClick={submitSearch}
            >
                Go
            </button>
        </div>
    )
}

export default SerchBox