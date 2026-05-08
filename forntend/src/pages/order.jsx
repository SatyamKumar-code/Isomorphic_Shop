import React, { useEffect, useMemo, useState } from 'react'
import BackButton from '../components/backButton';
import { fetchDataFromApi } from '../utils/api';
import { Link } from 'react-router-dom';
import { MdOutlineKeyboardArrowRight } from 'react-icons/md';
import { FaSearch } from "react-icons/fa";

const Order = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState({
        delivered: false,
        cancelled: false,
        processing: false
    });

    useEffect(() => {
        const loadOrders = async () => {
            setIsLoading(true);
            const response = await fetchDataFromApi('/api/order/my-orders');
            const orderList = response?.orders || [];
            setOrders(orderList);
            setFilteredOrders(orderList);
            setIsLoading(false);
        };

        loadOrders();
    }, []);

    const getDeliveryText = (order) => {
        const status = String(order?.status || '').toLowerCase();

        if (status === 'delivered') {
            const date = order?.deliveredAt
                ? new Date(order.deliveredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : 'Mar 10';
            return `Delivered on ${date}`;
        }

        if (status === 'cancelled') {
            return 'Order Cancelled';
        }

        if (status === 'shipped') {
            return 'Shipped';
        }

        if (status === 'out_for_delivery') {
            return 'Out for delivery';
        }

        return 'Processing';
    };

    const applyFilters = (term, filters) => {
        const normalizedTerm = term.toLowerCase().trim();
        const hasStatusFilter = filters.delivered || filters.cancelled || filters.processing;

        const nextFilteredOrders = orders.filter((order) => {
            const product = order?.products?.[0]?.productId;
            const productName = String(product?.productName || '').toLowerCase();
            const orderStatus = String(order?.status || '').toLowerCase();

            const matchesSearch = !normalizedTerm || productName.includes(normalizedTerm) || orderStatus.includes(normalizedTerm);

            const matchesStatus = !hasStatusFilter || (
                (filters.delivered && orderStatus === 'delivered') ||
                (filters.cancelled && orderStatus === 'cancelled') ||
                (filters.processing && ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery'].includes(orderStatus))
            );

            return matchesSearch && matchesStatus;
        });

        setFilteredOrders(nextFilteredOrders);
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        applyFilters(term, selectedFilters);
    };

    const handleFilterToggle = (filterKey) => {
        const nextFilters = { ...selectedFilters, [filterKey]: !selectedFilters[filterKey] };
        setSelectedFilters(nextFilters);
        applyFilters(searchTerm, nextFilters);
    };

    const clearFilters = () => {
        const resetFilters = {
            delivered: false,
            cancelled: false,
            processing: false
        };
        setSelectedFilters(resetFilters);
        setSearchTerm('');
        setFilteredOrders(orders);
        setShowFilters(false);
    };

    const visibleFilters = useMemo(() => selectedFilters, [selectedFilters]);

    return (
        <div className='w-full min-h-screen bg-[#f4f5f7]'>
            <div className='flex items-center gap-4 w-full px-4 py-4 bg-white border-b border-gray-200'>
                <BackButton />
                <h2 className='font-bold text-[22px] text-gray-900'>My Orders</h2>
            </div>

            <div className='px-4 pt-4 pb-3'>
                <div className='flex items-center gap-3'>
                    <div className='flex-1 relative'>
                        <input
                            type='text'
                            placeholder='Search your order...'
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className='w-full h-12 rounded-2xl border border-gray-300 bg-white px-4 pl-11 text-[15px] text-gray-900 outline-none placeholder:text-gray-400'
                        />
                        <span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl'><FaSearch /></span>
                    </div>

                    <button
                        type='button'
                        onClick={() => setShowFilters((prev) => !prev)}
                        className='flex h-12 items-center gap-2 rounded-xl bg-white px-4 text-[15px] font-medium text-gray-900 border border-gray-300'
                    >
                        <span className='text-[16px]'>=</span>
                        <span>Filters</span>
                    </button>
                </div>

                {showFilters && (
                    <div className='mt-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
                        <div className='mb-3 flex items-center justify-between'>
                            <h4 className='text-sm font-semibold text-gray-900'>Filter by status</h4>
                            <button type='button' onClick={clearFilters} className='text-sm font-medium text-blue-600'>Clear</button>
                        </div>

                        <div className='space-y-3'>
                            <label className='flex items-center justify-between rounded-xl border border-gray-200 px-3 py-3'>
                                <span className='text-sm text-gray-800'>Processing</span>
                                <input
                                    type='checkbox'
                                    checked={visibleFilters.processing}
                                    onChange={() => handleFilterToggle('processing')}
                                    className='h-4 w-4'
                                />
                            </label>

                            <label className='flex items-center justify-between rounded-xl border border-gray-200 px-3 py-3'>
                                <span className='text-sm text-gray-800'>Delivered</span>
                                <input
                                    type='checkbox'
                                    checked={visibleFilters.delivered}
                                    onChange={() => handleFilterToggle('delivered')}
                                    className='h-4 w-4'
                                />
                            </label>

                            <label className='flex items-center justify-between rounded-xl border border-gray-200 px-3 py-3'>
                                <span className='text-sm text-gray-800'>Cancelled</span>
                                <input
                                    type='checkbox'
                                    checked={visibleFilters.cancelled}
                                    onChange={() => handleFilterToggle('cancelled')}
                                    className='h-4 w-4'
                                />
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className='px-4 py-6 text-center text-gray-500'>Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className='px-4 py-6 text-center text-gray-500'>No orders found.</div>
            ) : (
                <div className='space-y-0 bg-white'>
                    {filteredOrders.map((order) => {
                        const product = order?.products?.[0]?.productId || {};
                        const quantity = order?.products?.[0]?.quantity || 1;
                        const image = product?.images?.[0] || 'https://via.placeholder.com/300x300?text=Product';

                        return (
                            <Link
                                to={`/order/${order._id}`}
                                key={order._id}
                                className='flex items-center gap-4 px-1 py-4 border-b border-gray-100 no-underline text-black'
                            >
                                <div className='relative shrink-0'>
                                    <img
                                        src={image}
                                        alt={product?.productName || 'Product'}
                                        className='h-20 w-20 rounded-xl bg-gray-100 object-cover'
                                    />
                                    {quantity > 1 && (
                                        <span className='absolute left-0 top-0 rounded-br-lg rounded-tl-xl px-2 py-1 text-[12px] font-bold text-black bg-white/40'>
                                            x{quantity}
                                        </span>
                                    )}
                                </div>

                                <div className='min-w-0 flex-1'>
                                    <p className='text-[16px] font-semibold leading-5 text-gray-900'>
                                        {getDeliveryText(order)}
                                    </p>
                                    <p className='mt-1 truncate text-[14px] text-gray-500'>
                                        {product?.productName || 'Product'} 
                                    </p>
                                    <p>
                                        ₹{Number(order.totalAmount || product?.price || 0).toLocaleString('en-IN')}
                                    </p>
                                </div>

                                <div className='shrink-0 text-3xl leading-none text-gray-400'>
                                    <MdOutlineKeyboardArrowRight />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    )
}

export default Order
