import React, { useState } from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import { HiMiniHome } from "react-icons/hi2";
import { FaSearch } from "react-icons/fa";
import { MdShoppingBag } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { Link } from 'react-router-dom';

export default function Footer() {
    const [value, setValue] = useState('recents');

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <div className='fixed bottom-0 left-0 right-0 z-10'>
            <BottomNavigation 
                value={value} 
                onChange={handleChange}
                className='bg-gray-100!'
            >
                <BottomNavigationAction
                    value="home"
                    icon={<Link to="/"><HiMiniHome className='text-2xl' /></Link>} />
                <BottomNavigationAction
                    value="search"
                    icon={<Link to="/search"><FaSearch className='text-2xl' /></Link>}
                />
                <BottomNavigationAction
                    value="nearby"
                    icon={<Link to="/cart"><MdShoppingBag className='text-2xl' /></Link>}
                />
                <BottomNavigationAction
                    value="folder"
                    icon={<Link to="/profile"><FaUser className='text-2xl' /></Link>}
                />
            </BottomNavigation>
        </div>
    );
}
