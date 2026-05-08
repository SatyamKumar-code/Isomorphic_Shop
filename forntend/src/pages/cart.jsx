import React, { useContext, useEffect, useMemo, useState } from 'react'
import BackButton from '../components/backButton'
import { BiDotsVerticalRounded } from "react-icons/bi";
import { MdDeleteForever } from "react-icons/md";
import { FiMinus } from "react-icons/fi";
import { FiPlus } from "react-icons/fi";
import { Link } from 'react-router-dom';
import { deleteData, editData, fetchDataFromApi } from '../utils/api';
import { MyContext } from '../App';

const Cart = () => {
    const context = useContext(MyContext);
    const [cartItems, setCartItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cartSummary, setCartSummary] = useState({ itemCount: 0, totalAmount: 0 });

    const loadCart = async () => {
        setIsLoading(true);

        const [detailsRes, countRes, totalRes] = await Promise.allSettled([
            fetchDataFromApi('/api/cart/details'),
            fetchDataFromApi('/api/cart/item-count'),
            fetchDataFromApi('/api/cart/total-amount'),
        ]);

        setCartItems(detailsRes.status === 'fulfilled' ? detailsRes.value?.data?.products || [] : []);
        setCartSummary({
            itemCount: countRes.status === 'fulfilled' ? countRes.value?.data?.itemCount || 0 : 0,
            totalAmount: totalRes.status === 'fulfilled' ? totalRes.value?.data?.totalAmount || 0 : 0,
        });
        setIsLoading(false);
    };

    useEffect(() => {
        loadCart();
    }, []);

    const subtotal = useMemo(() => cartSummary.totalAmount || 0, [cartSummary.totalAmount]);
    const deliveryCharges = 2;
    const total = subtotal + deliveryCharges;

    const updateQuantity = async (productId, quantity) => {
        if (quantity < 1) {
            context.alertBox('error', 'Quantity must be at least 1');
            return;
        }
        const response = await editData('/api/cart/update', { productId, quantity });
        if (response?.error === false) {
            context.alertBox('Success', 'Quantity updated');
            await loadCart();
        } else {
            context.alertBox('error', response?.message || 'Unable to update quantity');
        }
    };

    const removeItem = async (productId) => {
        const response = await deleteData(`/api/cart/remove/${productId}`);
        if (response?.error === false) {
            context.alertBox('Success', 'Item removed from cart');
            await loadCart();
        } else {
            context.alertBox('error', response?.message || 'Unable to remove item');
        }
    };

    return (
        <div className='relative w-full h-screen'>
            <div className='absolute top-0 left-0 w-full'>
                <div className='flex items-center justify-between w-full'>
                    <BackButton />
                    <h2 className='font-bold'>Cart</h2>
                    <div className='w-10 h-10 items-center justify-center flex rounded-full bg-gray-100'>
                        <BiDotsVerticalRounded className='text-2xl' />
                    </div>
                </div>
            </div>

            <div className='w-full h-full mb-75! mt-10 overflow-y-auto'>
                {isLoading ? (
                    <div className='mt-16 text-sm text-gray-500'>Loading cart...</div>
                ) : cartItems.length > 0 ? (
                    cartItems.map((item) => {
                        const product = item?.productId || {};
                        const productId = product?._id || product?.id;
                        const quantity = Number(item?.quantity || 1);
                        const image = product?.images?.[0] || 'https://via.placeholder.com/300x300?text=Product';

                        return (
                            <div key={productId} className='flex w-full h-27.5 items-center rounded-lg bg-gray-100 mt-2'>
                                <img src={image} alt={product?.productName || 'Product'} className='w-31.5 h-24.75 rounded-xl object-cover' />
                                <div className='ml-4'>
                                    <h4 className='font-bold text-[14px]'>{product?.productName || 'Product Name'}</h4>
                                    <p className='text-gray-500 text-[12px] my-2'>{product?.brand || 'brand name'}</p>
                                    <span className='text-blue-500 font-bold text-[14px]'>₹{Number(product?.price || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className='relative items-between ml-auto mr-4'>
                                    <div className='justify-end mb-8 flex'>
                                        <button type='button' onClick={() => removeItem(productId)} aria-label='Remove item'>
                                            <MdDeleteForever className='text-3xl text-red-400' />
                                        </button>
                                    </div>
                                    <div className='flex items-center justify-center mt-2'>
                                        <button className='bg-blue-500 text-white w-7 h-7 items-center justify-center flex p-[8px] rounded-full' onClick={() => updateQuantity(productId, Math.max(1, quantity - 1))}><FiMinus /></button>
                                        <span className='font-semibold text-lg mx-2'>{quantity}</span>
                                        <button className='bg-blue-500 text-white flex items-center justify-center w-7 h-7 rounded-full' onClick={() => updateQuantity(productId, quantity + 1)}><FiPlus /></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className='mt-16 rounded-lg bg-gray-100 p-6 text-center'>
                        <h3 className='font-bold text-lg'>Your cart is empty</h3>
                        <p className='text-sm text-gray-600 mt-2'>Add items to your cart to start shopping.</p>
                        
                    </div>
                )}
            </div>

            <div className='fixed bottom-0 left-0 w-full p-4 bg-white rounded-t-lg'>
                {cartItems.length > 0 ? (
                    <>
                        <h4 className='font-bold text-lg'>Order Summary</h4>
                        <div>
                            <div className='flex items-center justify-between mt-2'>
                                <span className='font-semibold text-gray-600'>Items</span>
                                <span className='font-bold text-gray-600'>{cartSummary.itemCount}</span>
                            </div>
                            <div className='flex items-center justify-between mt-2'>
                                <span className='font-semibold text-gray-600'>Subtotal</span>
                                <span className='font-bold text-gray-600'>₹{Number(subtotal).toLocaleString('en-IN')}</span>
                            </div>
                            <div className='flex items-center justify-between mt-2'>
                                <span className='font-semibold text-gray-600'>Discount</span>
                                <span className='font-bold text-gray-600'>₹0.00</span>
                            </div>
                            <div className='flex items-center justify-between mt-2'>
                                <span className='font-semibold text-gray-600'>Delivery Charges</span>
                                <span className='font-bold text-gray-600'>₹{deliveryCharges.toFixed(2)}</span>
                            </div>
                            <hr className='my-2' />
                            <div className='flex items-center justify-between mt-2'>
                                <span className='font-bold text-gray-900'>Total</span>
                                <span className='font-bold text-gray-900'>₹{Number(total).toLocaleString('en-IN')}</span>
                            </div>
                            <Link to='/checkout'>
                                <button className='w-full bg-blue-500 text-white p-3 rounded-full font-bold mt-4'>Check Out</button>
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className='text-center opacity-90'>
                        <h4 className='font-bold text-lg'>Order Summary</h4>
                        <p className='text-sm text-gray-600 mt-2'>Your cart is empty — add items to see totals.</p>
                        <Link to='/' className='block mt-4'>
                            <button className='w-full bg-blue-500 text-white p-3 rounded-full font-bold'>Shop Products</button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Cart
