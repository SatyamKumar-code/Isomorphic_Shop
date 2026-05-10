import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../backButton'
import { FaCartArrowDown } from "react-icons/fa";
import { FaHeart, FaStar } from "react-icons/fa6";
import { fetchDataFromApi, postData } from '../../utils/api';
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
    const [canEditReview, setCanEditReview] = useState(false);
    const [isCheckingReviewEligibility, setIsCheckingReviewEligibility] = useState(true);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [userPendingRating, setUserPendingRating] = useState(null);
    const [isEditingReview, setIsEditingReview] = useState(false);
    const reviewPageActiveRef = useRef(false);

    const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

    const calculateDeliveryDate = (days = 3) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
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
                if (response?.myReview?.canEdit) {
                    setCanEditReview(true);
                }
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
                    image: product?.images?.[0] || '',
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

    useEffect(() => {
        if (!id) {
            return;
        }

        reviewPageActiveRef.current = true;
        setIsCheckingReviewEligibility(true);
        setCanReview(false);
        setCanEditReview(false);

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
                    setCanReview(eligible);
                    setCanEditReview(repeatEligible);

                    if (repeatEligible && myReview) {
                        setMyReview((current) => current ? { ...current, canEdit: true } : current);
                    }
                }
            } catch (error) {
                if (reviewPageActiveRef.current) {
                    setCanReview(false);
                    setCanEditReview(false);
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

        return () => {
            reviewPageActiveRef.current = false;
        };
    }, [id, context?.isLoggedIn, context?.userData?._id]);

    return (
        <div className='relative w-full min-h-screen pb-28 product-details-page'>
            <div className='absolute top-4 left-4'>
                <BackButton />
            </div>
            <div className='w-full h-100 bg-amber-50 rounded-b-xl overflow-hidden flex items-center justify-center'>
                <img
                    src={product?.images?.[0] || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFYqoKTu_o3Zns2yExbst2Co84Gpc2Q1RJbA&s"}
                    alt={product?.productName || 'Product'}
                    className='w-full h-100 object-cover'
                />
            </div>
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
                <div>
                    <h2 className='text-lg font-bold mb-2'>Description</h2>
                    <p className='text-gray-700 text-sm'>{product?.description || 'Product description is not available yet.'}</p>
                </div>

                <div className='mt-4'>
                    <h4 className='text-lg font-bold mb-2'>Offers</h4>
                    <ul className='list-disc list-inside text-sm text-gray-700'>
                        <li>Bank Offer: 5% off on XYZ Bank cards</li>
                        {product?.discountPercentage > 0 && (
                            <li>Limited time discount: {Number(product.discountPercentage)}% off</li>
                        )}
                        <li>Special Price: Get extra discount on first order</li>
                    </ul>
                </div>

                <div className='mt-4'>
                    <h4 className='text-lg font-bold mb-2'>Delivery</h4>
                    <div className='text-sm text-gray-700'>
                        Delivery by <span className='font-medium'>{calculateDeliveryDate(3)}</span> | Free delivery on orders above ₹499
                    </div>
                </div>

                {product?.createdBy?.name && (
                    <div className='mt-4'>
                        <h4 className='text-lg font-bold mb-2'>Seller</h4>
                        <div className='text-sm text-gray-700'>Sold by <span className='font-medium text-gray-800'>{product.createdBy.name}</span></div>
                    </div>
                )}

                {productAttributes.length > 0 && (
                    <div className='mt-4 mb-15'>
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
                {myReview && (canEditReview || myReview.canEdit) && !isEditingReview && (
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
            </div>
            <div className='fixed bottom-1 left-0 p-3 right-0'>
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