import React, { useContext, useEffect, useState } from 'react'
import BackButton from '../components/backButton'
import { BiDotsVerticalRounded } from 'react-icons/bi'
import { MdWatchLater } from "react-icons/md";
import { useLocation, useNavigate } from 'react-router-dom';
import { SiRazorpay } from "react-icons/si";
import { TiTick } from "react-icons/ti";
import { TbCoinRupeeFilled } from "react-icons/tb";
import { fetchDataFromApi, postData } from '../utils/api';
import AddressForm from '../components/address/AddressForm';
import { MyContext } from '../App';

const CheckOut = () => {
    const context = useContext(MyContext);
    const location = useLocation();
    const selectedProduct = location.state?.selectedProduct || null;
    const [selectedPayment, setSelectedPayment] = useState('razorpay');
    const [cartSummary, setCartSummary] = useState({ itemCount: 0, totalAmount: 0 });
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [showAddressPicker, setShowAddressPicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const [showQuickAdd, setShowQuickAdd] = useState(false);

    const subtotal = selectedProduct
        ? Number(selectedProduct.price || 0) * Number(selectedProduct.quantity || 1)
        : Number(cartSummary.totalAmount || 0);
    const itemCount = selectedProduct ? Number(selectedProduct.quantity || 1) : Number(cartSummary.itemCount || 0);

    const loadSummary = async () => {
        if (selectedProduct) {
            setCartSummary({
                itemCount: Number(selectedProduct.quantity || 1),
                totalAmount: Number(selectedProduct.price || 0) * Number(selectedProduct.quantity || 1),
            });

            const addressRes = await fetchDataFromApi('/api/address/');
            const fetchedAddresses = addressRes?.address || [];
            setAddresses(fetchedAddresses);
            const defaultAddr = fetchedAddresses.find((a) => a.isDefault) || fetchedAddresses[0] || null;
            setSelectedAddress((prev) => prev || defaultAddr);
            return;
        }

        const [countRes, totalRes, addressRes] = await Promise.allSettled([
            fetchDataFromApi('/api/cart/item-count'),
            fetchDataFromApi('/api/cart/total-amount'),
            fetchDataFromApi('/api/address/'),
        ]);

        setCartSummary({
            itemCount: countRes.status === 'fulfilled' ? countRes.value?.data?.itemCount || 0 : 0,
            totalAmount: totalRes.status === 'fulfilled' ? totalRes.value?.data?.totalAmount || 0 : 0,
        });

        const fetchedAddresses = addressRes.status === 'fulfilled' ? addressRes.value?.address || [] : [];
        setAddresses(fetchedAddresses);
        const defaultAddr = fetchedAddresses.find((a) => a.isDefault) || fetchedAddresses[0] || null;
        setSelectedAddress((prev) => prev || defaultAddr);
    };

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    useEffect(() => {
        loadSummary();
    }, [selectedProduct]);

    const handleRazorpayPayment = async () => {
        if (!selectedAddress?._id) {
            context.alertBox('error', 'Please add a delivery address before placing the order.');
            return;
        }

        try {
            setIsSubmitting(true);
            const initResponse = await postData('/api/order/razorpay/initialize', {
                delivery_address: selectedAddress._id,
                ...(selectedProduct
                    ? {
                        products: [{
                            productId: selectedProduct._id,
                            quantity: selectedProduct.quantity || 1,
                        }],
                    }
                    : {}),
            });

            if (initResponse?.error) {
                context.alertBox('error', initResponse?.message || 'Failed to initialize payment');
                setIsSubmitting(false);
                return;
            }

            const { orderId, amount, currency, key_id, user_email, user_name, user_phone } = initResponse?.data || {};

            const options = {
                key: key_id,
                amount: amount,
                currency: currency,
                name: 'Isomorphic Shop',
                description: 'Order Payment',
                order_id: orderId,
                prefill: {
                    name: user_name,
                    email: user_email,
                    contact: user_phone,
                },
                theme: {
                    color: '#3b82f6',
                },
                handler: async (response) => {
                    try {
                        const createOrderResponse = await postData('/api/order/razorpay', {
                            paymentId: response.razorpay_payment_id,
                            delivery_address: selectedAddress._id,
                            ...(selectedProduct
                                ? {
                                    products: [{
                                        productId: selectedProduct._id,
                                        quantity: selectedProduct.quantity || 1,
                                    }],
                                }
                                : {}),
                        });

                        if (createOrderResponse?.error === false) {
                            context.alertBox('Success', 'Order placed successfully.');
                            navigate('/orders');
                        } else {
                            context.alertBox('error', createOrderResponse?.message || 'Failed to create order after payment');
                        }
                    } catch (error) {
                        context.alertBox('error', 'Error creating order: ' + error.message);
                    }
                    setIsSubmitting(false);
                },
                modal: {
                    ondismiss: () => {
                        setIsSubmitting(false);
                        context.alertBox('info', 'Payment cancelled');
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            context.alertBox('error', 'Error initiating payment: ' + error.message);
            setIsSubmitting(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (selectedPayment === 'razorpay') {
            await handleRazorpayPayment();
            return;
        }

        if (!selectedAddress?._id) {
            context.alertBox('error', 'Please add a delivery address before placing the order.');
            return;
        }

        setIsSubmitting(true);
        const response = await postData('/api/order/cod', {
            delivery_address: selectedAddress._id,
            ...(selectedProduct
                ? {
                    products: [{
                        productId: selectedProduct._id,
                        quantity: selectedProduct.quantity || 1,
                    }],
                }
                : {}),
        });
        setIsSubmitting(false);

        if (response?.error === false) {
            context.alertBox('Success', 'Order placed successfully.');
            navigate('/orders');
            return;
        }

        context.alertBox('error', response?.message || 'Unable to place order.');
    };


    return (
        <div className='relative w-full h-screen'>
            <div className='flex items-center justify-between w-full'>
                <BackButton />
                <h2 className='font-bold'>Check Out</h2>
                <div >
                    {/* <BiDotsVerticalRounded className='text-2xl' /> */}
                </div>
            </div>
            {selectedProduct && (
                <div className='mb-4'>
                    <h4 className='font-bold text-lg my-1 px-2'>Selected Product</h4>
                    <div className='flex items-center bg-blue-50 gap-3 rounded-lg p-2'>
                        <img
                            src={selectedProduct.image || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFYqoKTu_o3Zns2yExbst2Co84Gpc2Q1RJbA&s'}
                            alt={selectedProduct.productName || 'Product'}
                            className='h-16 w-16 rounded-lg object-cover'
                        />
                        <div className='min-w-0'>
                            <div className='font-semibold text-gray-900'>{selectedProduct.productName || 'Product Name'}</div>
                            <div className='text-sm text-gray-600'>Qty: {selectedProduct.quantity || 1}</div>
                            <div className='text-sm font-bold text-blue-600'>₹{Number(subtotal || 0).toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                </div>
            )}
            <div className='flex gap-4 my-4 leading-3'>
                <div className='w-10 h-10 items-center flex justify-center bg-gray-100 rounded-full'>
                    <img src="location.png" />
                </div>
                <div>
                    <h4 className='font-bold text-[14px]'>Delivery Location</h4>
                    <p className='text-gray-500 text-[12px] my-2'>
                        {selectedAddress
                            ? `${selectedAddress.address_line1}, ${selectedAddress.city}, ${selectedAddress.state}`
                            : 'Select a saved address before placing the order.'}
                    </p>
                    <div className='mt-2'>
                        <button type='button' onClick={() => setShowAddressPicker(!showAddressPicker)} className='text-sm text-blue-500 hover:underline'>
                            {showAddressPicker ? 'Close' : (addresses.length ? 'Change' : 'Add address')}
                        </button>
                    </div>
                    {showAddressPicker && (
                        <div className='mt-3 space-y-2'>
                            {addresses.length === 0 && <div className='text-sm text-gray-500'>No saved addresses. Add one from Addresses page.</div>}
                            {addresses.map((a) => (
                                <label key={a._id || a.id} className='flex items-start gap-3 p-2 border rounded'>
                                    <input type='radio' name='selectedAddress' checked={selectedAddress?._id === (a._id || a.id)} onChange={() => { setSelectedAddress(a); setShowAddressPicker(false); }} />
                                    <div>
                                        <div className='font-semibold'>{a.name || a.addressType || 'Address'}</div>
                                        <div className='text-sm'>{a.address_line1}, {a.city} - {a.pincode}</div>
                                    </div>
                                </label>
                            ))}
                            <div className='flex gap-3 items-center'>
                                <a href='/addresses' className='text-sm text-blue-500 hover:underline'>Manage addresses</a>
                                <button type='button' onClick={() => setShowQuickAdd(true)} className='text-sm text-green-600 hover:underline'>Add address</button>
                            </div>
                        </div>
                    )}

                    {showQuickAdd && (
                        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
                            <div className='bg-white rounded p-4 w-full max-w-md'>
                                <div className='flex justify-between items-center mb-2'>
                                    <h3 className='font-semibold'>Add Address</h3>
                                    <button onClick={() => setShowQuickAdd(false)} className='text-gray-500'>Close</button>
                                </div>
                                <AddressForm onAdd={async () => { await loadSummary(); setShowQuickAdd(false); }} onDone={() => { setShowQuickAdd(false); }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className='flex gap-4 my-4 leading-3'>
                <div className='w-10 h-10 items-center flex justify-center bg-gray-100 rounded-full' >
                    <MdWatchLater className='text-2xl text-indigo-500' />
                </div>
                <div>
                    <h4 className='font-bold text-[14px]'>Delivery Time</h4>
                    <p className='text-gray-500 text-[12px] my-2'>Expected delivery within 2-3 days</p>
                </div>
            </div>


            <div className=' w-full'>


                <div className='rounded-lg bg-gray-100 px-4 pt-3'>
                    <div className='flex items-center justify-between gap-3'>
                        <div>
                            <h4 className='text-lg font-bold'>Choose Payment Method</h4>
                            <p className='text-[12px] text-gray-500'>Use Razorpay for online payments or place the order with COD.</p>
                        </div>
                        <span className='text-[12px] font-semibold uppercase tracking-wide text-gray-500'>
                            {selectedPayment === 'razorpay' ? 'Razorpay selected' : 'COD selected'}
                        </span>
                    </div>

                    <div className='mt-4 space-y-3'>
                        <button
                            type='button'
                            onClick={() => setSelectedPayment('COD')}
                            className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition ${selectedPayment === 'COD' ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-gray-200'}`}
                        >
                            <div className='flex items-center gap-3'>
                                <span className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600'>
                                    <TbCoinRupeeFilled className='text-lg' />
                                </span>
                                <div>
                                    <h4 className='font-semibold text-gray-900'>Cash on Delivery</h4>
                                    <p className='text-[12px] text-gray-500'>Pay when the order is delivered</p>
                                </div>
                            </div>
                            {selectedPayment === 'COD' && <TiTick className='text-2xl text-green-500' />}
                        </button>

                        <button
                            type='button'
                            onClick={() => setSelectedPayment('razorpay')}
                            className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition ${selectedPayment === 'razorpay' ? 'border-blue-200 ring-2 ring-blue-100' : 'border-gray-200'}`}
                        >
                            <div className='flex items-center gap-3'>
                                <span className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600'>
                                    <SiRazorpay className='text-lg' />
                                </span>
                                <div>
                                    <h4 className='font-semibold text-gray-900'>Razorpay</h4>
                                    <p className='text-[12px] text-gray-500'>UPI, card, netbanking, wallet, EMI</p>
                                </div>
                            </div>
                            {selectedPayment === 'razorpay' && <TiTick className='text-2xl text-green-500' />}
                        </button>
                    </div>
                </div>

                <div className='bg-gray-100 py-3 rounded-lg'>
                    <hr />
                </div>
                <div className='bg-gray-100 px-4 pb-4 rounded-lg'>
                    <h4 className='font-bold text-lg'>Order Summary</h4>
                    <div>
                        <div className='flex items-center justify-between mt-2'>
                            <span className='font-semibold text-gray-600'>Items</span>
                            <span className='font-bold text-gray-600'>{itemCount}</span>
                        </div>
                        <div className='flex items-center justify-between mt-2'>
                            <span className='font-semibold text-gray-600'>Subtotal</span>
                            <span className='font-bold text-gray-600'>₹{Number(subtotal || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className='flex items-center justify-between mt-2'>
                            <span className='font-semibold text-gray-600'>Discount</span>
                            <span className='font-bold text-gray-600'>₹0.00</span>
                        </div>
                        <div className='flex items-center justify-between mt-2'>
                            <span className='font-semibold text-gray-600'>Delivery Charges</span>
                            <span className='font-bold text-gray-600'>₹2.00</span>
                        </div>
                        <hr className='my-2' />
                        <div className='flex items-center justify-between mt-2'>
                            <span className='font-bold text-gray-900'>Total</span>
                            <span className='font-bold text-gray-900'>₹{Number((subtotal || 0) + 2).toLocaleString('en-IN')}</span>
                        </div>

                        <button type='button' onClick={handlePlaceOrder} disabled={isSubmitting} className='mt-2 w-full rounded-full bg-blue-500 p-3 font-bold text-white disabled:opacity-60'>
                            {isSubmitting
                                ? 'Processing...'
                                : selectedPayment === 'COD'
                                    ? 'Place COD Order'
                                    : 'Pay with Razorpay'}
                        </button>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckOut