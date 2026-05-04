import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom';
import BackButton from '../backButton'
import { FaCartArrowDown } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";
import { postData } from '../../utils/api';

const getViewerKey = () => {
    const storageKey = 'product-viewer-id';
    const existingViewerKey = localStorage.getItem(storageKey);

    if (existingViewerKey) {
        return existingViewerKey;
    }

    const newViewerKey = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    localStorage.setItem(storageKey, newViewerKey);
    return newViewerKey;
};

const getCountryCode = () => {
    const language = navigator.language || navigator.languages?.[0] || '';
    const regionMatch = language.match(/-([a-z]{2})$/i);

    return regionMatch?.[1]?.toUpperCase() || '';
};

const ProductDetails = () => {
    const { id } = useParams();

    useEffect(() => {
        if (!id) {
            return;
        }

        postData('/api/dashboard/product-view', {
            productId: id,
            viewerKey: getViewerKey(),
            countryCode: getCountryCode(),
        });
    }, [id]);

    return (
        <div className='relative w-full h-screen product-details-page'>
            <div className='absolute top-4 left-4'>
                <BackButton />
            </div>
            <div className='w-full h-100 bg-amber-50 rounded-b-xl overflow-hidden flex items-center justify-center'>
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFYqoKTu_o3Zns2yExbst2Co84Gpc2Q1RJbA&s" alt="" className='w-full h-100' />
            </div>
            <div className='absolute top-4! right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center'>
                <FaHeart className='text-gray-400 text-lg' />
            </div>
            <div className='p-4 w-full'>
                <h1 className='text-xl font-bold'>Product Name</h1>
                <span className='text-blue-500 font-bold flex justify-end!'>$99.99</span>
                <div className='-mt-4'>
                    <div className="flex items-center mb-2">
                        <span className="text-yellow-400 text-xl mr-2">★</span>
                        <span className="text-gray-600 text-sm">4.0 (120 reviews)</span>
                    </div>
                </div>
                <div>
                    <h2 className='text-lg font-bold mb-2'>Description</h2>
                    <p className='text-gray-700 text-sm'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                </div>

                <div className='mt-4 mb-15'>
                    <h4 className='text-lg font-bold mb-2'>Size</h4>
                    <div className='w-10 h-10 rounded-md flex'>
                        <button className='border font-bold border-gray-400 rounded-md px-3 py-1 mr-2 mb-2'>8</button>
                        <button className='border font-bold border-gray-400 rounded-md px-3 py-1 mr-2 mb-2'>9</button>
                        <button className='border font-bold border-gray-400 rounded-md px-3 py-1 mr-2 mb-2'>10</button>
                        <button className='border font-bold border-gray-400 rounded-md px-3 py-1 mr-2 mb-2'>11</button>
                    </div>

                </div>
            </div>
            <div className='fixed bottom-1 left-0 p-3 right-0'>
                <div className='flex relative items-center'>
                    <button className='w-[70%] bg-blue-500 text-white p-3 rounded-full font-bold'>Buy Now</button>
                    <FaCartArrowDown className='absolute items-center right-10 text-3xl ' />
                </div>
            </div>
        </div>
    )
}

export default ProductDetails