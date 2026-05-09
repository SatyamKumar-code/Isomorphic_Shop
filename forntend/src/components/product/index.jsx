import React, { useContext, useEffect, useState } from 'react'
import { FaRegHeart } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";
import { IoMdAddCircle } from "react-icons/io";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Pagination, Navigation } from 'swiper/modules';
import { Link, useNavigate } from 'react-router-dom';
import { deleteData, fetchDataFromApi, postData } from '../../utils/api';
import { MyContext } from '../../App';

const formatPrice = (value) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString('en-IN')}`;
};

const Product = ({ endpoint = '/api/product/latest', limit = 10 }) => {
  const context = useContext(MyContext);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [activeProductId, setActiveProductId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadCartDetails = async () => {
      try {
        const response = await fetchDataFromApi('/api/cart/details');
        if (response?.error === false && response?.data?.products) {
          setCartItems(response.data.products);
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error('Error fetching cart details:', error);
        setCartItems([]);
      }
    };

    loadCartDetails();
  }, []);

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

  const isProductInCart = (productId) => {
    if (!productId || !cartItems?.length) {
      return false;
    }

    const productIdStr = String(productId).trim();
    return cartItems.some((item) => {
      const itemProductId = String(item?.productId?._id || item?.productId || item?._id || '').trim();
      return itemProductId === productIdStr;
    });
  };

  const refreshCart = async () => {
    const response = await fetchDataFromApi('/api/cart/details');
    if (response?.error === false && response?.data?.products) {
      setCartItems(response.data.products);
    } else {
      setCartItems([]);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!productId || activeProductId) {
      return;
    }

    if (isProductInCart(productId)) {
      context?.alertBox?.('error', 'Product is already in your cart');
      return;
    }

    setActiveProductId(productId);
    const response = await postData('/api/cart/add', {
      productId,
      quantity: 1,
    });
    setActiveProductId(null);

    if (response?.error === false) {
      context?.alertBox?.('Success', 'Added to cart');
      await refreshCart();
      return;
    }

    context?.alertBox?.('error','Login first.');
    navigate('/login');
  };

  const handleRemoveFromCart = async (productId) => {
    if (!productId || activeProductId) {
      return;
    }

    setActiveProductId(productId);
    const response = await deleteData(`/api/cart/remove/${productId}`);
    setActiveProductId(null);

    if (response?.error === false) {
      context?.alertBox?.('Success', 'Removed from cart');
      await refreshCart();
      return;
    }

    context?.alertBox?.('error', response?.message || 'Unable to remove product from cart.');
  };

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
        const inCart = isProductInCart(productId);

        return (
          <SwiperSlide key={productId}>
            <div className='relative h-35.75 overflow-hidden rounded-lg bg-white'>
              <Link to={`/product/${productId}`}>
                <img
                  src={productImage}
                  alt={product?.productName || 'Product'}
                  className='h-24.75 w-full rounded-t-lg object-cover'
                />
                <div className='h-11 overflow-hidden bg-gray-100 p-2 leading-tight'>
                  <h2 className='truncate text-[12px] font-bold'>{product?.productName || 'Product Name'}</h2>
                  <p className='text-[12px] font-bold text-blue-500'>{formatPrice(product?.price)}</p>
                </div>
              </Link>
              <div className='absolute right-2 top-2'>
                {inCart ? (
                  <button
                    type='button'
                    onClick={() => handleRemoveFromCart(productId)}
                    className='cursor-pointer'
                    disabled={activeProductId === productId}
                    title='Remove from cart'
                  >
                    <FaHeart className='text-lg text-red-400' />
                  </button>
                ) : (
                  <button
                    type='button'
                    onClick={() => handleAddToCart(productId)}
                    className='cursor-pointer text-2xl text-blue-500 disabled:opacity-60'
                    disabled={activeProductId === productId}
                    title='Add to cart'
                  >
                    <FaRegHeart className='text-gray-500 text-lg' />
                  </button>
                  
                )}
              </div>
              <div className='absolute bottom-2 right-2'>
                <span><span className='text-sm'>⭐</span>{product?.rating || 0}</span>
              </div>
            </div>
          </SwiperSlide>
        );
      })}
    </Swiper>
  )
}

export default Product;