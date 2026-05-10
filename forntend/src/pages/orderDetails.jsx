import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchDataFromApi } from '../utils/api'
import BackButton from '../components/backButton'
import { FaDownload, FaMapPin, FaUser } from 'react-icons/fa6'
import { FaCheck } from "react-icons/fa";
import { ImCross } from "react-icons/im";

const suggestionItems = [
    {
        title: 'Power Banks',
        discount: 'Min. 50% Off',
        image: 'https://via.placeholder.com/180x180?text=Power+Bank'
    },
    {
        title: 'Men\'s Sports Shoes',
        discount: 'Min. 70% Off',
        image: 'https://via.placeholder.com/180x180?text=Shoes'
    },
    {
        title: 'Mobiles',
        discount: 'Min. 50% Off',
        image: 'https://via.placeholder.com/180x180?text=Mobile'
    }
]

const formatOrderId = (id) => {
    if (!id) return 'OD0000000000000000'
    return `OD${String(id).replace(/[^a-fA-F0-9]/g, '').slice(-16).toUpperCase().padStart(16, '0')}`
}

const formatAddress = (address) => {
    if (!address || typeof address !== 'object') {
        return 'Address not available'
    }

    const parts = [
        address.address_line1,
        address.landmark,
        address.city,
        address.state,
        address.pincode,
        address.country
    ].filter(Boolean)

    return parts.join(', ')
}

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    console.log(order);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const res = await fetchDataFromApi('/api/order/my-orders');
            const list = res?.orders || [];
            const found = list.find((item) => String(item._id) === String(id));
            setOrder(found || null);
            setLoading(false);
        }

        load();
    }, [id]);

    const product = order?.products?.[0]?.productId || {};
    const productId = product?._id || product?.id;
    const quantity = order?.products?.[0]?.quantity || 1;
    const image = product?.images?.[0] || 'https://via.placeholder.com/300x300?text=Product';
    const status = String(order?.status || 'pending').toLowerCase();
    const orderIdLabel = useMemo(() => formatOrderId(order?._id), [order?._id]);
    const listingPrice = Number(product?.oldPrice);
    const salePrice = Number(product?.price);
    const totalAmount = Number(order?.totalAmount || product?.salePrice || product?.price || 0);
    const feeAmount = listingPrice > totalAmount ? Math.max(listingPrice - totalAmount, 0) : 0;
    const deliveryText = status === 'delivered'
        ? `Delivered, ${order?.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Nov 01, 2025'}`
        : status === 'cancelled'
            ? 'Order Cancelled'
            : 'Processing';

    if (loading) {
        return <div className='p-4 text-sm text-gray-500'>Loading...</div>;
    }

    if (!order) {
        return <div className='p-4 text-sm text-gray-500'>Order not found.</div>;
    }

    return (
        <div className='min-h-screen bg-[#f6f7fb] pb-8'>
            <div className='sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3'>
                <div className='flex items-center gap-3'>
                    <BackButton />
                    <h1 className='text-[22px] font-semibold text-gray-900'>Order Details</h1>
                </div>

                <button type='button' className='rounded-xl border border-gray-200 bg-white px-4 py-2 text-[14px] font-semibold text-gray-800 shadow-sm'>
                    Help
                </button>
            </div>

            <div className='px-1 pt-4 pb-4'>
                <div className='flex items-start gap-3 rounded-2xl bg-white p-3'>
                    {productId ? (
                        <Link to={`/product/${productId}`} className='flex min-w-0 flex-1 items-start gap-3'>
                            <img src={image} alt={product?.productName || 'Product'} className='h-14 w-14 rounded-xl object-cover' />
                            <div className='min-w-0 flex-1'>
                                <h2 className='truncate text-[16px] font-medium leading-5 text-gray-900'>
                                    {product?.productName || 'Product'}
                                </h2>
                                <p className='mt-1 text-[13px] text-gray-500'>
                                    Color: {product?.color || 'Black'}
                                </p>
                            </div>
                        </Link>
                    ) : (
                        <>
                            <img src={image} alt={product?.productName || 'Product'} className='h-14 w-14 rounded-xl object-cover' />
                            <div className='min-w-0 flex-1'>
                                <h2 className='truncate text-[16px] font-medium leading-5 text-gray-900'>
                                    {product?.productName || 'Product'}
                                </h2>
                                <p className='mt-1 text-[13px] text-gray-500'>
                                    Color: {product?.color || 'Black'}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                <div className='mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
                    <div className='flex items-center justify-between'>
                        <p className={`text-[17px] font-semibold ${status === 'cancelled' ? 'text-red-600' : 'text-green-600'}`}>
                            {deliveryText}
                        </p>
                        <div className={`flex h-10 w-10 text-xl items-center justify-center rounded-full ${status === 'cancelled' ? 'bg-red-500' : 'bg-green-600'} text-white`}>
                            {status === 'cancelled' ? <ImCross /> : <FaCheck className='text-white font-bold!' />}
                        </div>
                    </div>

                    <div className='mt-4 border-t border-gray-100 pt-4 text-center'>
                        <Link to={`/order/${order._id}/status`} className='text-[16px] font-semibold text-blue-600'>
                            See all updates
                        </Link>
                    </div>
                </div>

                {/* <div className='mt-4 rounded-2xl bg-[#1557ff] p-4 text-white shadow-lg'>
                    <div className='flex items-center justify-between gap-3'>
                        <div className='max-w-[65%]'>
                            <p className='text-[22px] font-extrabold leading-6'>
                                5% Cashback + 5% Instant Discount*
                            </p>
                            <p className='mt-2 text-[14px] text-blue-100'>
                                Flipkart Axis Bank Credit Card
                            </p>
                            <p className='mt-2 text-[18px] font-bold'>Apply now &gt;</p>
                        </div>
                        <div className='rounded-2xl bg-white/15 px-3 py-4 text-center'>
                            <div className='rounded-xl bg-yellow-300 px-3 py-2 text-[12px] font-bold text-black'>
                                Get ?500 Voucher
                            </div>
                        </div>
                    </div>
                </div> */}

                <div className='mt-6'>
                    <h3 className='mb-3 text-[18px] font-semibold text-gray-900'>You might be also interested in</h3>
                    <div className='flex gap-3 overflow-x-auto pb-1'>
                        {suggestionItems.map((item) => (
                            <div key={item.title} className='w-32 shrink-0 rounded-xl border border-gray-200 bg-white p-2 text-center'>
                                <img src={item.image} alt={item.title} className='h-24 w-full rounded-lg object-cover' />
                                <p className='mt-2 text-[13px] font-medium text-gray-900'>{item.discount}</p>
                                <p className='mt-1 text-[12px] text-gray-500'>{item.title}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='mt-6 rounded-2xl bg-white p-4 shadow-sm'>
                    <h3 className='text-[18px] font-semibold text-gray-900'>Delivery details</h3>
                    <div className='mt-3 rounded-2xl bg-[#f6f7fb] p-4'>

                        <div className='flex items-start gap-3 border-t border-gray-200 pt-3'>
                            <FaUser className='mt-1 text-gray-500 text-[18px]' />
                            <div className='min-w-0 flex-1'>
                                <p className='text-[14px] font-semibold text-gray-900'>
                                    {order?.userId?.name || order?.userId?.fullName || order?.userId?.username || 'Customer'}
                                </p>
                            </div>
                        </div>

                        <div className='flex items-start gap-3 pb-3'>
                            <FaMapPin className='mt-1 text-gray-500 text-[18px]' />
                            <div className='min-w-0 flex-1'>
                                <p className='text-[14px] font-semibold text-gray-900'>{order?.delivery_address?.addressType || 'N/A'}</p>
                                <p className='mt-1 text-[13px] leading-5 text-gray-600'>
                                    {formatAddress(order?.delivery_address)}
                                </p>
                                <p className='mt-1 text-[13px] leading-5 text-gray-600'>
                                    Mobile: {order?.delivery_address?.mobile || order?.userId?.mobile || order?.userId?.phone || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='mt-6 rounded-2xl bg-white p-4 shadow-sm'>
                    <h3 className='text-[18px] font-semibold text-gray-900'>Price details</h3>
                    <div className='mt-4 space-y-3 text-[14px] text-gray-700'>
                        <div className='flex items-center justify-between'>
                            <span>Listing price</span>
                            <span className='text-gray-900 line-through'>₹{listingPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <div className='flex items-center justify-between'>
                            <span>Special price</span>
                            <span className='text-gray-900'>₹{salePrice.toLocaleString('en-IN')}</span>
                        </div>
                        {order?.products?.[0]?.quantity > 1 && (
                            <div className='flex items-center justify-between'>
                                <span>Quantity</span>
                                <span className='text-gray-900'>{order?.products?.[0]?.quantity}</span>
                            </div>
                        )}
                        <div className='flex items-center justify-between'>
                            <span>Total fees</span>
                            <span className='text-gray-900'>₹{Math.min(Math.max(Math.round(totalAmount * 0.02), 0), 99).toLocaleString('en-IN')}</span>
                        </div>

                    </div>

                    <div className='mt-4 border-t border-dashed border-gray-200 pt-4'>
                        <div className='flex items-center justify-between text-[16px] font-semibold text-gray-900'>
                            <span>Total amount</span>
                            <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <div className='mt-4 rounded-2xl border border-gray-200 p-4'>
                        <div className='flex items-center justify-between'>
                            <span className='text-[14px] text-gray-700'>Paid By</span>
                            <span className='rounded-md border border-gray-300 px-2 py-1 text-[12px] font-semibold text-gray-700'>
                                {String(order?.paymentMethod || 'COD').toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <button type='button' className='mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] font-medium text-gray-900'>
                        <FaDownload />
                        <span>Download Invoice</span>
                    </button>
                </div>

                {/* <div className='mt-4 rounded-2xl bg-white p-4 shadow-sm'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 text-[16px] font-semibold text-gray-900'>
                            <span>??</span>
                            <span>Offers earned</span>
                        </div>
                        <span className='text-gray-500'>?</span>
                    </div>
                </div> */}

                <div className='mt-6'>
                    <h3 className='text-[18px] font-semibold text-gray-900'>Order ID</h3>
                    <p className='mt-1 text-[13px] text-gray-500'>{order?._id?.toUpperCase()}</p>
                </div>

                <button type='button' className='mt-4 w-full rounded-2xl border border-[#9cc0ff] bg-white px-4 py-3 text-[15px] font-semibold text-blue-700 shadow-sm'>
                    Shop more from this seller
                </button>

                {/* <div className='mt-6 rounded-2xl bg-white p-4 shadow-sm'>
                    <div className='flex items-center gap-3'>
                        <div className='h-10 w-10 rounded-full bg-gray-100' />
                        <div className='min-w-0 flex-1'>
                            <p className='text-[14px] font-semibold text-gray-900'>Track your order faster</p>
                            <p className='text-[12px] text-gray-500'>Open status timeline for live updates</p>
                        </div>
                        <Link to={`/order/${order._id}/status`} className='rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white'>
                            See all updates
                        </Link>
                    </div>
                </div> */}
            </div>
        </div>
    )
}

export default OrderDetails
