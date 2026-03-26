import React from 'react'
import SerchBox from '../components/serchBox'
import { FaRegHeart } from 'react-icons/fa'
import { IoMdAddCircle } from "react-icons/io";
import { Link } from 'react-router-dom';
import Footer from '../components/footer';

const Search = () => {

    return (
        <div>
            <SerchBox />
            <div className='flex items-center justify-between mt-4'>
                <h2 className='font-bold text-[14px] text-gray-500 '>Results for <span className='text-black text-[16px]'>"shose"</span></h2>
                <p className='text-blue-500 text-[14px] font-bold'>6 Results Found</p>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 mt-4 mb-20'>
                <div className='relative h-45.75 bg-white'>
                    <Link to="/product/1">
                        <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80" alt="" className='w-full! h-34.75! rounded-t-lg' />
                    </Link>
                    <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                        <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                            <h2 className='font-bold text-[12px]'>Product Name</h2>
                            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
                        </div>
                        <IoMdAddCircle className='text-blue-500 text-2xl cursor-pointer' />
                    </div>
                    <div className='absolute top-2 right-2'>
                        <FaRegHeart className='text-gray-500 text-lg' />
                    </div>
                </div>

                <div className='relative h-45.75 bg-white'>
                    <Link to="/product/2">
                    <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80" alt="" className='w-full! h-34.75! rounded-t-lg' />
                    </Link>
                    <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                        <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                            <h2 className='font-bold text-[12px]'>Product Name</h2>
                            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
                        </div>
                        <IoMdAddCircle className='text-blue-500 text-2xl cursor-pointer' />
                    </div>
                    <div className='absolute top-2 right-2'>
                        <FaRegHeart className='text-gray-500 text-lg' />
                    </div>
                </div>

                <div className='relative h-45.75 bg-white'>
                    <Link to="/product/3">
                    <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80" alt="" className='w-full! h-34.75! rounded-t-lg' />
                    </Link>
                    <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                        <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                            <h2 className='font-bold text-[12px]'>Product Name</h2>
                            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
                        </div>
                        <IoMdAddCircle className='text-blue-500 text-2xl cursor-pointer' />
                    </div>
                    <div className='absolute top-2 right-2'>
                        <FaRegHeart className='text-gray-500 text-lg' />
                    </div>
                </div>

                <div className='relative h-45.75 bg-white'>
                    <Link to="/product/4">
                    <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80" alt="" className='w-full! h-34.75! rounded-t-lg' />
                    </Link>
                    <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                        <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                            <h2 className='font-bold text-[12px]'>Product Name</h2>
                            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
                        </div>
                        <IoMdAddCircle className='text-blue-500 text-2xl cursor-pointer' />
                    </div>
                    <div className='absolute top-2 right-2'>
                        <FaRegHeart className='text-gray-500 text-lg' />
                    </div>
                </div>

                <div className='relative h-45.75 bg-white'>
                    <Link to="/product/5">
                    <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80" alt="" className='w-full! h-34.75! rounded-t-lg' />
                    </Link>
                    <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                        <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                            <h2 className='font-bold text-[12px]'>Product Name</h2>
                            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
                        </div>
                        <IoMdAddCircle className='text-blue-500 text-2xl cursor-pointer' />
                    </div>
                    <div className='absolute top-2 right-2'>
                        <FaRegHeart className='text-gray-500 text-lg' />
                    </div>
                </div>


                <div className='relative h-45.75 bg-white'>
                    <Link to="/product/6">
                    <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80" alt="" className='w-full! h-34.75! rounded-t-lg' />
                    </Link>
                    <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                        <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                            <h2 className='font-bold text-[12px]'>Product Name</h2>
                            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
                        </div>
                        <IoMdAddCircle className='text-blue-500 text-2xl cursor-pointer' />
                    </div>
                    <div className='absolute top-2 right-2'>
                        <FaRegHeart className='text-gray-500 text-lg' />
                    </div>
                </div>

                <div className='relative h-45.75 bg-white'>
                        <Link to="/product/7">
                    <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80" alt="" className='w-full! h-34.75! rounded-t-lg' />
                    </Link>
                    <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                        <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                            <h2 className='font-bold text-[12px]'>Product Name</h2>
                            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
                        </div>
                        <IoMdAddCircle className='text-blue-500 text-2xl cursor-pointer' />
                    </div>
                    <div className='absolute top-2 right-2'>
                        <FaRegHeart className='text-gray-500 text-lg' />
                    </div>
                </div>


                <div className='relative h-45.75 bg-white'>
                    <Link to="/product/8">
                    <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80" alt="" className='w-full! h-34.75! rounded-t-lg' />
                    </Link>
                    <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                        <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                            <h2 className='font-bold text-[12px]'>Product Name</h2>
                            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
                        </div>
                        <IoMdAddCircle className='text-blue-500 text-2xl cursor-pointer' />
                    </div>
                    <div className='absolute top-2 right-2'>
                        <FaRegHeart className='text-gray-500 text-lg' />
                    </div>
                </div>

                <div className='relative h-45.75 bg-white'>
                    <Link to="/product/9">
                    <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80" alt="" className='w-full! h-34.75! rounded-t-lg' />
                    </Link>
                    <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                        <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                            <h2 className='font-bold text-[12px]'>Product Name</h2>
                            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
                        </div>
                        <IoMdAddCircle className='text-blue-500 text-2xl cursor-pointer' />
                    </div>
                    <div className='absolute top-2 right-2'>
                        <FaRegHeart className='text-gray-500 text-lg' />
                    </div>
                </div>

                <div className='relative h-45.75 bg-white'>
                    <Link to="/product/10">
                    <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80" alt="" className='w-full! h-34.75! rounded-t-lg' />
                    </Link>
                    <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                        <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                            <h2 className='font-bold text-[12px]'>Product Name</h2>
                            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
                        </div>
                        <IoMdAddCircle className='text-blue-500 text-2xl cursor-pointer' />
                    </div>
                    <div className='absolute top-2 right-2'>
                        <FaRegHeart className='text-gray-500 text-lg' />
                    </div>
                </div>

                <div className='relative h-45.75 bg-white'>
                    <Link to="/product/11">
                    <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80" alt="" className='w-full! h-34.75! rounded-t-lg' />
                    </Link>
                    <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                        <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                            <h2 className='font-bold text-[12px]'>Product Name</h2>
                            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
                        </div>
                        <IoMdAddCircle className='text-blue-500 text-2xl cursor-pointer' />
                    </div>
                    <div className='absolute top-2 right-2'>
                        <FaRegHeart className='text-gray-500 text-lg' />
                    </div>
                </div>

                <div className='relative h-45.75 bg-white'>
                    <Link to="/product/12">
                    <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80" alt="" className='w-full! h-34.75! rounded-t-lg' />
                    </Link>
                    <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                        <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                            <h2 className='font-bold text-[12px]'>Product Name</h2>
                            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
                        </div>
                        <IoMdAddCircle className='text-blue-500 text-2xl cursor-pointer' />
                    </div>
                    <div className='absolute top-2 right-2'>
                        <FaRegHeart className='text-gray-500 text-lg' />
                    </div>
                </div>

                <div className='relative h-45.75 bg-white'>
                    <Link to="/product/13">
                    <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80" alt="" className='w-full! h-34.75! rounded-t-lg' />
                    </Link>
                    <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                        <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                            <h2 className='font-bold text-[12px]'>Product Name</h2>
                            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
                        </div>
                        <IoMdAddCircle className='text-blue-500 text-2xl cursor-pointer' />
                    </div>
                    <div className='absolute top-2 right-2'>
                        <FaRegHeart className='text-gray-500 text-lg' />
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}

export default Search