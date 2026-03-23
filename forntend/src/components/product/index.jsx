import React, { useState } from 'react'
import { FaRegHeart } from "react-icons/fa";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Pagination, Navigation } from 'swiper/modules';

const Product = () => {
  return (

    <Swiper
      slidesPerView={2.5}
      spaceBetween={10}
      modules={[Pagination]}
      className="mySwiper"
    >
      <SwiperSlide>
        <div className='relative h-35.75 bg-white'>
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFYqoKTu_o3Zns2yExbst2Co84Gpc2Q1RJbA&s" alt="" className='w-full h-24.75! rounded-t-lg' />
          <div className='p-2 w-full h-11 leading-tight bg-gray-100'>
            <h2 className='font-bold text-[12px]'>Product Name</h2>
            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
          </div>
          <div className='absolute top-2 right-2'>
            <FaRegHeart className='text-gray-500 text-lg' />
          </div>
        </div>
      </SwiperSlide>
      <SwiperSlide>
        <div className='relative h-35.75 bg-white'>
          <img src="https://static.vecteezy.com/system/resources/thumbnails/060/843/811/small/close-up-of-raindrops-on-leaves-hd-background-luxury-hd-wallpaper-image-trendy-background-illustration-free-photo.jpg" alt="" className='w-full h-24.75! rounded-t-lg' />
          <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
            <h2 className='font-bold text-[12px]'>Product Name</h2>
            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
          </div>
          <div className='absolute top-2 right-2'>
            <FaRegHeart className='text-gray-500 text-lg' />
          </div>
        </div>
      </SwiperSlide>
      <SwiperSlide>
        <div className='relative h-35.75 bg-white'>
          <img src="https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80" alt="" className='w-full! h-24.75! rounded-t-lg' />
          <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
            <h2 className='font-bold text-[12px]'>Product Name</h2>
            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
          </div>
          <div className='absolute top-2 right-2'>
            <FaRegHeart className='text-gray-500 text-lg' />
          </div>
        </div>
      </SwiperSlide>
      <SwiperSlide>
        <div className='relative h-35.75 bg-white'>
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFYqoKTu_o3Zns2yExbst2Co84Gpc2Q1RJbA&s" alt="" className='w-full h-24.75! rounded-t-lg' />
          <div className='p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
            <h2 className='font-bold text-[12px]'>Product Name</h2>
            <p className='text-blue-500 font-bold text-[12px]'>$99.99</p>
          </div>
          <div className='absolute top-2 right-2'>
            <FaRegHeart className='text-gray-500 text-lg' />
          </div>
        </div>
      </SwiperSlide>
    </Swiper>
  )
}

export default Product;