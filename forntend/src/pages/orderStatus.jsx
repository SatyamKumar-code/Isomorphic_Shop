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

const formatStatusDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const OrderStatus = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [returnStatus, setReturnStatus] = useState(null);
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

    // Load return status when order changes
    useEffect(() => {
        if (order?._id) {
            const loadReturnStatus = async () => {
                try {
                    const res = await fetchDataFromApi(`/api/order/${order._id}/return-status`);
                    if (res?.data) {
                        setReturnStatus(res.data);
                    }
                } catch (error) {
                    console.error('Error loading return status:', error);
                }
            };
            loadReturnStatus();
        }
    }, [order?._id]);

    const currentStatus = useMemo(() => String(order?.status || 'pending').toLowerCase(), [order?.status]);
    const isCancelled = currentStatus === 'cancelled';
    const cancelledFromStatus = useMemo(() => {
        const raw = String(order?.cancelledFromStatus || '').toLowerCase();
        return statusTimeline.some((s) => s.key === raw) ? raw : 'pending';
    }, [order?.cancelledFromStatus]);
    const cancelledFromIdx = useMemo(
        () => statusTimeline.findIndex((s) => s.key === cancelledFromStatus),
        [cancelledFromStatus]
    );
    const currentIdx = useMemo(() => {
        if (isCancelled) return -1;
        return statusTimeline.findIndex((s) => s.key === currentStatus);
    }, [currentStatus, isCancelled]);

    const orderStatusTimeMap = useMemo(() => {
        const map = {};
        const history = Array.isArray(order?.statusHistory) ? order.statusHistory : [];
        history.forEach((entry) => {
            const key = String(entry?.status || '').toLowerCase();
            if (key) map[key] = entry?.updatedAt || null;
        });
        if (!map.pending && order?.createdAt) {
            map.pending = order.createdAt;
        }
        return map;
    }, [order?.statusHistory, order?.createdAt]);

    const refundStatusTimeMap = useMemo(() => {
        const map = {};
        const fromOrder = Array.isArray(order?.refundStatusHistory) ? order.refundStatusHistory : [];
        const fromReturnStatus = Array.isArray(returnStatus?.refundStatusHistory) ? returnStatus.refundStatusHistory : [];
        [...fromOrder, ...fromReturnStatus].forEach((entry) => {
            const key = String(entry?.status || '').toLowerCase();
            if (key) map[key] = entry?.updatedAt || null;
        });
        return map;
    }, [order?.refundStatusHistory, returnStatus?.refundStatusHistory]);

    const refundDestinationText = useMemo(() => {
        if (!returnStatus?.refundDestination) return '';

        const destination = returnStatus.refundDestination;
        if (destination.mode === 'razorpay') {
            return destination.label || 'Original payment account (Razorpay)';
        }

        const parts = [];
        if (destination.accountHolder) {
            parts.push(destination.accountHolder);
        }
        if (destination.accountNumberMasked) {
            parts.push(destination.accountNumberMasked);
        }
        if (destination.bankName) {
            parts.push(destination.bankName);
        }
        if (destination.ifscCode) {
            parts.push(`IFSC: ${destination.ifscCode}`);
        }

        if (parts.length) {
            return parts.join(' | ');
        }

        return destination.label || 'Bank account not available';
    }, [returnStatus?.refundDestination]);

    // Build combined timeline including refund/return steps
    const combinedTimeline = useMemo(() => {
        let baseTimeline = [...statusTimeline];

        if (isCancelled) {
            const safeCancelledIdx = cancelledFromIdx >= 0 ? cancelledFromIdx : 0;
            baseTimeline = [
                ...statusTimeline.slice(0, safeCancelledIdx + 1),
                { key: 'cancelled', label: 'Cancelled', icon: '✕', type: 'cancel' }
            ];
        }

        let timeline = [...baseTimeline];

        // If there's a refund/return, we need to insert those steps after the current status
        if (returnStatus && returnStatus?.refundStatus && returnStatus.refundStatus !== 'none') {
            // For cancelled orders (before delivery), skip pickup steps
            if (isCancelled) {
                if (order?.paymentMethod === 'Razorpay') {
                    timeline = [
                        ...timeline,
                        // Direct to refund - no "Refund Requested" for cancellations
                        { key: 'refund_initiated', label: 'Refund Initiated', icon: '✓', type: 'refund' },
                        { key: 'refund_completed', label: 'Refund Completed', icon: '✓', type: 'refund' }
                    ];
                } else {
                    // COD cancellation - direct refund
                    timeline = [
                        ...timeline,
                        { key: 'refund_to_bank', label: 'Refund to Bank Account', icon: '💳', type: 'refund' }
                    ];
                }
            } else if (currentStatus === 'delivered') {
                // For delivered orders with return, include return request and pickup steps
                if (order?.paymentMethod === 'Razorpay') {
                    timeline = [
                        ...timeline,
                        { key: 'return_requested', label: 'Return Requested', icon: '📦', type: 'refund' },
                        { key: 'pickup_scheduled', label: 'Pickup Scheduled', icon: '📦', type: 'refund' },
                        { key: 'refund_initiated', label: 'Refund Initiated', icon: '✓', type: 'refund' },
                        { key: 'refund_completed', label: 'Refund Completed', icon: '✓', type: 'refund' }
                    ];
                } else {
                    timeline = [
                        ...timeline,
                        { key: 'return_requested', label: 'Return Requested', icon: '📦', type: 'refund' },
                        { key: 'pickup_scheduled', label: 'Pickup Scheduled', icon: '📦', type: 'refund' },
                        { key: 'pickup_completed', label: 'Pickup Completed', icon: '✓', type: 'refund' },
                        { key: 'refund_to_bank', label: 'Refund to Bank Account', icon: '💳', type: 'refund' }
                    ];
                }
            }
        }

        return timeline;
    }, [isCancelled, cancelledFromIdx, returnStatus, currentStatus, order?.paymentMethod]);

    // Get the current index in combined timeline considering refund status
    const getCurrentRefundIdx = (status) => {
        const isCancel = isCancelled;

        let refundStatusMap = {};

        if (isCancel) {
            // For cancelled orders (no "Refund Requested", goes directly to "Refund Initiated")
            refundStatusMap = {
                'requested': ['refund_initiated', 'refund_to_bank'],
                'approved': ['refund_initiated', 'refund_to_bank'],
                'pickup_completed': ['refund_initiated', 'refund_to_bank'],
                'initiated': ['refund_initiated'],
                'processed': [order?.paymentMethod === 'Razorpay' ? 'refund_completed' : 'refund_to_bank']
            };
        } else {
            // For returns after delivery (with return request and pickup)
            refundStatusMap = {
                'requested': ['return_requested'],
                'approved': ['pickup_scheduled'],
                'pickup_completed': ['pickup_completed'],
                'initiated': ['refund_initiated'],
                'processed': [order?.paymentMethod === 'Razorpay' ? 'refund_completed' : 'refund_to_bank']
            };
        }

        const targetKeys = refundStatusMap[status] || [];
        const foundIdx = combinedTimeline.findIndex(step => targetKeys.includes(step.key));
        return foundIdx >= 0 ? foundIdx : -1;
    };

    const refundIdx = returnStatus && returnStatus?.refundStatus && returnStatus.refundStatus !== 'none'
        ? getCurrentRefundIdx(returnStatus.refundStatus)
        : -1;

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
                    <div className='space-y-0'>
                        {combinedTimeline.map((step, idx) => {
                            let isCompleted = false;
                            let isCurrent = false;

                            if (step.type === 'refund') {
                                isCompleted = refundIdx >= idx;
                                isCurrent = refundIdx === idx;
                            } else if (step.type === 'cancel') {
                                isCompleted = isCancelled;
                                isCurrent = isCancelled && refundIdx === -1;
                            } else if (isCancelled) {
                                isCompleted = idx <= cancelledFromIdx;
                            } else {
                                isCompleted = idx <= currentIdx;
                                isCurrent = idx === currentIdx;
                            }

                            const refundStepToStatusKey = {
                                return_requested: 'requested',
                                pickup_scheduled: 'approved',
                                pickup_completed: 'pickup_completed',
                                refund_initiated: 'initiated',
                                refund_completed: 'processed',
                                refund_to_bank: 'processed',
                            };

                            const stepTime = step.type === 'refund'
                                ? refundStatusTimeMap[refundStepToStatusKey[step.key] || '']
                                : step.type === 'cancel'
                                    ? orderStatusTimeMap.cancelled
                                    : orderStatusTimeMap[step.key];
                            const formattedStepTime = formatStatusDateTime(stepTime);

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

                                            {idx < combinedTimeline.length - 1 && (
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
                                                <p className='mt-1 text-xs text-gray-500'>
                                                    {formattedStepTime || 'Completed'}
                                                </p>
                                            )}

                                            {isCurrent && formattedStepTime && (
                                                <p className='mt-1 text-xs text-blue-600'>
                                                    {formattedStepTime}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Refund Amount and Details */}
                    {returnStatus && returnStatus?.refundStatus && returnStatus.refundStatus !== 'none' && (
                        <div className='mt-6 pt-6 border-t border-gray-200 space-y-3'>
                            {returnStatus?.refundAmount && (
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm font-medium text-gray-700'>Refund Amount:</span>
                                    <span className='text-lg font-bold text-blue-600'>₹{Number(returnStatus.refundAmount).toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium text-gray-700'>Current Status:</span>
                                <span className='font-semibold capitalize px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm'>{returnStatus.refundStatus}</span>
                            </div>
                            <div className='flex items-start justify-between gap-3'>
                                <span className='text-sm font-medium text-gray-700'>Refund To:</span>
                                <span className='text-sm text-right font-medium text-gray-900'>
                                    {refundDestinationText || (order?.paymentMethod === 'Razorpay'
                                        ? 'Original payment account (Razorpay)'
                                        : 'Bank account not available')}
                                </span>
                            </div>
                            {returnStatus?.refundStatus === 'rejected' && returnStatus?.refundReason && (
                                <div className='mt-4 p-3 bg-red-50 rounded-lg border border-red-200'>
                                    <p className='text-sm font-semibold text-red-900 mb-1'>Rejection Reason:</p>
                                    <p className='text-sm text-red-800'>{returnStatus.refundReason}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {currentStatus !== 'cancelled' && (!returnStatus || !returnStatus?.refundStatus || returnStatus.refundStatus === 'none') && (
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
