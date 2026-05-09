import React, { useEffect, useState, useContext, useMemo, useRef } from 'react'
import { FaRegHeart } from 'react-icons/fa'
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Footer from '../components/footer';
import { deleteData, fetchDataFromApi, postData } from '../utils/api';
import { MyContext } from '../App';
import { FaHeart } from 'react-icons/fa6';
import { FaHistory } from 'react-icons/fa';
import { IoIosArrowForward } from 'react-icons/io';
import { IoIosArrowBack } from 'react-icons/io';
import { IoSearchSharp } from 'react-icons/io5';
import { RxCross2 } from 'react-icons/rx';

const LAST_SEARCH_QUERY_KEY = 'lastSearchQuery';
const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 8;
const MAX_TRENDING = 8;
const MAX_POPULAR = 45;

const shuffleProducts = (items = []) => {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
};

const Search = () => {
    const context = useContext(MyContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
    const [activeQuery, setActiveQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [popularProducts, setPopularProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [addingProductId, setAddingProductId] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const randomSeedRef = useRef(`${Date.now()}-${Math.random().toString(16).slice(2)}`);

    const navigate = useNavigate();

    useEffect(() => {
        const query = searchParams.get('q') || '';
        setSearchTerm(query);
        setInputValue(query);
    }, [searchParams]);

    useEffect(() => {
        try {
            const recent = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
            if (Array.isArray(recent)) {
                setRecentSearches(recent.filter(Boolean).slice(0, MAX_RECENT_SEARCHES));
            }
        } catch (error) {
            setRecentSearches([]);
        }
    }, []);

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

        const loadPopularProducts = async () => {
            const response = await fetchDataFromApi(`/api/product?paginate=true&page=1&limit=${MAX_POPULAR}&sortBy=random&seed=${encodeURIComponent(randomSeedRef.current)}`);

            if (!isMounted) {
                return;
            }

            const incoming = Array.isArray(response?.products) ? response.products : [];
            setPopularProducts(incoming);
        };

        loadPopularProducts();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadProducts = async () => {
            setIsLoading(true);

            const queryFromUrl = searchTerm.trim();
            let storedLastQuery = '';

            try {
                storedLastQuery = String(localStorage.getItem(LAST_SEARCH_QUERY_KEY) || '').trim();
            } catch (error) {
                storedLastQuery = '';
            }

            const effectiveQuery = queryFromUrl || storedLastQuery;
            const endpoint = effectiveQuery
                ? `/api/product/search?q=${encodeURIComponent(effectiveQuery)}`
                : '/api/product/latest';

            const response = await fetchDataFromApi(endpoint);

            if (!isMounted) {
                return;
            }

            if (effectiveQuery) {
                try {
                    localStorage.setItem(LAST_SEARCH_QUERY_KEY, effectiveQuery);
                } catch (error) {
                    // Ignore localStorage failures and continue.
                }
            }

            setActiveQuery(effectiveQuery);
            setProducts(shuffleProducts(response?.products || []));
            setIsLoading(false);
        };

        loadProducts();

        return () => {
            isMounted = false;
        };
    }, [searchTerm]);

    useEffect(() => {
        let isMounted = true;

        const loadSuggestions = async () => {
            const query = inputValue.trim();

            if (!query || query === searchTerm.trim()) {
                setSuggestions([]);
                setIsLoadingSuggestions(false);
                return;
            }

            setIsLoadingSuggestions(true);
            const response = await fetchDataFromApi(`/api/product/search?q=${encodeURIComponent(query)}`);

            if (!isMounted) {
                return;
            }

            const incoming = Array.isArray(response?.products) ? response.products : [];
            const mapped = incoming.slice(0, 10).map((item) => ({
                id: item?._id || item?.id,
                name: String(item?.productName || '').trim(),
                image: item?.images?.[0] || '',
                category: item?.category?.catName || '',
            })).filter((item) => item.name);

            const uniqueByName = mapped.filter((item, index, array) => {
                return array.findIndex((x) => x.name.toLowerCase() === item.name.toLowerCase()) === index;
            });

            setSuggestions(uniqueByName);
            setIsLoadingSuggestions(false);
        };

        const timer = setTimeout(() => {
            loadSuggestions();
        }, 250);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [inputValue, searchTerm]);

    const saveRecentSearch = (query) => {
        if (!query) {
            return;
        }

        setRecentSearches((prev) => {
            const next = [query, ...prev.filter((item) => item.toLowerCase() !== query.toLowerCase())]
                .slice(0, MAX_RECENT_SEARCHES);

            try {
                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
            } catch (error) {
                // Ignore localStorage failures and continue.
            }

            return next;
        });
    };

    const handleSearch = (value) => {
        const nextQuery = value.trim();

        if (nextQuery) {
            try {
                localStorage.setItem(LAST_SEARCH_QUERY_KEY, nextQuery);
            } catch (error) {
                // Ignore localStorage failures and continue.
            }

            saveRecentSearch(nextQuery);
        }

        setSearchParams(nextQuery ? { q: nextQuery } : {});
    };

    const handleRecentSearchClick = (query) => {
        setInputValue(query);
        handleSearch(query);
    };

    const handleSuggestionClick = (suggestionName) => {
        setInputValue(suggestionName);
        handleSearch(suggestionName);
    };

    const handleClearInput = () => {
        setInputValue('');
        setSearchParams({});
    };

    const renderSuggestionLabel = (name) => {
        const query = inputValue.trim();
        const lowerQuery = query.toLowerCase();
        const lowerName = name.toLowerCase();

        if (!query || !lowerName.startsWith(lowerQuery)) {
            return <span className='text-[20px] font-semibold text-gray-800'>{name}</span>;
        }

        const prefix = name.slice(0, query.length);
        const suffix = name.slice(query.length);

        return (
            <span className='text-[20px] leading-6'>
                <span className='text-gray-500'>{prefix}</span>
                <span className='font-semibold text-gray-900'>{suffix}</span>
            </span>
        );
    };

    const isShowingSuggestions = inputValue.trim().length > 0 && inputValue.trim() !== searchTerm.trim();
    const isBlankInput = inputValue.trim().length === 0;
    const showDiscovery = isBlankInput;

    const recentSearchItems = useMemo(() => {
        return recentSearches.slice(0, MAX_RECENT_SEARCHES).map((query) => {
            const match = popularProducts.find((product) => {
                const name = String(product?.productName || '').toLowerCase();
                return name.includes(query.toLowerCase());
            });

            return {
                query,
                image: match?.images?.[0] || '',
            };
        });
    }, [recentSearches, popularProducts]);

    const trendingSearches = useMemo(() => {
        const names = popularProducts
            .map((item) => String(item?.productName || '').trim())
            .filter(Boolean)
            .slice(0, MAX_TRENDING);

        return names.map((name, index) => ({
            id: `${name}-${index}`,
            label: name,
            image: popularProducts[index]?.images?.[0] || '',
        }));
    }, [popularProducts]);

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

        context?.alertBox?.('error', 'Login first.');
        navigate('/login');
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
        <div className='min-h-screen bg-[#f1f3f6]'>
            <div className='sticky top-0 z-20 bg-[#c5d8f6] px-3 pb-3 pt-2'>
                <div className='flex items-center gap-2'>
                    <button type='button' onClick={() => navigate(-1)} className='flex h-8 w-8 items-center justify-center text-2xl text-gray-700'>
                        <IoIosArrowBack />
                    </button>
                    <div className='relative flex h-12 w-full items-center rounded-full border border-[#7ea1d6] bg-white px-3 shadow-[0_1px_2px_rgba(0,0,0,0.15)]'>
                        <IoSearchSharp className='text-[22px] text-gray-500' />
                        <input
                            type='text'
                            value={inputValue}
                            onChange={(event) => setInputValue(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    handleSearch(inputValue);
                                }
                            }}
                            placeholder='Search products'
                            className='h-full w-full border-none bg-transparent px-3 text-[16px] text-gray-800 outline-none'
                        />
                        {inputValue && (
                            <button type='button' onClick={handleClearInput} className='flex h-8 w-8 items-center justify-center text-[24px] text-gray-700'>
                                <RxCross2 />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isShowingSuggestions && (
                <div className='border-t border-gray-200 bg-[#f3f3f3]'>
                    {isLoadingSuggestions ? (
                        <div className='px-4 py-3 text-sm text-gray-500'>Searching suggestions...</div>
                    ) : suggestions.length > 0 ? (
                        suggestions.map((item, index) => (
                            <button
                                key={item.id || item.name}
                                type='button'
                                onClick={() => handleSuggestionClick(item.name)}
                                className='flex w-full items-center justify-between border-b border-gray-300 px-4 py-3 text-left'
                            >
                                <span className='flex min-w-0 items-center gap-3'>
                                    <img
                                        src={item.image || 'https://via.placeholder.com/56x56?text=Item'}
                                        alt={item.name}
                                        className='h-11 w-11 rounded-sm object-cover'
                                    />
                                    <span className='min-w-0'>
                                        <span className='block truncate'>{renderSuggestionLabel(item.name)}</span>
                                        {(index === 0 || item.category) && (
                                            <span className='block truncate text-[16px] leading-5 text-[#2f4ea5]'>
                                                {item.category ? `in ${item.category}` : 'Explore now'}
                                            </span>
                                        )}
                                    </span>
                                </span>
                                <IoIosArrowForward className='text-[26px] text-gray-500' />
                            </button>
                        ))
                    ) : (
                        <div className='px-4 py-3 text-sm text-gray-500'>No suggestions found.</div>
                    )}
                </div>
            )}

            {showDiscovery && !isShowingSuggestions && (
                <div className='space-y-4 pb-20'>
                    <div className='bg-white px-3 py-3'>
                        <h3 className='mb-2 text-[17px] font-semibold text-gray-800'>Recent Searches</h3>
                        {recentSearchItems.length > 0 ? (
                            <div className='flex gap-3 overflow-x-auto pb-1'>
                                {recentSearchItems.map((item) => (
                                    <button
                                        key={item.query}
                                        type='button'
                                        onClick={() => handleRecentSearchClick(item.query)}
                                        className='w-16 text-center'
                                    >
                                        <span className='mx-auto mb-1 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-100'>
                                            {item.image ? (
                                                <img src={item.image} alt={item.query} className='h-full w-full object-cover' />
                                            ) : (
                                                <FaHistory className='text-gray-400' />
                                            )}
                                        </span>
                                        <span className='block truncate text-[11px] font-medium text-gray-700'>{item.query}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className='text-sm text-gray-500'>No recent searches yet.</p>
                        )}
                    </div>

                    <div className='bg-white px-3 py-3'>
                        <h3 className='mb-2 text-[17px] font-semibold text-gray-800'>Trending Searches</h3>
                        <div className='grid grid-cols-2 gap-2'>
                            {trendingSearches.map((item) => (
                                <button
                                    key={item.id}
                                    type='button'
                                    onClick={() => handleSuggestionClick(item.label)}
                                    className='flex items-center gap-2 border border-gray-200 bg-white p-2 text-left'
                                >
                                    <img src={item.image || 'https://via.placeholder.com/40x40?text=Item'} alt={item.label} className='h-9 w-9 rounded-sm object-cover' />
                                    <span className='line-clamp-2 text-[12px] font-medium text-gray-700'>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className='bg-white px-3 py-3'>
                        <h3 className='mb-2 text-[17px] font-semibold text-gray-800'>Popular Products</h3>
                        <div className='grid grid-cols-3 gap-2'>
                            {popularProducts.slice(0, MAX_POPULAR).map((item) => {
                                const productId = item?._id || item?.id;
                                const image = item?.images?.[0] || 'https://via.placeholder.com/120x120?text=Product';

                                return (
                                    <Link key={productId} to={`/product/${productId}`} className='border border-gray-200 bg-white p-1.5'>
                                        <img src={image} alt={item?.productName || 'Product'} className='mb-1 h-20 w-full object-cover' />
                                        <p className='truncate text-[11px] font-semibold text-gray-700'>{item?.productName || 'Product'}</p>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {!showDiscovery && !isShowingSuggestions && (
                <div className='bg-[#f1f3f6] px-3 pb-20'>
                    <div className='flex items-center justify-between pt-3'>
                        <h2 className='text-[14px] font-bold text-gray-500'>Results for <span className='text-[16px] text-black'>"{activeQuery || 'latest products'}"</span></h2>
                        <p className='text-[14px] font-bold text-blue-500'>{products.length} Results Found</p>
                    </div>

                    {isLoading ? (
                        <div className='mt-4 text-sm text-gray-500'>Loading products...</div>
                    ) : (
                        <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7'>
                            {products.length > 0 ? products.map((product) => {
                                const productId = product?._id || product?.id;
                                const image = product?.images?.[0] || 'https://via.placeholder.com/300x300?text=Product';

                                return (
                                    <div key={productId} className='relative overflow-hidden rounded-lg bg-white'>
                                        <Link to={`/product/${productId}`}>
                                            <img src={image} alt={product?.productName || 'Product'} className='h-36 w-full object-cover' />
                                        </Link>
                                        <div className='flex h-12 items-center justify-between bg-gray-100 p-2 leading-tight'>
                                            <div className='w-full overflow-hidden leading-tight'>
                                                <h2 className='truncate text-[12px] font-bold'>{product?.productName || 'Product Name'}</h2>
                                                <p className='text-[12px] font-bold text-blue-500'>₹{Number(product?.price || 0).toLocaleString('en-IN')}</p>
                                            </div>
                                            <span className='text-[12px]'><span className='text-sm'>⭐</span>{product?.rating || 0}</span>
                                        </div>
                                        <div className='absolute right-2 top-2'>
                                            {isProductInCart(productId) ? (
                                                <button
                                                    type='button'
                                                    onClick={() => handleRemoveFromCart(productId)}
                                                    className='cursor-pointer'
                                                    title='Remove from cart'
                                                    disabled={addingProductId === productId}
                                                >
                                                    <FaHeart className='text-lg text-red-400' />
                                                </button>
                                            ) : (
                                                <button type='button' onClick={() => handleAddToCart(productId)} className='cursor-pointer text-2xl text-blue-500 disabled:opacity-60' disabled={addingProductId === productId}>
                                                    <FaRegHeart className='text-lg text-gray-500' />
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
                </div>
            )}

            {!isShowingSuggestions && <Footer />}
        </div>
    )
}

export default Search