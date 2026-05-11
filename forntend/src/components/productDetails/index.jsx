import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../backButton'
import { FaCartArrowDown } from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa";
import { FaHeart, FaStar } from "react-icons/fa6";
import { fetchDataFromApi, postData, deleteData } from '../../utils/api';
import { MyContext } from '../../App';

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
    const context = useContext(MyContext);
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [serverRatingSummary, setServerRatingSummary] = useState(null);
    const [myReview, setMyReview] = useState(null);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [canReview, setCanReview] = useState(false);
    const [isCheckingReviewEligibility, setIsCheckingReviewEligibility] = useState(true);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [userPendingRating, setUserPendingRating] = useState(null);
    const [isEditingReview, setIsEditingReview] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isLoadingRelated, setIsLoadingRelated] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [addingProductId, setAddingProductId] = useState(null);
    const reviewPageActiveRef = useRef(false);
    const touchStartXRef = useRef(0);
    const touchEndXRef = useRef(0);
    const mouseDownXRef = useRef(0);

    const handleTouchStart = (e) => {
        touchStartXRef.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        touchEndXRef.current = e.changedTouches[0].clientX;
        handleSwipe(touchStartXRef.current, touchEndXRef.current);
    };

    const handleMouseDown = (e) => {
        mouseDownXRef.current = e.clientX;
    };

    const handleMouseUp = (e) => {
        handleSwipe(mouseDownXRef.current, e.clientX);
    };

    const handleSwipe = (startX, endX) => {
        const images = Array.isArray(product?.images) ? product.images : [];
        if (images.length <= 1) return;

        const diff = startX - endX;
        const threshold = 50; // minimum swipe distance

        if (diff > threshold) {
            // swipe left - next image
            handleNextImage();
        } else if (diff < -threshold) {
            // swipe right - previous image
            handlePreviousImage();
        }
    };

    const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

    const getCurrentProductImage = () => {
        const images = Array.isArray(product?.images) ? product.images : [];
        return images[currentImageIndex] || images[0] || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFYqoKTu_o3Zns2yExbst2Co84Gpc2Q1RJbA&s";
    };

    const handlePreviousImage = () => {
        const images = Array.isArray(product?.images) ? product.images : [];
        if (images.length > 1) {
            setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
        }
    };

    const handleNextImage = () => {
        const images = Array.isArray(product?.images) ? product.images : [];
        if (images.length > 1) {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }
    };

    const calculateDeliveryDate = (days = 3) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const formatDeliveryDate = (value) => {
        if (!value) {
            return calculateDeliveryDate(3);
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return calculateDeliveryDate(3);
        }

        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const formatDate = (value) => {
        if (!value) {
            return '';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const productAttributes = [
        { label: 'Size', value: product?.size },
        { label: 'Weight', value: product?.weight },
        { label: 'RAM', value: product?.RAM },
        { label: 'ROM', value: product?.ROM },
        { label: 'Color', value: product?.color },
        { label: 'Expiration Start', value: formatDate(product?.expirationStart) },
        { label: 'Expiration End', value: formatDate(product?.expirationEnd) },
    ].filter((item) => item.value);

    const ratingStats = React.useMemo(() => {
        // Prefer server-provided aggregate summary (includes pending + approved counts)
        if (serverRatingSummary && typeof serverRatingSummary === 'object') {
            const { counts = [0, 0, 0, 0, 0], percent = [0, 0, 0, 0, 0], total = 0, average = 0 } = serverRatingSummary;
            return { counts, percent, total, average: Number(average) };
        }

        const counts = [0, 0, 0, 0, 0]; // index 0 => 5 stars
        reviews.forEach((r) => {
            const rating = Math.max(1, Math.min(5, Number(r.rating || 0)));
            counts[5 - rating] += 1;
        });
        const total = counts.reduce((a, b) => a + b, 0) || 0;
        const percent = counts.map((c) => total ? Math.round((c / total) * 100) : 0);
        const average = total ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / total) : (Number(product?.rating || 0) || 0);

        return { counts, percent, total, average: Number(average.toFixed(1)) };
    }, [reviews, product]);

    const displayRating = React.useMemo(() => {
        const avg = Number(ratingStats.average || 0);
        const total = Number(ratingStats.total || 0);

        if (!userPendingRating) {
            return { average: avg, total, counts: ratingStats.counts, percent: ratingStats.percent };
        }

        // include user's pending rating only in local display
        const combinedTotal = total + 1;
        const combinedAvg = combinedTotal ? ((avg * total + Number(userPendingRating)) / combinedTotal) : Number(userPendingRating);
        const combinedCounts = Array.isArray(ratingStats.counts) ? [...ratingStats.counts] : [0, 0, 0, 0, 0];
        const idx = Math.max(0, Math.min(4, 5 - Number(userPendingRating)));
        combinedCounts[idx] = (combinedCounts[idx] || 0) + 1;
        const combinedPercent = combinedCounts.map((c) => combinedTotal ? Math.round((c / combinedTotal) * 100) : 0);
        return { average: Number(combinedAvg.toFixed(1)), total: combinedTotal, counts: combinedCounts, percent: combinedPercent };
    }, [ratingStats, userPendingRating]);

    const loadProductReviews = async (productId) => {
        try {
            const response = await fetchDataFromApi(`/api/product/${productId}/reviews`);
            if (reviewPageActiveRef.current) {
                const incoming = Array.isArray(response?.reviews) ? response.reviews : [];
                setReviews(incoming);
                setServerRatingSummary(response?.ratingSummary || null);
                setMyReview(response?.myReview || null);
                // any existing review record should hide the form
                setCanReview(false);
                // if user's pending review got approved and appears in incoming, clear pending flag
                try {
                    const currentUserId = context?.userData?._id;
                    if (currentUserId && incoming.some((r) => String(r.userId?._id || r.userId) === String(currentUserId))) {
                        setUserPendingRating(null);
                    }
                } catch (e) {
                    // ignore
                }
            }
        } catch (error) {
            if (reviewPageActiveRef.current) {
                setReviews([]);
            }
        }
    };

    const handleSubmitReview = async (event) => {
        event.preventDefault();

        if (!product || !canReview || isSubmittingReview) {
            return;
        }

        // Comment is optional — allow rating-only submissions
        const trimmedComment = reviewComment.trim();

        setIsSubmittingReview(true);

        const response = await postData(`/api/product/${id}/review`, {
            rating: Number(reviewRating),
            comment: trimmedComment,
        });

        setIsSubmittingReview(false);

        if (response?.error === false) {
            context.alertBox(
                'Success',
                trimmedComment ? (response?.message || 'Review submitted successfully.') : 'Rating submitted successfully.'
            );
            setReviewRating(5);
            setReviewComment('');
            // show user's rating immediately locally
            setUserPendingRating(Number(reviewRating));
            // hide the form since user can't submit again
            setCanReview(false);
            setIsEditingReview(false);
            await loadProductReviews(id);
            return;
        }

        context.alertBox('error', response?.message || 'Unable to submit review.');
    };

    const handleCheckout = () => {
        if (!product) {
            return;
        }

        navigate('/checkout', {
            state: {
                selectedProduct: {
                    _id: product?._id || id,
                    productName: product?.productName || 'Product Name',
                    price: product?.price || 0,
                    quantity: 1,
                    image: getCurrentProductImage(),
                    description: product?.description || '',
                },
            },
        });
    };

    const handleUpdateReview = async () => {
        if (!product || !myReview || isSubmittingReview) return;
        setIsSubmittingReview(true);
        const trimmedComment = reviewComment.trim();
        const response = await fetch(`/api/product/${id}/review`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: Number(reviewRating), comment: trimmedComment }),
        }).then((r) => r.json()).catch(() => ({ error: true }));
        setIsSubmittingReview(false);
        if (response?.error === false) {
            context.alertBox('Success', response?.message || 'Review updated');
            setUserPendingRating(Number(reviewRating));
            setIsEditingReview(false);
            await loadProductReviews(id);
            return;
        }
        context.alertBox('error', response?.message || 'Unable to update review.');
    };

    const handleAddToCart = async () => {
        if (!product || isAddingToCart) {
            return;
        }

        setIsAddingToCart(true);
        const response = await postData('/api/cart/add', {
            productId: product?._id || id,
            quantity: 1,
        });
        setIsAddingToCart(false);

        if (response?.error === false) {
            context.alertBox('Success', 'Added to cart');
            return;
        }

        context.alertBox('error', response?.message || 'Unable to add product to cart.');
    };

    const loadRecentlyViewed = async () => {
        try {
            const key = getViewerKey();
            const response = await fetchDataFromApi(`/api/product/recently-viewed?viewerKey=${encodeURIComponent(key)}`);
            if (Array.isArray(response?.products)) {
                setRecentlyViewed(response.products.slice(0, 10));
            }
        } catch (error) {
            // silently fail
        }
    };

    const loadCartDetails = async () => {
        try {
            const response = await fetchDataFromApi('/api/cart/details');
            if (response?.error === false && response?.data?.products) {
                setCartItems(response.data.products);
            } else {
                setCartItems([]);
            }
        } catch (error) {
            setCartItems([]);
        }
    };

    const loadRelatedProducts = async (productId) => {
        if (!productId) return;
        try {
            setIsLoadingRelated(true);
            const response = await fetchDataFromApi(`/api/product/related/${productId}`);
            if (Array.isArray(response?.products)) {
                setRelatedProducts(response.products.slice(0, 8));
            }
        } catch (error) {
            // silently fail
        } finally {
            setIsLoadingRelated(false);
        }
    };

    const isProductInCart = (productId) => {
        if (!productId || !cartItems || cartItems.length === 0) return false;
        const productIdStr = String(productId).trim();
        return cartItems.some((item) => {
            const itemProductId = String(item?.productId?._id || item?.productId || item?._id || '').trim();
            return itemProductId === productIdStr;
        });
    };

    const handleAddToCartById = async (productId) => {
        if (!productId || addingProductId) return;
        if (isProductInCart(productId)) {
            context.alertBox('error', 'Product is already in your cart');
            return;
        }
        setAddingProductId(productId);
        const response = await postData('/api/cart/add', { productId, quantity: 1 });
        setAddingProductId(null);
        if (response?.error === false) {
            context.alertBox('Success', 'Added to cart');
            try {
                const cartResponse = await fetchDataFromApi('/api/cart/details');
                if (cartResponse?.error === false && cartResponse?.data?.products) {
                    setCartItems(cartResponse.data.products);
                }
            } catch (e) {
                // ignore
            }
            return;
        }
        context?.alertBox?.('error', 'Login first.');
        navigate('/login');
    };

    const handleRemoveFromCartById = async (productId) => {
        if (!productId || addingProductId) return;
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
                } catch (e) {
                    setCartItems([]);
                }
                return;
            }
            context.alertBox('error', response?.message || 'Unable to remove product from cart.');
        } catch (error) {
            context.alertBox('error', 'Unable to remove product from cart.');
        } finally {
            setAddingProductId(null);
        }
    };

    useEffect(() => {
        if (!id) {
            return;
        }

        // Ensure page scrolls to top when navigating to a different product
        try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            window.scrollTo(0, 0);
        }

        reviewPageActiveRef.current = true;
        setIsCheckingReviewEligibility(true);
        setCanReview(false);
        setCurrentImageIndex(0);

        setIsLoading(true);

        fetchDataFromApi(`/api/product/${id}`).then((response) => {
            if (reviewPageActiveRef.current) {
                setProduct(response?.product || null);
                setIsLoading(false);
            }
        });

        // load product reviews
        loadProductReviews(id);

        const checkReviewEligibility = async () => {
            if (!context?.isLoggedIn || !context?.userData?._id) {
                if (reviewPageActiveRef.current) {
                    setCanReview(false);
                    setIsCheckingReviewEligibility(false);
                }
                return;
            }

            try {
                const response = await fetchDataFromApi('/api/order/my-orders');
                const orders = Array.isArray(response?.orders) ? response.orders : [];
                const deliveredOrdersForProduct = orders.filter((order) => {
                    const status = String(order?.status || '').toLowerCase();
                    const paymentStatus = String(order?.paymentStatus || '').toLowerCase();

                    if (status !== 'delivered' || paymentStatus !== 'completed') {
                        return false;
                    }

                    return Array.isArray(order?.products) && order.products.some((item) => {
                        const orderedProductId = String(item?.productId?._id || item?.productId || '').trim();
                        return orderedProductId === String(id);
                    });
                });

                const eligible = deliveredOrdersForProduct.length > 0;
                const repeatEligible = deliveredOrdersForProduct.length >= 2;

                if (reviewPageActiveRef.current) {
                    // Only allow submitting a new review if user is eligible and does not already have a review
                    setCanReview(eligible && !myReview);
                }
            } catch (error) {
                if (reviewPageActiveRef.current) {
                    setCanReview(false);
                }
            } finally {
                if (reviewPageActiveRef.current) {
                    setIsCheckingReviewEligibility(false);
                }
            }
        };

        checkReviewEligibility();

        postData('/api/dashboard/product-view', {
            productId: id,
            viewerKey: getViewerKey(),
            countryCode: getCountryCode(),
        });

        // Load recently viewed products
        loadRecentlyViewed();
        // Load cart details for cart UI
        loadCartDetails();

        // Load related products using current product ID
        loadRelatedProducts(id);

        return () => {
            reviewPageActiveRef.current = false;
        };
    }, [id, context?.isLoggedIn, context?.userData?._id]);

    return (
        <div className='relative w-full min-h-screen pb-28 product-details-page'>
            <div className='absolute top-4 left-4 z-50'>
                <BackButton />
            </div>
            <div className='w-full h-100 bg-amber-50 rounded-b-xl flex items-center justify-center relative group'>
                <img
                    src={getCurrentProductImage()}
                    alt={product?.productName || 'Product'}
                    className='w-full h-100 object-cover cursor-grab active:cursor-grabbing'
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                />
            </div>
            {Array.isArray(product?.images) && product.images.length > 1 && (
                <div className='mt-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar'>
                    {product.images.map((image, index) => (
                        <button
                            key={index}
                            type='button'
                            onClick={() => setCurrentImageIndex(index)}
                            className={`flex-shrink-0 h-16 w-16 rounded-lg border-2 overflow-hidden ${currentImageIndex === index
                                ? 'border-blue-500 shadow-md'
                                : 'border-gray-200 opacity-70 hover:opacity-100'
                                }`}
                        >
                            <img
                                src={image}
                                alt={`Product ${index + 1}`}
                                className='h-full w-full object-cover'
                            />
                        </button>
                    ))}
                </div>
            )}
            <div className='absolute top-4! right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center'>
                <FaHeart className='text-gray-400 text-lg' />
            </div>
            <div className='p-4 w-full pb-28'>
                {isLoading ? (
                    <>
                        <div className='h-6 w-1/2 animate-pulse rounded bg-gray-200' />
                        <div className='mt-2 h-5 w-24 animate-pulse rounded bg-gray-200' />
                    </>
                ) : (
                    <>
                        <div className='flex items-start justify-between gap-4'>
                            <div>
                                <h1 className='text-xl font-bold'>{product?.productName || 'Product Name'}</h1>
                                {product?.brand && (
                                    <div className='text-sm text-gray-500 mt-1'>Brand: <span className='font-medium text-gray-700'>{product.brand}</span></div>
                                )}
                            </div>
                            <div className='text-right'>
                                <div className='text-2xl font-extrabold text-blue-600'>{formatPrice(product?.price)}</div>
                                {product?.oldPrice > 0 && Number(product.oldPrice) > Number(product.price) && (
                                    <div className='text-sm text-gray-500'>
                                        <span className='line-through mr-2'>{formatPrice(product.oldPrice)}</span>
                                        {product?.discountPercentage ? (
                                            <span className='text-green-600 font-semibold'>({Number(product.discountPercentage)}% off)</span>
                                        ) : null}
                                    </div>
                                )}
                                <div className='mt-1 text-sm'>
                                    {Number(product?.stock || 0) > 0 ? (
                                        <span className='text-green-600 font-medium'>In stock</span>
                                    ) : (
                                        <span className='text-red-600 font-medium'>Out of stock</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
                <div className='-mt-4'>
                    <div className="flex items-center mb-2">
                        <span className="text-yellow-400 text-xl mr-2">★</span>
                        <span className="text-gray-600 text-sm">{Number(displayRating.average || 0).toFixed(1)} ({displayRating.total || 0} reviews)</span>
                    </div>
                </div>

                {productAttributes.length > 0 && (
                    <div className='mt-4 mb-4'>
                        <h4 className='text-lg font-bold mb-2'>Product Details</h4>
                        <div className='flex flex-wrap gap-2'>
                            {productAttributes.map((item) => (
                                <div key={item.label} className='min-w-32.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-2'>
                                    <div className='text-[11px] uppercase tracking-wide text-gray-500'>{item.label}</div>
                                    <div className='text-sm font-semibold text-gray-800'>{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h2 className='text-lg font-bold mb-2'>Description</h2>
                    <p className='text-gray-700 text-sm'>{product?.description || 'Product description is not available yet.'}</p>
                </div>

                <div className='mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
                    <h4 className='text-lg font-bold mb-3'>Delivery & Returns</h4>
                    <div className='space-y-3 text-sm text-gray-700'>
                        <div className='flex items-start justify-between gap-4'>
                            <span className='font-medium text-gray-900'>Expected delivery</span>
                            <span className='text-right'>By <span className='font-semibold'>{formatDeliveryDate(product?.deliveryEstimate?.expectedDate)}</span></span>
                        </div>
                        <div className='flex items-start justify-between gap-4'>
                            <span className='font-medium text-gray-900'>Return policy</span>
                            <span className='text-right'>Easy return within <span className='font-semibold'>{product?.returnDays || 7} days</span> of delivery</span>
                        </div>
                        {product?.warranty && (
                            <div className='flex items-start justify-between gap-4'>
                                <span className='font-medium text-gray-900'>Warranty</span>
                                <span className='text-right'>{product?.warranty || 'Brand warranty where applicable'}</span>
                            </div>
                        )}
                        <div className='flex items-start justify-between gap-4'>
                            <span className='font-medium text-gray-900'>Shipping</span>
                            <span className='text-right'>Secure packaging and tracking updates</span>
                        </div>
                    </div>
                </div>

                {/* Ratings breakdown */}
                <div className='mt-4'>
                    <h4 className='text-lg font-bold mb-2'>Ratings</h4>
                    <div className='flex items-center gap-4'>
                        <div className='text-center'>
                            <div className='text-3xl font-bold'>{displayRating.average || 0}</div>
                            <div className='text-sm text-gray-600'>{displayRating.total} ratings</div>
                        </div>
                        <div className='flex-1'>
                            {[5, 4, 3, 2, 1].map((star, idx) => (
                                <div key={star} className='flex items-center gap-2 text-sm mb-1'>
                                    <div className='w-10 text-right'>{star}★</div>
                                    <div className='h-3 flex-1 rounded bg-gray-200 overflow-hidden'>
                                        <div style={{ width: `${displayRating.percent[idx]}%` }} className='h-full bg-yellow-400' />
                                    </div>
                                    <div className='w-10 text-right'>{displayRating.counts[idx]}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {isCheckingReviewEligibility ? null : (canReview && !myReview) || isEditingReview ? (
                    <div className='mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
                        <h4 className='text-lg font-bold mb-3'>Write a Review</h4>
                        <form onSubmit={handleSubmitReview} className='space-y-3'>
                            <div>
                                <label className='mb-1 block text-sm font-medium text-gray-700'>Rating</label>
                                <div className='flex items-center gap-1'>
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        const active = star <= Number(reviewRating);
                                        return (
                                            <button
                                                key={star}
                                                type='button'
                                                onClick={() => setReviewRating(star)}
                                                className='text-2xl transition-transform hover:scale-110'
                                                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                            >
                                                <FaStar className={active ? 'text-yellow-400' : 'text-gray-300'} />
                                            </button>
                                        );
                                    })}
                                    <span className='ml-2 text-sm text-gray-600'>{reviewRating} / 5</span>
                                </div>
                            </div>
                            <div>
                                <label className='mb-1 block text-sm font-medium text-gray-700'>Comment (optional)</label>
                                <textarea
                                    value={reviewComment}
                                    onChange={(event) => setReviewComment(event.target.value)}
                                    rows='4'
                                    placeholder='Share what you liked about the product... (optional)'
                                    className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400'
                                />
                            </div>
                            <div className='flex gap-2'>
                                <button
                                    type='submit'
                                    disabled={isSubmittingReview}
                                    className='flex-1 rounded-full bg-blue-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-60'
                                >
                                    {isSubmittingReview ? 'Submitting...' : (isEditingReview ? 'Update Review' : 'Submit Review')}
                                </button>
                                {isEditingReview && (
                                    <button type='button' onClick={() => { setIsEditingReview(false); setReviewComment(''); setReviewRating(5); }} className='rounded-full border px-4 py-3 text-sm'>Cancel</button>
                                )}
                            </div>
                        </form>
                    </div>
                ) : null}

                {/* Edit button for users who can edit their review */}
                {myReview && Boolean(myReview.canEdit) && !isEditingReview && (
                    <div className='mt-3'>
                        <button type='button' onClick={() => { setIsEditingReview(true); setReviewRating(Number(myReview.rating || 5)); setReviewComment(myReview.comment || ''); setCanReview(true); }} className='text-sm font-medium text-blue-600'>Edit your review</button>
                    </div>
                )}

                {/* Reviews carousel */}
                <div className='mt-4'>
                    <h4 className='text-lg font-bold mb-2'>Customer Reviews</h4>
                    {reviews.length === 0 ? (
                        <div className='text-sm text-gray-600'>No reviews yet.</div>
                    ) : (
                        <div className='relative'>
                            <div className='rounded-2xl border border-gray-200 bg-white p-2 shadow-sm'>
                                <div className='flex items-start gap-2'>
                                    <div className='h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden ring-1 ring-gray-50 shrink-0'>
                                        {reviews[currentReviewIndex]?.userId?.avatar ? (
                                            <img
                                                src={reviews[currentReviewIndex].userId.avatar}
                                                alt={reviews[currentReviewIndex].userId?.name || 'Customer'}
                                                className='h-full w-full object-cover'
                                            />
                                        ) : (
                                            <span className='text-lg font-semibold text-gray-500'>
                                                {(reviews[currentReviewIndex].userId?.name || 'U').slice(0, 1)}
                                            </span>
                                        )}
                                    </div>
                                    <div className='min-w-0 flex-1'>
                                        <div className='flex items-start justify-between gap-3'>
                                            <div>
                                                <div className='font-semibold text-sm text-gray-900 truncate'>
                                                    {reviews[currentReviewIndex].userId?.name || reviews[currentReviewIndex].customer || 'Anonymous'}
                                                </div>
                                                <div className='mt-1 flex items-center gap-1 text-sm'>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <FaStar
                                                            key={star}
                                                            className={star <= Number(reviews[currentReviewIndex].rating || 0) ? 'text-yellow-400' : 'text-gray-300'}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className='text-[10px] text-gray-400 whitespace-nowrap'>
                                                {new Date(reviews[currentReviewIndex].createdAt).toLocaleDateString('en-IN')}
                                            </div>
                                        </div>
                                        {reviews[currentReviewIndex].comment ? (
                                            <div
                                                className='mt-2 rounded-xl bg-gray-50 px-2 py-1 text-sm leading-5 text-gray-700 overflow-hidden'
                                                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                            >
                                                {reviews[currentReviewIndex].comment}
                                            </div>
                                        ) : (
                                            <div className='mt-2 text-sm text-gray-500 italic'>
                                                Rating only
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {reviews.length > 1 && (
                                <>
                                    <button type='button' onClick={() => setCurrentReviewIndex((i) => (i - 1 + reviews.length) % reviews.length)} className='absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-1 shadow-sm border border-gray-100 text-sm'>‹</button>
                                    <button type='button' onClick={() => setCurrentReviewIndex((i) => (i + 1) % reviews.length)} className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-1 shadow-sm border border-gray-100 text-sm'>›</button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* FAQ Section */}
                <div className='mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
                    <h4 className='text-lg font-bold mb-3'>Frequently Asked Questions</h4>
                    <div className='space-y-2'>
                        {[
                            { q: 'How long does delivery take?', a: 'Typically 2-3 business days across major cities.' },
                            { q: 'Is this product original?', a: 'Yes, all our products are 100% authentic and come with warranty.' },
                            { q: 'What is the return policy?', a: `Easy returns within ${product?.returnDays || 7} days of delivery.` },
                            { q: 'Do you offer international shipping?', a: 'Currently, we ship only within India.' }
                        ].map((faq, idx) => (
                            <details key={idx} className='border-b border-gray-100 py-2'>
                                <summary className='cursor-pointer font-medium text-gray-700 hover:text-blue-600'>
                                    {faq.q}
                                </summary>
                                <p className='mt-2 text-sm text-gray-600 ml-2'>{faq.a}</p>
                            </details>
                        ))}
                    </div>
                </div>

                {/* Enhanced Seller Info */}
                {product?.createdBy?.name && (
                    <div className='mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
                        <h4 className='text-lg font-bold mb-3'>About Seller</h4>
                        <div className='flex items-start gap-3'>
                            <div className='h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0'>
                                <span className='text-lg font-bold text-blue-600'>{product.createdBy.name.charAt(0)}</span>
                            </div>
                            <div className='flex-1'>
                                <div className='font-semibold text-gray-800'>{product.createdBy.name}</div>
                                <div className='flex items-center gap-2 mt-1'>
                                    <div className='flex items-center gap-1'>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <FaStar key={star} className='text-yellow-400 text-sm' />
                                        ))}
                                    </div>
                                    <span className='text-sm text-gray-600'>4.5 (1.2K reviews)</span>
                                </div>
                                <div className='mt-2 text-sm text-gray-600 space-y-1'>
                                    <div>✓ Fast & Reliable Shipping</div>
                                    <div>✓ Customer Support Available</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recently Viewed Products */}
                {recentlyViewed.length > 0 && (
                    <div className='mt-4'>
                        <h4 className='text-lg font-bold mb-3'>Recently Viewed</h4>
                        <div className='flex gap-3 overflow-x-auto pb-2 no-scrollbar'>
                            {recentlyViewed.map((item) => {
                                const productId = item?._id || item?.id;
                                const image = Array.isArray(item.images) && item.images[0] ? item.images[0] : 'https://via.placeholder.com/300x300?text=Product';

                                return (
                                    <div key={productId} className='relative overflow-hidden rounded-lg bg-white flex-shrink-0 w-32'>
                                        <button type='button' onClick={() => navigate(`/product/${productId}`)} className='block p-0 m-0'>
                                            <img src={image} alt={item?.productName || 'Product'} className='h-32 w-full object-cover' />
                                        </button>
                                        <div className='flex h-12 items-center justify-between bg-gray-100 p-2 leading-tight'>
                                            <div className='w-full overflow-hidden leading-tight'>
                                                <h2 className='truncate text-[12px] font-bold'>{item?.productName || 'Product Name'}</h2>
                                                <p className='text-[12px] font-bold text-blue-500'>₹{Number(item.price || 0).toLocaleString('en-IN')}</p>
                                            </div>
                                            <span className='text-[12px]'><span className='text-sm'>⭐</span>{Number(item.rating || 0)}</span>
                                        </div>
                                        <div className='absolute right-2 top-2'>
                                            {isProductInCart(productId) ? (
                                                <button type='button' onClick={() => handleRemoveFromCartById(productId)} className='cursor-pointer' title='Remove from cart' disabled={addingProductId === productId}>
                                                    <FaHeart className='text-lg text-red-400' />
                                                </button>
                                            ) : (
                                                <button type='button' onClick={() => handleAddToCartById(productId)} className='cursor-pointer text-2xl text-blue-500 disabled:opacity-60' disabled={addingProductId === productId}>
                                                    <FaRegHeart className='text-lg text-gray-500' />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className='mt-4'>
                        <h4 className='text-lg font-bold mb-3'>Related Products</h4>
                        {isLoadingRelated ? (
                            <div className='text-sm text-gray-600'>Loading...</div>
                        ) : (
                            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3'>
                                {relatedProducts.map((item) => {
                                    const productId = item?._id || item?.id;
                                    const image = Array.isArray(item.images) && item.images[0] ? item.images[0] : 'https://via.placeholder.com/300x300?text=Product';

                                    return (
                                        <div key={productId} className='relative overflow-hidden rounded-lg bg-white w-40'>
                                            <button type='button' onClick={() => navigate(`/product/${productId}`)} className='block p-0 m-0'>
                                                <img src={image} alt={item?.productName || 'Product'} className='w-40 h-36 aspect-square object-cover' />
                                            </button>
                                            <div className='flex h-12 items-center justify-between bg-gray-100 p-2 leading-tight'>
                                                <div className='w-full overflow-hidden leading-tight'>
                                                    <h2 className='truncate text-[12px] font-bold'>{item?.productName || 'Product Name'}</h2>
                                                    <p className='text-[12px] font-bold text-blue-500'>₹{Number(item.price || 0).toLocaleString('en-IN')}</p>
                                                </div>
                                                <span className='text-[12px]'><span className='text-sm'>⭐</span>{Number(item.rating || 0)}</span>
                                            </div>
                                            <div className='absolute right-2 top-2'>
                                                {isProductInCart(productId) ? (
                                                    <button type='button' onClick={() => handleRemoveFromCartById(productId)} className='cursor-pointer' title='Remove from cart' disabled={addingProductId === productId}>
                                                        <FaHeart className='text-lg text-red-400' />
                                                    </button>
                                                ) : (
                                                    <button type='button' onClick={() => handleAddToCartById(productId)} className='cursor-pointer text-2xl text-blue-500 disabled:opacity-60' disabled={addingProductId === productId}>
                                                        <FaRegHeart className='text-lg text-gray-500' />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className='fixed bg-white bottom-0 left-0 p-3 right-0'>
                <div className='flex relative items-center'>
                    <button
                        type='button'
                        onClick={handleCheckout}
                        disabled={isLoading || !product || isAddingToCart}
                        className='w-[70%] bg-blue-500 text-white p-3 rounded-full font-bold disabled:opacity-60'
                    >
                        Proceed to Checkout
                    </button>
                    <button type='button' onClick={handleAddToCart} className='absolute items-center right-10 text-3xl' disabled={isLoading || !product || isAddingToCart}>
                        <FaCartArrowDown />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProductDetails