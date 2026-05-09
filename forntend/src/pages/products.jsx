import React, { useContext, useEffect, useMemo, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom';
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
    const [productSort, setProductSort] = useState('');
    const [isInitialRandomOrder, setIsInitialRandomOrder] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const LIMIT = 20;
    const loaderRef = useRef(null);
    const requestSeqRef = useRef(0);
    const randomSeedRef = useRef(`${Date.now()}-${Math.random().toString(16).slice(2)}`);

    const navigate = useNavigate();

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

    // Fetch products with pagination. If pageToLoad === 1 replace list, otherwise append.
    const fetchProducts = async (pageToLoad = 1) => {
        const requestId = ++requestSeqRef.current;
        const sortKey = isInitialRandomOrder && !productSort ? 'random' : (productSort || 'latest');

        try {
            if (pageToLoad === 1) {
                setIsLoading(true);
            } else {
                setIsLoadingMore(true);
            }

            const serverSortMap = {
                'random': 'random',
                'latest': 'latest',
                'name-az': 'a-z',
                'price-low': 'priceLow',
                'price-high': 'priceHigh',
                'rating-high': 'ratingHigh',
            };
            const sortQuery = serverSortMap[sortKey] || 'latest';
            const seedQuery = sortKey === 'random' ? `&seed=${encodeURIComponent(randomSeedRef.current)}` : '';
            const response = await fetchDataFromApi(`/api/product?paginate=true&page=${pageToLoad}&limit=${LIMIT}&sortBy=${sortQuery}${seedQuery}`);
            const incoming = response?.products || [];

            if (requestId !== requestSeqRef.current) {
                return;
            }

            if (pageToLoad === 1) {
                setProducts(incoming);
            } else {
                setProducts((prev) => {
                    const combined = [...prev, ...incoming];
                    // keep unique by id/_id
                    return combined.filter((p, i, arr) => arr.findIndex(x => (x?._id || x?.id) === (p?._id || p?.id)) === i);
                });
            }

            const hasNextFromServer = response?.pagination?.hasNextPage;
            const currentPageFromServer = Number(response?.pagination?.page || pageToLoad);
            const totalPagesFromServer = Number(response?.pagination?.totalPages || 0);
            const hasNext = typeof hasNextFromServer === 'boolean'
                ? hasNextFromServer
                : (totalPagesFromServer > 0
                    ? currentPageFromServer < totalPagesFromServer
                    : (incoming.length === LIMIT));
            setHasMore(Boolean(hasNext));
            setPage(pageToLoad);
        } catch (err) {
            if (requestId !== requestSeqRef.current) {
                return;
            }
            console.error('Error fetching products:', err);
        } finally {
            if (requestId !== requestSeqRef.current) {
                return;
            }
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    // Refetch when sort changes
    useEffect(() => {
        fetchProducts(1);
    }, [productSort]);

    // Use IntersectionObserver to load next page when sentinel becomes visible
    useEffect(() => {
        const sentinel = loaderRef.current;
        if (!sentinel) return;

        const options = { root: null, rootMargin: '300px', threshold: 0 };
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !isLoading && !isLoadingMore && hasMore) {
                    fetchProducts(page + 1);
                }
            });
        }, options);

        obs.observe(sentinel);
        return () => obs.disconnect();
    }, [isLoading, isLoadingMore, hasMore, page]);

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

        context?.alertBox?.('error', 'Login first.');
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

        if (isInitialRandomOrder && !productSort) {
            return filtered;
        }

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
    }, [products, selectedFilters, productSort, cartItems, isInitialRandomOrder]);

    return (
        <div>
            <SerchBox />
            <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                {/* <h2 className='text-lg font-bold'>All Products</h2> */}
                <div className='flex flex-wrap items-center gap-2'>
                    <select
                        aria-label='Filter products'
                        value={selectedFilters[0] || ''}
                        onChange={(e) => {
                            setSelectedFilters(e.target.value ? [e.target.value] : []);
                        }}
                        className='rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none'
                    >
                        <option value=''>All Products</option>
                        <option value='featured'>Featured</option>
                        <option value='discounted'>Discounted</option>
                        <option value='best-selling'>Best selling</option>
                        <option value='high-rated'>High rating</option>
                    </select>
                    <select
                        aria-label='Sort products'
                        value={productSort}
                        onChange={(e) => {
                            setIsInitialRandomOrder(false);
                            setProductSort(e.target.value);
                        }}
                        className='rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none'
                    >
                        <option value='' disabled hidden>Sort products</option>
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
                <div className='grid grid-cols-2 gap-4 mt-4 mb-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
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
                    {isLoadingMore && Array.from({ length: 5 }).map((_, idx) => (
                        <div key={`skeleton-${idx}`} className='relative h-45.75 overflow-hidden rounded-lg bg-white animate-pulse'>
                            <div className='h-34.75 w-full rounded-t-lg bg-gray-200' />
                            <div className='flex h-11 w-full items-center justify-between overflow-hidden bg-gray-100 p-2 leading-tight'>
                                <div className='w-full overflow-hidden leading-tight'>
                                    <div className='h-3 mb-2 w-3/4 rounded bg-gray-200' />
                                    <div className='h-3 w-1/3 rounded bg-gray-200' />
                                </div>
                                <div className='h-5 w-10 rounded bg-gray-200' />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && (
                <div ref={loaderRef} className='w-full flex items-center justify-center py-4'>
                    {isLoadingMore ? (
                        <div className='flex items-center gap-2'>
                            <svg className='h-5 w-5 animate-spin text-gray-600' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'></path>
                            </svg>
                            <div className='text-sm text-gray-600'>Loading more...</div>
                        </div>
                    ) : hasMore ? (
                        <div className='text-sm text-gray-500'>Scroll to load more</div>
                    ) : (
                        <div className='text-sm text-gray-400'>No more products</div>
                    )}
                </div>
            )}

            <Footer />
        </div>
    )
}

export default Products