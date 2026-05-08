import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../backButton'
import { FaCartArrowDown } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";
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

    const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

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

        let isMounted = true;

        setIsLoading(true);

        fetchDataFromApi(`/api/product/${id}`).then((response) => {
            if (isMounted) {
                setProduct(response?.product || null);
                setIsLoading(false);
            }
        });

        postData('/api/dashboard/product-view', {
            productId: id,
            viewerKey: getViewerKey(),
            countryCode: getCountryCode(),
        });

        return () => {
            isMounted = false;
        };
    }, [id]);

    return (
        <div className='relative w-full h-screen product-details-page'>
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
            <div className='p-4 w-full'>
                {isLoading ? (
                    <>
                        <div className='h-6 w-1/2 animate-pulse rounded bg-gray-200' />
                        <div className='mt-2 h-5 w-24 animate-pulse rounded bg-gray-200' />
                    </>
                ) : (
                    <>
                        <h1 className='text-xl font-bold'>{product?.productName || 'Product Name'}</h1>
                        <span className='text-blue-500 font-bold flex justify-end!'>{formatPrice(product?.price)}</span>
                    </>
                )}
                <div className='-mt-4'>
                    <div className="flex items-center mb-2">
                        <span className="text-yellow-400 text-xl mr-2">★</span>
                        <span className="text-gray-600 text-sm">{Number(product?.rating || 0).toFixed(1)} ({product?.reviewCount || 0} reviews)</span>
                    </div>
                </div>
                <div>
                    <h2 className='text-lg font-bold mb-2'>Description</h2>
                    <p className='text-gray-700 text-sm'>{product?.description || 'Product description is not available yet.'}</p>
                </div>

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