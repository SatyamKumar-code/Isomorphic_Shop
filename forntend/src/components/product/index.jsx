import React, { useEffect, useState } from 'react'
import { FaRegHeart } from "react-icons/fa";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Pagination, Navigation } from 'swiper/modules';
import { Link } from 'react-router-dom';
import { fetchDataFromApi } from '../../utils/api';

const formatPrice = (value) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString('en-IN')}`;
};

const Product = ({ endpoint = '/api/product/latest', limit = 10 }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setIsLoading(true);
      const querySeparator = endpoint.includes('?') ? '&' : '?';
      const response = await fetchDataFromApi(`${endpoint}${querySeparator}limit=${limit}`);

      if (!isMounted) {
        return;
      }

      setProducts(response?.products || []);
      setIsLoading(false);
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [endpoint, limit]);

  return (

    <Swiper
      slidesPerView={2.5}
      spaceBetween={10}
      modules={[Pagination]}
      className="mySwiper"
    >
      {isLoading && Array.from({ length: 4 }).map((_, index) => (
        <SwiperSlide key={`product-skeleton-${index}`}>
          <div className='relative h-35.75 animate-pulse rounded-lg bg-white'>
            <div className='h-24.75 rounded-t-lg bg-gray-200' />
            <div className='p-2'>
              <div className='mb-2 h-3 w-3/4 rounded bg-gray-200' />
              <div className='h-3 w-1/2 rounded bg-gray-200' />
            </div>
          </div>
        </SwiperSlide>
      ))}

      {!isLoading && products.map((product) => {
        const productImage = product?.images?.[0] || 'https://via.placeholder.com/300x300?text=Product';
        const productId = product?._id || product?.id;

        return (
          <SwiperSlide key={productId}>
            <Link to={`/product/${productId}`}>
              <div className='relative h-35.75 overflow-hidden rounded-lg bg-white'>
                <img
                  src={productImage}
                  alt={product?.productName || 'Product'}
                  className='h-24.75 w-full rounded-t-lg object-cover'
                />
                <div className='h-11 overflow-hidden bg-gray-100 p-2 leading-tight'>
                  <h2 className='truncate text-[12px] font-bold'>{product?.productName || 'Product Name'}</h2>
                  <p className='text-[12px] font-bold text-blue-500'>{formatPrice(product?.price)}</p>
                </div>
                <div className='absolute right-2 top-2'>
                  <FaRegHeart className='text-lg text-gray-500' />
                </div>
              </div>
            </Link>
          </SwiperSlide>
        );
      })}
    </Swiper>
  )
}

export default Product;