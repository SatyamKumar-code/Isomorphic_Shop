import React, { useContext, useState, useEffect } from 'react';
import { fetchDataFromApi, postData } from '../../utils/api';
import { MyContext } from '../../App';
import { MdClose } from 'react-icons/md';

const OrderHelpModal = ({ orderId, orderStatus, paymentMethod, isOpen, onClose, onActionComplete }) => {
    const context = useContext(MyContext);
    const [activeTab, setActiveTab] = useState('help'); // help, cancel, return
    const [isLoading, setIsLoading] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [returnReason, setReturnReason] = useState('defective');
    const [returnComment, setReturnComment] = useState('');
    const [bankDetails, setBankDetails] = useState({
        accountHolder: '',
        accountNumber: '',
        ifscCode: '',
        bankName: ''
    });
    const [returnStatus, setReturnStatus] = useState(null);

    useEffect(() => {
        if (isOpen && orderId) {
            loadReturnStatus();
        }
    }, [isOpen, orderId]);

    const loadReturnStatus = async () => {
        try {
            const response = await fetchDataFromApi(`/api/order/${orderId}/return-status`);
            if (response?.data) {
                setReturnStatus(response.data);
            }
        } catch (error) {
            console.error('Error fetching return status:', error);
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            context.alertBox('error', 'Please provide a reason for cancellation');
            return;
        }

        setIsLoading(true);
        try {
            const response = await postData(`/api/order/${orderId}/cancel`, {
                reason: cancelReason
            });

            if (response?.error === false) {
                context.alertBox('Success', 'Order cancelled successfully');
                onActionComplete?.();
                onClose?.();
            } else {
                context.alertBox('error', response?.message || 'Failed to cancel order');
            }
        } catch (error) {
            context.alertBox('error', 'Error cancelling order: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitiateReturn = async () => {
        if (!returnReason) {
            context.alertBox('error', 'Please select a return reason');
            return;
        }

        if (paymentMethod === 'COD') {
            if (!bankDetails.accountHolder || !bankDetails.accountNumber || !bankDetails.ifscCode) {
                context.alertBox('error', 'Please fill all bank details for refund');
                return;
            }
        }

        setIsLoading(true);
        try {
            const response = await postData(`/api/order/${orderId}/return`, {
                reason: returnReason,
                comment: returnComment,
                bankDetails: paymentMethod === 'COD' ? bankDetails : null
            });

            if (response?.error === false) {
                context.alertBox('Success', 'Return initiated successfully');
                onActionComplete?.();
                onClose?.();
            } else {
                context.alertBox('error', response?.message || 'Failed to initiate return');
            }
        } catch (error) {
            context.alertBox('error', 'Error initiating return: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const canCancel = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery'].includes(orderStatus);
    const canReturn = orderStatus === 'delivered';

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
            <div className='bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto'>
                <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-lg font-bold'>Order Help</h3>
                    <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
                        <MdClose className='text-2xl' />
                    </button>
                </div>

                {/* Tabs */}
                <div className='flex gap-2 mb-4 border-b overflow-x-auto'>
                    <button
                        onClick={() => setActiveTab('help')}
                        className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'help' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
                    >
                        Help
                    </button>
                    {(returnStatus?.refundStatus && returnStatus.refundStatus !== 'none') && (
                        <button
                            onClick={() => setActiveTab('status')}
                            className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'status' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
                        >
                            Status
                        </button>
                    )}
                    {canCancel && (
                        <button
                            onClick={() => setActiveTab('cancel')}
                            className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'cancel' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
                        >
                            Cancel
                        </button>
                    )}
                    {canReturn && (
                        <button
                            onClick={() => setActiveTab('return')}
                            className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'return' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
                        >
                            Return
                        </button>
                    )}
                </div>

                {/* Status Tab */}
                {activeTab === 'status' && returnStatus && (
                    <div className='space-y-4'>
                        <div className='bg-blue-50 p-4 rounded-lg'>
                            <h4 className='font-bold text-blue-900 mb-4'>Refund/Return Status</h4>

                            {/* Refund Status */}
                            {(returnStatus?.refundStatus && returnStatus.refundStatus !== 'none') && (
                                <div className='space-y-3'>
                                    <div>
                                        <p className='text-sm font-semibold text-blue-900 mb-2'>📋 Refund Status: <span className='text-blue-600 capitalize'>{returnStatus.refundStatus}</span></p>
                                    </div>

                                    {/* Timeline for Razorpay Refund */}
                                    {paymentMethod === 'Razorpay' && (
                                        <div className='space-y-2 text-sm text-blue-800'>
                                            <div className='flex items-center gap-2'>
                                                <span className={`h-3 w-3 rounded-full ${returnStatus.refundStatus !== 'none' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                <span>Refund Requested</span>
                                                {returnStatus?.refundRequestedAt && <span className='text-xs text-gray-600 ml-auto'>{new Date(returnStatus.refundRequestedAt).toLocaleDateString()}</span>}
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <span className={`h-3 w-3 rounded-full ${['approved', 'pickup_completed', 'initiated', 'processed'].includes(returnStatus.refundStatus) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                <span>Pickup Scheduled</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <span className={`h-3 w-3 rounded-full ${['initiated', 'processed'].includes(returnStatus.refundStatus) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                <span>Refund Initiated</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <span className={`h-3 w-3 rounded-full ${returnStatus.refundStatus === 'processed' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                <span>Refund Completed</span>
                                                {returnStatus?.refundProcessedAt && <span className='text-xs text-gray-600 ml-auto'>{new Date(returnStatus.refundProcessedAt).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Timeline for COD Refund */}
                                    {paymentMethod === 'COD' && returnStatus?.returnId && (
                                        <div className='space-y-2 text-sm text-blue-800'>
                                            <div className='flex items-center gap-2'>
                                                <span className={`h-3 w-3 rounded-full ${returnStatus.refundStatus !== 'none' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                <span>Return Requested</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <span className={`h-3 w-3 rounded-full ${['approved', 'pickup_completed', 'initiated', 'processed'].includes(returnStatus.refundStatus) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                <span>Pickup Scheduled</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <span className={`h-3 w-3 rounded-full ${['initiated', 'processed'].includes(returnStatus.refundStatus) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                <span>Pickup Completed</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <span className={`h-3 w-3 rounded-full ${returnStatus.refundStatus === 'processed' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                <span>Refund to Bank Account</span>
                                                {returnStatus?.refundProcessedAt && <span className='text-xs text-gray-600 ml-auto'>{new Date(returnStatus.refundProcessedAt).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Refund Amount */}
                                    {returnStatus?.refundAmount && (
                                        <div className='mt-3 pt-3 border-t border-blue-200'>
                                            <p className='text-sm font-semibold text-blue-900'>Refund Amount: <span className='text-blue-600'>₹{Number(returnStatus.refundAmount).toLocaleString('en-IN')}</span></p>
                                        </div>
                                    )}

                                    {/* Rejection Reason */}
                                    {returnStatus?.refundStatus === 'rejected' && returnStatus?.refundReason && (
                                        <div className='mt-3 pt-3 border-t border-red-200 bg-red-50 p-3 rounded'>
                                            <p className='text-sm font-semibold text-red-900 mb-1'>Rejection Reason:</p>
                                            <p className='text-sm text-red-800'>{returnStatus.refundReason}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(!returnStatus?.refundStatus || returnStatus.refundStatus === 'none') && (
                                <p className='text-sm text-blue-800'>No active refund or return request.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Help Tab */}
                {activeTab === 'help' && (
                    <div className='space-y-4'>
                        <div className='bg-blue-50 p-4 rounded-lg'>
                            <h4 className='font-bold text-blue-900 mb-2'>Need Help?</h4>
                            <p className='text-sm text-blue-800 mb-3'>Choose an option below:</p>
                            {canCancel && (
                                <div className='mb-3 pb-3 border-b'>
                                    <p className='text-sm font-semibold text-blue-900'>📦 Cancel Order</p>
                                    <p className='text-xs text-blue-800'>Cancel before delivery. {paymentMethod === 'Razorpay' ? 'Automatic refund will be processed.' : 'No refund needed for COD.'}</p>
                                </div>
                            )}
                            {canReturn && (
                                <div>
                                    <p className='text-sm font-semibold text-blue-900'>↩️ Return Product</p>
                                    <p className='text-xs text-blue-800'>Return within 30 days. {paymentMethod === 'COD' ? 'Provide bank details for refund.' : 'Refund after pickup.'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Cancel Tab */}
                {activeTab === 'cancel' && canCancel && (
                    <div className='space-y-4'>
                        <div>
                            <label className='block text-sm font-semibold mb-2'>Reason for Cancellation</label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder='Please tell us why you want to cancel this order'
                                className='w-full border border-gray-300 rounded-lg p-2 text-sm'
                                rows='4'
                            />
                        </div>
                        {paymentMethod === 'Razorpay' && (
                            <div className='bg-green-50 p-3 rounded-lg text-sm text-green-800'>
                                ✓ Refund will be processed automatically to your payment method
                            </div>
                        )}
                        <button
                            onClick={handleCancelOrder}
                            disabled={isLoading}
                            className='w-full bg-red-500 text-white py-2 rounded-lg font-semibold disabled:opacity-60'
                        >
                            {isLoading ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                    </div>
                )}

                {/* Return Tab */}
                {activeTab === 'return' && canReturn && (
                    <div className='space-y-4'>
                        <div>
                            <label className='block text-sm font-semibold mb-2'>Return Reason</label>
                            <select
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                className='w-full border border-gray-300 rounded-lg p-2 text-sm'
                            >
                                <option value='defective'>Product is Defective</option>
                                <option value='not_as_described'>Not as Described</option>
                                <option value='changed_mind'>Changed Mind</option>
                                <option value='better_price'>Better Price Found</option>
                                <option value='other'>Other</option>
                            </select>
                        </div>

                        <div>
                            <label className='block text-sm font-semibold mb-2'>Additional Comments (Optional)</label>
                            <textarea
                                value={returnComment}
                                onChange={(e) => setReturnComment(e.target.value)}
                                placeholder='Any additional details...'
                                className='w-full border border-gray-300 rounded-lg p-2 text-sm'
                                rows='3'
                            />
                        </div>

                        {paymentMethod === 'COD' && (
                            <div className='bg-yellow-50 border border-yellow-200 p-3 rounded-lg'>
                                <p className='text-sm font-semibold text-yellow-900 mb-3'>Bank Details for Refund</p>
                                <input
                                    type='text'
                                    placeholder='Account Holder Name'
                                    value={bankDetails.accountHolder}
                                    onChange={(e) => setBankDetails({ ...bankDetails, accountHolder: e.target.value })}
                                    className='w-full border border-gray-300 rounded p-2 text-sm mb-2'
                                />
                                <input
                                    type='text'
                                    placeholder='Account Number'
                                    value={bankDetails.accountNumber}
                                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                    className='w-full border border-gray-300 rounded p-2 text-sm mb-2'
                                />
                                <input
                                    type='text'
                                    placeholder='IFSC Code'
                                    value={bankDetails.ifscCode}
                                    onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                                    className='w-full border border-gray-300 rounded p-2 text-sm mb-2'
                                />
                                <input
                                    type='text'
                                    placeholder='Bank Name'
                                    value={bankDetails.bankName}
                                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                    className='w-full border border-gray-300 rounded p-2 text-sm'
                                />
                            </div>
                        )}

                        <div className='bg-blue-50 p-3 rounded-lg text-sm text-blue-800'>
                            {paymentMethod === 'Razorpay'
                                ? '✓ Refund will be processed after product pickup'
                                : '✓ Refund will be credited to your bank account after pickup'}
                        </div>

                        <button
                            onClick={handleInitiateReturn}
                            disabled={isLoading}
                            className='w-full bg-blue-500 text-white py-2 rounded-lg font-semibold disabled:opacity-60'
                        >
                            {isLoading ? 'Processing...' : 'Initiate Return'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHelpModal;
