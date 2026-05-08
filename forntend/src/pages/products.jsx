import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom';
import Footer from '../components/footer';
import SerchBox from '../components/serchBox';
import { FaRegHeart } from 'react-icons/fa';
import { FaHeart } from 'react-icons/fa6';
import { IoMdAddCircle } from 'react-icons/io';
import { deleteData, fetchDataFromApi, postData } from '../utils/api';
import { MyContext } from '../App';

const Products = () => {
    const context = useContext(MyContext);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cartItems, setCartItems] = useState([]);
    const [activeProductId, setActiveProductId] = useState(null);
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [productSort, setProductSort] = useState('latest');

    // Helper to convert MongoDB Decimal128 or any numeric value to safe number
    const toSafeNumber = (value) => {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        if (value.$numberDecimal) return parseFloat(value.$numberDecimal);
        return parseFloat(value) || 0;
    };

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
            const response = await fetchDataFromApi('/api/product?paginate=true&page=1&limit=20&sortBy=latest');

            if (!isMounted) {
                return;
            }
            setProducts(response?.products);
            setIsLoading(false);
        };

        loadProducts();

        return () => {
            isMounted = false;
        };
    }, []);

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

        context?.alertBox?.('error', response?.message || 'Unable to add product to cart.');
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

    const filteredProducts = useMemo(() => {
        const filtered = products.filter((product) => {
            const productId = product?._id || product?.id;
            const inCart = isProductInCart(productId);

            // If no filters selected, include all products
            if (!selectedFilters || selectedFilters.length === 0) {
                return true;
            }

            // All selected filters must match (AND)
            return selectedFilters.every((filter) => {
                if (filter === 'best-selling') {
                    return toSafeNumber(product?.sales) > 0;
                }

                if (filter === 'discounted') {
                    return toSafeNumber(product?.discountPercentage) > 0;
                }

                if (filter === 'featured') {
                    return product?.featured === true;
                }

                if (filter === 'high-rated') {
                    return toSafeNumber(product?.rating) >= 4;
                }

                return true;
            });
        });

        const sorted = [...filtered].sort((firstProduct, secondProduct) => {
            if (productSort === 'price-low') {
                return toSafeNumber(firstProduct?.price) - toSafeNumber(secondProduct?.price);
            }

            if (productSort === 'price-high') {
                return toSafeNumber(secondProduct?.price) - toSafeNumber(firstProduct?.price);
            }

            if (productSort === 'rating-high') {
                return toSafeNumber(secondProduct?.rating) - toSafeNumber(firstProduct?.rating);
            }

            if (productSort === 'name-az') {
                return String(firstProduct?.productName || '').localeCompare(String(secondProduct?.productName || ''));
            }

            return new Date(secondProduct?.createdAt || 0).getTime() - new Date(firstProduct?.createdAt || 0).getTime();
        });

        return sorted;
    }, [products, selectedFilters, productSort, cartItems]);

    return (
        <div>
            <SerchBox />
            <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <h2 className='text-lg font-bold'>All Products</h2>
                <div className='flex flex-wrap items-center gap-2'>
                    <div className='flex flex-wrap items-center gap-2'>
                        {/* Toggleable filter chips (click to select/unselect) */}
                        {['featured', 'discounted', 'best-selling', 'high-rated'].map((filter) => {
                            const labelMap = {
                                'featured': 'Featured',
                                'discounted': 'Discounted',
                                'best-selling': 'Best selling',
                                'high-rated': 'High rating',
                            };

                            const isSelected = selectedFilters.includes(filter);

                            const baseClasses = 'rounded-full px-3 py-2 text-sm font-semibold outline-none border';
                            const selectedClasses = 'bg-blue-500 text-white border-blue-500';
                            const unselectedClasses = 'bg-white text-gray-700 border-gray-200';

                            return (
                                <button
                                    key={filter}
                                    type='button'
                                    onClick={() => {
                                        setSelectedFilters((prev) => (
                                            prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
                                        ));
                                    }}
                                    className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}
                                >
                                    {labelMap[filter]}
                                </button>
                            );
                        })}
                    </div>
                    <select
                        aria-label='Sort products'
                        value={productSort}
                        onChange={(e) => setProductSort(e.target.value)}
                        className='rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none'
                    >
                        <option value='latest'>Latest</option>
                        <option value='name-az'>Name A-Z</option>
                        <option value='price-low'>Price low to high</option>
                        <option value='price-high'>Price high to low</option>
                        <option value='rating-high'>Top rated</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className='mt-4 text-sm text-gray-500'>Loading products...</div>
            ) : (
                <div className='grid grid-cols-2 gap-4 mt-4 mb-20 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
                    {filteredProducts.length > 0 ? filteredProducts.map((product) => {
                        const productId = product?._id || product?.id;
                        const image = product?.images?.[0] || 'https://via.placeholder.com/300x300?text=Product';
                        const inCart = isProductInCart(productId);

                        return (
                            <div key={productId} className='relative h-45.75 overflow-hidden rounded-lg bg-white'>
                                <Link to={`/product/${productId}`}>
                                    <img src={image} alt={product?.productName || 'Product'} className='h-34.75! w-full! rounded-t-lg object-cover' />
                                </Link>
                                <div className='flex h-11 w-full items-center justify-between overflow-hidden bg-gray-100 p-2 leading-tight'>
                                    <div className='w-full overflow-hidden leading-tight'>
                                        <h2 className='truncate text-[12px] font-bold'>{product?.productName || 'Product Name'}</h2>
                                        <p className='text-[12px] font-bold text-blue-500'>₹{toSafeNumber(product?.price).toLocaleString('en-IN')}</p>
                                    </div>
                                    <span><span className='text-sm'>⭐</span>{toSafeNumber(product?.rating)}</span>
                                </div>
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
                                            <FaRegHeart className='text-lg text-gray-500' />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className='col-span-full rounded-lg bg-gray-100 p-4 text-sm text-gray-600'>No products available.</div>
                    )}
                </div>
            )}

            <Footer />
        </div>
    )
}

export default Products