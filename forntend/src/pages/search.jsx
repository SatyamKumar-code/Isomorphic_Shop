import React, { useEffect, useState, useContext } from 'react'
import SerchBox from '../components/serchBox'
import { FaRegHeart } from 'react-icons/fa'
import { IoMdAddCircle } from "react-icons/io";
import { FaCheckCircle } from 'react-icons/fa';
import { Link, useSearchParams } from 'react-router-dom';
import Footer from '../components/footer';
import { deleteData, fetchDataFromApi, postData } from '../utils/api';
import { MyContext } from '../App';
import { FaHeart } from 'react-icons/fa6';

const Search = () => {
    const context = useContext(MyContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [addingProductId, setAddingProductId] = useState(null);
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        setSearchTerm(searchParams.get('q') || '');
    }, [searchParams]);

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

            const query = searchTerm.trim();
            const endpoint = query
                ? `/api/product/search?q=${encodeURIComponent(query)}`
                : '/api/product/latest';

            const response = await fetchDataFromApi(endpoint);

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
    }, [searchTerm]);

    const handleSearch = (value) => {
        const nextQuery = value.trim();
        setSearchParams(nextQuery ? { q: nextQuery } : {});
    };

    const isProductInCart = (productId) => {
        if (!productId || !cartItems || cartItems.length === 0) {
            return false;
        }

        const productIdStr = String(productId).trim();
        return cartItems.some((item) => {
            const itemProductId = String(item?.productId?._id || item?.productId || item?._id || '').trim();
            return itemProductId === productIdStr;
        });
    };


    const handleAddToCart = async (productId) => {
        if (!productId || addingProductId) {
            return;
        }

        // Prevent adding if already in cart
        if (isProductInCart(productId)) {
            context.alertBox('error', 'Product is already in your cart');
            return;
        }

        setAddingProductId(productId);
        const response = await postData('/api/cart/add', {
            productId,
            quantity: 1,
        });
        setAddingProductId(null);

        if (response?.error === false) {
            context.alertBox('Success', 'Added to cart');
            // Refresh cart items to update UI
            try {
                const cartResponse = await fetchDataFromApi('/api/cart/details');
                if (cartResponse?.error === false && cartResponse?.data?.products) {
                    setCartItems(cartResponse.data.products);
                }
            } catch (error) {
                console.error('Error refreshing cart:', error);
            }
            return;
        }

        context.alertBox('error', response?.message || 'Unable to add product to cart.');
    };

    const handleRemoveFromCart = async (productId) => {
        if (!productId || addingProductId) {
            return;
        }

        setAddingProductId(productId);

        try {
            const response = await deleteData(`/api/cart/remove/${productId}`);

            if (response?.error === false) {
                context.alertBox('Success', 'Removed from cart');
                try {
                    const cartResponse = await fetchDataFromApi('/api/cart/details');
                    if (cartResponse?.error === false && cartResponse?.data?.products) {
                        setCartItems(cartResponse.data.products);
                    } else {
                        setCartItems([]);
                    }
                } catch (refreshError) {
                    console.error('Error refreshing cart after remove:', refreshError);
                    setCartItems([]);
                }
                return;
            }

            context.alertBox('error', response?.message || 'Unable to remove product from cart.');
        } catch (error) {
            console.error('Error removing product from cart:', error);
            context.alertBox('error', 'Unable to remove product from cart.');
        } finally {
            setAddingProductId(null);
        }
    };

    return (
        <div>
            <SerchBox value={searchTerm} onSearch={handleSearch} />
            <div className='flex items-center justify-between mt-4'>
                <h2 className='font-bold text-[14px] text-gray-500 '>Results for <span className='text-black text-[16px]'>"{searchTerm || 'latest products'}"</span></h2>
                <p className='text-blue-500 text-[14px] font-bold'>{products.length} Results Found</p>
            </div>

            {isLoading ? (
                <div className='mt-4 text-sm text-gray-500'>Loading products...</div>
            ) : (
                <div className='grid grid-cols-2 gap-4 mt-4 mb-20 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7'>
                    {products.length > 0 ? products.map((product) => {
                        const productId = product?._id || product?.id;
                        const image = product?.images?.[0] || 'https://via.placeholder.com/300x300?text=Product';

                        return (
                            <div key={productId} className='relative h-45.75 overflow-hidden rounded-lg bg-white'>
                                <Link to={`/product/${productId}`}>
                                    <img src={image} alt={product?.productName || 'Product'} className='w-full! h-34.75! rounded-t-lg object-cover' />
                                </Link>
                                <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                                    <div className='w-full overflow-hidden leading-tight'>
                                        <h2 className='truncate text-[12px] font-bold'>{product?.productName || 'Product Name'}</h2>
                                        <p className='text-[12px] font-bold text-blue-500'>₹{Number(product?.price || 0).toLocaleString('en-IN')}</p>
                                    </div>
                                    <span><span className='text-sm'>⭐</span>{product?.rating || 0}</span>
                                </div>
                                <div className='absolute top-2 right-2'>
                                    {isProductInCart(productId) ? (
                                        <button
                                            type='button'
                                            onClick={() => handleRemoveFromCart(productId)}
                                            className='cursor-pointer'
                                            title='Remove from cart'
                                            disabled={addingProductId === productId}
                                        >
                                            <FaHeart className='text-red-400 text-lg' />
                                        </button>
                                    ) : (
                                        <button type='button' onClick={() => handleAddToCart(productId)} className='text-blue-500 text-2xl cursor-pointer disabled:opacity-60' disabled={addingProductId === productId}>
                                            <FaRegHeart className='text-gray-500 text-lg' />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className='col-span-full rounded-lg bg-gray-100 p-4 text-sm text-gray-600'>No products found.</div>
                    )}
                </div>
            )}

            <Footer />
        </div>
    )
}

export default Search