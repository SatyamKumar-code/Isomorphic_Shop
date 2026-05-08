import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { fetchDataFromApi } from '../utils/api'
import BackButton from '../components/backButton'

const statusTimeline = [
    { key: 'pending', label: 'Order placed', icon: '📦' },
    { key: 'confirmed', label: 'Confirmed', icon: '✓' },
    { key: 'packed', label: 'Packed', icon: '📦' },
    { key: 'shipped', label: 'Shipped', icon: '🚚' },
    { key: 'out_for_delivery', label: 'Out for delivery', icon: '📍' },
    { key: 'delivered', label: 'Delivered', icon: '✓' }
]

const OrderStatus = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const currentStatus = useMemo(() => String(order?.status || 'pending').toLowerCase(), [order?.status]);
    const currentIdx = useMemo(() => {
        if (currentStatus === 'cancelled') return -1;
        return statusTimeline.findIndex((s) => s.key === currentStatus);
    }, [currentStatus]);

    if (loading) {
        return <div className='p-4 text-sm text-gray-500'>Loading...</div>;
    }

    if (!order) {
        return <div className='p-4 text-sm text-gray-500'>Order not found.</div>;
    }

    return (
        <div className='min-h-screen bg-[#f6f7fb]'>
            <div className='sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3'>
                <div className='flex items-center gap-3'>
                    <BackButton />
                    <h1 className='text-[22px] font-semibold text-gray-900'>Order Status</h1>
                </div>
            </div>

            <div className='px-4 py-6'>
                <div className='rounded-2xl bg-white p-6 shadow-sm'>
                    {currentStatus === 'cancelled' ? (
                        <div className='flex flex-col items-center justify-center py-8'>
                            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl'>
                                ✕
                            </div>
                            <h2 className='mt-4 text-xl font-bold text-red-600'>Order Cancelled</h2>
                            <p className='mt-2 text-center text-sm text-gray-600'>
                                This order has been cancelled
                            </p>
                        </div>
                    ) : (
                        <div className='space-y-0'>
                            {statusTimeline.map((step, idx) => {
                                const isCompleted = idx <= currentIdx;
                                const isCurrent = idx === currentIdx;

                                return (
                                    <div key={step.key} className='relative pb-0 last:pb-0'>
                                        <div className='flex gap-2 items-start'>
                                            <div className='flex flex-col items-center'>
                                                <div
                                                    className={`flex h-12 w-12 items-center pb-1 justify-center rounded-full text-3xl font-bold transition-all ${isCompleted
                                                            ? isCurrent
                                                                ? 'bg-blue-600 text-white shadow-lg'
                                                                : 'bg-green-500 text-white'
                                                            : 'bg-gray-200 text-gray-400'
                                                        }`}
                                                >
                                                    {isCompleted ? step.icon : idx + 1}
                                                </div>

                                                {idx < statusTimeline.length - 1 && (
                                                    <div
                                                        className={`mt-0 h-12 w-1 transition-all ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`}
                                                    />
                                                )}
                                            </div>

                                            <div className='flex-1 pt-1'>
                                                <h4
                                                    className={`text-base font-semibold transition-all ${isCurrent
                                                            ? 'text-blue-600'
                                                            : isCompleted
                                                                ? 'text-gray-900'
                                                                : 'text-gray-400'
                                                        }`}
                                                >
                                                    {step.label}
                                                </h4>

                                                {isCurrent && (
                                                    <p className='mt-1 text-sm font-medium text-blue-600'>
                                                        {step.key === 'out_for_delivery' ? 'Out for delivery today' : 'In progress'}
                                                    </p>
                                                )}

                                                {isCompleted && !isCurrent && (
                                                    <p className='mt-1 text-xs text-gray-500'>Completed</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {currentStatus !== 'cancelled' && (
                    <div className='mt-6 rounded-2xl bg-white p-4 shadow-sm'>
                        <div className='text-center'>
                            <p className='text-sm font-medium text-gray-700'>
                                Expected delivery by{' '}
                                <span className='font-bold text-gray-900'>
                                    {new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: '2-digit'
                                    })}
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default OrderStatus
