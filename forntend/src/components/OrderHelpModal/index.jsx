import React, { useContext, useState, useEffect } from 'react';
import { fetchDataFromApi, postData } from '../../utils/api';
import { MyContext } from '../../App';
import { MdClose } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const OrderHelpModal = ({ orderId, orderStatus, paymentMethod, isOpen, onClose, onActionComplete }) => {
    const context = useContext(MyContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('help'); // help, cancel, return
    const [isLoading, setIsLoading] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [returnReason, setReturnReason] = useState('defective');
    const [returnComment, setReturnComment] = useState('');
    const [refundAccounts, setRefundAccounts] = useState([]);
    const [selectedRefundAccountId, setSelectedRefundAccountId] = useState('');
    const [refundAccountMode, setRefundAccountMode] = useState('saved');
    const [editingRefundAccountId, setEditingRefundAccountId] = useState('');
    const [refundAccountForm, setRefundAccountForm] = useState({
        accountHolder: '',
        accountNumber: '',
        confirmAccountNumber: '',
        ifscCode: '',
        bankName: ''
    });
    const [returnStatus, setReturnStatus] = useState(null);

    useEffect(() => {
        if (isOpen && orderId) {
            loadReturnStatus();
            if (paymentMethod === 'COD') {
                loadRefundAccounts();
            }
        }
    }, [isOpen, orderId, paymentMethod]);

    const emptyRefundAccountForm = {
        accountHolder: '',
        accountNumber: '',
        confirmAccountNumber: '',
        ifscCode: '',
        bankName: ''
    };

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

    const loadRefundAccounts = async () => {
        try {
            const response = await fetchDataFromApi('/api/user/refund-accounts');
            const accounts = Array.isArray(response?.data) ? response.data : [];
            setRefundAccounts(accounts);
            setSelectedRefundAccountId((currentSelected) => currentSelected || accounts[0]?._id || '');
            if (!accounts.length) {
                setRefundAccountMode('new');
            }
        } catch (error) {
            console.error('Error fetching refund accounts:', error);
        }
    };

    const getSelectedRefundAccount = () => {
        return refundAccounts.find((account) => String(account._id) === String(selectedRefundAccountId)) || null;
    };

    const fillRefundAccountForm = (account) => {
        if (!account) {
            setRefundAccountForm(emptyRefundAccountForm);
            return;
        }

        setRefundAccountForm({
            accountHolder: account.accountHolder || '',
            accountNumber: account.accountNumber || '',
            confirmAccountNumber: '',
            ifscCode: account.ifscCode || '',
            bankName: account.bankName || ''
        });
    };

    const handleSelectRefundAccount = (account) => {
        setSelectedRefundAccountId(String(account._id));
        setRefundAccountMode('saved');
        setEditingRefundAccountId('');
        setRefundAccountForm(emptyRefundAccountForm);
    };

    const handleStartNewRefundAccount = () => {
        setRefundAccountMode('new');
        setEditingRefundAccountId('');
        setSelectedRefundAccountId('');
        setRefundAccountForm(emptyRefundAccountForm);
    };

    const handleEditRefundAccount = (account) => {
        setRefundAccountMode('edit');
        setEditingRefundAccountId(String(account._id));
        setSelectedRefundAccountId(String(account._id));
        setRefundAccountForm({
            accountHolder: account.accountHolder || '',
            accountNumber: account.accountNumber || '',
            confirmAccountNumber: '',
            ifscCode: account.ifscCode || '',
            bankName: account.bankName || ''
        });
    };

    useEffect(() => {
        if (refundAccounts.length && !selectedRefundAccountId && refundAccountMode === 'saved') {
            setSelectedRefundAccountId(String(refundAccounts[0]._id));
        }
    }, [refundAccounts, selectedRefundAccountId, refundAccountMode]);

    useEffect(() => {
        if (refundAccountMode === 'saved') {
            const selectedAccount = getSelectedRefundAccount();
            if (selectedAccount) {
                fillRefundAccountForm(selectedAccount);
            }
        }
    }, [selectedRefundAccountId, refundAccountMode, refundAccounts]);

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
            if (refundAccountMode === 'new' || refundAccountMode === 'edit' || !selectedRefundAccountId) {
                if (!refundAccountForm.accountHolder || !refundAccountForm.accountNumber || !refundAccountForm.confirmAccountNumber || !refundAccountForm.ifscCode) {
                    context.alertBox('error', 'Please fill all bank details for refund');
                    return;
                }

                if (String(refundAccountForm.accountNumber).replace(/\D/g, '') !== String(refundAccountForm.confirmAccountNumber).replace(/\D/g, '')) {
                    context.alertBox('error', 'Account number and confirm account number must match');
                    return;
                }
            } else if (!getSelectedRefundAccount()) {
                context.alertBox('error', 'Please fill all bank details for refund');
                return;
            }
        }

        setIsLoading(true);
        try {
            let bankDetails = null;

            if (paymentMethod === 'COD') {
                const selectedAccount = getSelectedRefundAccount();

                if (refundAccountMode === 'saved' && selectedAccount) {
                    const saveResponse = await postData('/api/user/refund-accounts', {
                        accountId: selectedAccount._id,
                        accountHolder: selectedAccount.accountHolder,
                        accountNumber: selectedAccount.accountNumber,
                        confirmAccountNumber: selectedAccount.accountNumber,
                        ifscCode: selectedAccount.ifscCode,
                        bankName: selectedAccount.bankName || ''
                    });

                    const savedAccounts = Array.isArray(saveResponse?.data) ? saveResponse.data : refundAccounts;
                    setRefundAccounts(savedAccounts);
                    const refreshedSelected = savedAccounts.find((account) =>
                        String(account._id) === String(selectedAccount._id)
                    ) || savedAccounts[0] || selectedAccount;
                    setRefundAccountMode('saved');
                    setEditingRefundAccountId('');
                    setSelectedRefundAccountId(String(refreshedSelected._id));
                    bankDetails = {
                        accountHolder: refreshedSelected.accountHolder || '',
                        accountNumber: refreshedSelected.accountNumber || '',
                        ifscCode: refreshedSelected.ifscCode || '',
                        bankName: refreshedSelected.bankName || ''
                    };
                } else {
                    const saveResponse = await postData('/api/user/refund-accounts', {
                        accountId: editingRefundAccountId || undefined,
                        accountHolder: refundAccountForm.accountHolder,
                        accountNumber: refundAccountForm.accountNumber,
                        confirmAccountNumber: refundAccountForm.confirmAccountNumber,
                        ifscCode: refundAccountForm.ifscCode,
                        bankName: refundAccountForm.bankName
                    });

                    const savedAccounts = Array.isArray(saveResponse?.data) ? saveResponse.data : refundAccounts;
                    setRefundAccounts(savedAccounts);
                    const refreshedSelected = savedAccounts.find((account) =>
                        String(account.accountNumber) === String(refundAccountForm.accountNumber).replace(/\D/g, '')
                    ) || savedAccounts[0];
                    if (refreshedSelected) {
                        setRefundAccountMode('saved');
                        setEditingRefundAccountId('');
                        setSelectedRefundAccountId(String(refreshedSelected._id));
                        bankDetails = {
                            accountHolder: refreshedSelected.accountHolder || '',
                            accountNumber: refreshedSelected.accountNumber || '',
                            ifscCode: refreshedSelected.ifscCode || '',
                            bankName: refreshedSelected.bankName || ''
                        };
                    } else {
                        bankDetails = {
                            accountHolder: refundAccountForm.accountHolder,
                            accountNumber: refundAccountForm.accountNumber,
                            ifscCode: refundAccountForm.ifscCode,
                            bankName: refundAccountForm.bankName
                        };
                    }
                }
            }

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

    // Do not early-return before all hooks are declared — keep hooks order stable

    // Use server-return-status when available to determine eligibility
    const serverStatus = (returnStatus && returnStatus.orderStatus) ? String(returnStatus.orderStatus).toLowerCase() : String(orderStatus).toLowerCase();
    const canCancel = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery'].includes(serverStatus);

    // Compute return eligibility: must be delivered, within 30 days, and no existing return request
    let canReturn = false;
    try {
        if (returnStatus && String(returnStatus.orderStatus).toLowerCase() === 'delivered' && !returnStatus.returnRequest) {
            const deliveredEntry = (returnStatus.statusHistory || []).slice().reverse().find(s => String(s.status).toLowerCase() === 'delivered');
            const deliveredAt = deliveredEntry ? new Date(deliveredEntry.updatedAt) : (returnStatus.deliveredAt ? new Date(returnStatus.deliveredAt) : null);
            if (deliveredAt && !Number.isNaN(deliveredAt.getTime())) {
                const now = new Date();
                const diffDays = (now - deliveredAt) / (1000 * 60 * 60 * 24);
                if (diffDays <= 30) canReturn = true;
            }
        } else if (!returnStatus) {
            // fallback to basic delivered check if server data not yet loaded
            canReturn = String(orderStatus).toLowerCase() === 'delivered';
        }
    } catch (e) {
        canReturn = String(orderStatus).toLowerCase() === 'delivered';
    }

    // Keep active tab valid when eligibility changes
    useEffect(() => {
        if (activeTab === 'cancel' && !canCancel) setActiveTab('help');
        if (activeTab === 'return' && !canReturn) setActiveTab('help');
    }, [canCancel, canReturn]);

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
            {/* Mobile: full-screen sheet. Desktop (sm+): centered modal with rounded corners */}
            <div className='bg-white w-full h-full p-4 overflow-y-auto max-h-screen sm:rounded-lg sm:p-6 sm:h-auto sm:max-h-[90vh] sm:max-w-md'>
                <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-lg font-bold'>Order Help</h3>
                    <button onClick={onClose} className='text-gray-500 hover:text-gray-700 p-2 rounded-md'>
                        <MdClose className='text-2xl' />
                    </button>
                </div>

                {/* Tabs */}
                <div className='flex gap-2 mb-4 border-b overflow-x-auto -mx-1'>
                    <button
                        onClick={() => setActiveTab('help')}
                        className={`px-3 py-3 sm:px-4 sm:py-2 font-semibold whitespace-nowrap ${activeTab === 'help' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
                    >
                        Help
                    </button>
                    {canCancel && (
                        <button
                            onClick={() => setActiveTab('cancel')}
                            className={`px-3 py-3 sm:px-4 sm:py-2 font-semibold whitespace-nowrap ${activeTab === 'cancel' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
                        >
                            Cancel
                        </button>
                    )}
                    {canReturn && (
                        <button
                            onClick={() => setActiveTab('return')}
                            className={`px-3 py-3 sm:px-4 sm:py-2 font-semibold whitespace-nowrap ${activeTab === 'return' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
                        >
                            Return
                        </button>
                    )}
                </div>

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
                            <div className='space-y-4'>
                                <div className='rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4'>
                                    <div className='flex items-center justify-between gap-3'>
                                        <p className='text-sm font-semibold text-gray-900'>Saved refund accounts</p>
                                        <div className='flex items-center gap-3'>
                                            <button
                                                type='button'
                                                onClick={() => navigate('/refund-accounts')}
                                                className='text-xs font-semibold text-gray-600 hover:text-gray-800'
                                            >
                                                Manage accounts
                                            </button>
                                            <button
                                                type='button'
                                                onClick={handleStartNewRefundAccount}
                                                className='text-xs font-semibold text-blue-600 hover:text-blue-700'
                                            >
                                                Add new
                                            </button>
                                        </div>
                                    </div>

                                    <div className='mt-3 space-y-2'>
                                        {refundAccounts.length > 0 ? refundAccounts.map((account) => {
                                            const isSelected = String(selectedRefundAccountId) === String(account._id) && refundAccountMode === 'saved';
                                            return (
                                                <div
                                                    key={account._id}
                                                    className={`rounded-lg border p-3 transition ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                                                >
                                                    <button
                                                        type='button'
                                                        onClick={() => handleSelectRefundAccount(account)}
                                                        className='w-full text-left'
                                                    >
                                                        <div className='flex items-start justify-between gap-3'>
                                                            <div>
                                                                <p className='text-sm font-semibold text-gray-900'>{account.accountHolder || 'Unnamed account'}</p>
                                                                <p className='text-xs text-gray-600'>
                                                                    {account.accountNumberMasked || 'Account number hidden'}{account.bankName ? ` • ${account.bankName}` : ''}{account.ifscCode ? ` • IFSC ${account.ifscCode}` : ''}
                                                                </p>
                                                            </div>
                                                            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                                {isSelected ? 'Selected' : 'Use'}
                                                            </span>
                                                        </div>
                                                    </button>

                                                    <div className='mt-3 flex flex-wrap gap-2'>
                                                        <button
                                                            type='button'
                                                            onClick={() => handleSelectRefundAccount(account)}
                                                            className='rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50'
                                                        >
                                                            Use this
                                                        </button>
                                                        <button
                                                            type='button'
                                                            onClick={() => handleEditRefundAccount(account)}
                                                            className='rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50'
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <p className='rounded-lg border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-500'>
                                                No saved refund accounts yet. Add a new one below.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {(refundAccountMode === 'new' || refundAccountMode === 'edit' || !selectedRefundAccountId) && (
                                    <div className='rounded-xl border border-yellow-200 bg-yellow-50 p-3 sm:p-4'>
                                        <div className='mb-3 flex items-center justify-between gap-3'>
                                            <p className='text-sm font-semibold text-yellow-900'>
                                                {refundAccountMode === 'edit' ? 'Edit refund account' : 'Add new refund account'}
                                            </p>
                                            {refundAccountMode === 'edit' && (
                                                <button
                                                    type='button'
                                                    onClick={() => {
                                                        const account = getSelectedRefundAccount() || refundAccounts.find((item) => String(item._id) === String(editingRefundAccountId));
                                                        if (account) {
                                                            handleSelectRefundAccount(account);
                                                        } else {
                                                            setRefundAccountMode('saved');
                                                            setEditingRefundAccountId('');
                                                            setRefundAccountForm(emptyRefundAccountForm);
                                                        }
                                                    }}
                                                    className='text-xs font-semibold text-yellow-800 hover:text-yellow-900'
                                                >
                                                    Cancel edit
                                                </button>
                                            )}
                                        </div>

                                        <div className='space-y-2'>
                                            <input
                                                type='text'
                                                placeholder='Account Holder Name'
                                                value={refundAccountForm.accountHolder}
                                                onChange={(e) => setRefundAccountForm({ ...refundAccountForm, accountHolder: e.target.value })}
                                                className='w-full rounded border border-gray-300 p-2 text-sm'
                                            />
                                            <input
                                                type='text'
                                                inputMode='numeric'
                                                placeholder='Account Number'
                                                value={refundAccountForm.accountNumber}
                                                onChange={(e) => setRefundAccountForm({ ...refundAccountForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                                                className='w-full rounded border border-gray-300 p-2 text-sm'
                                            />
                                            <input
                                                type='text'
                                                inputMode='numeric'
                                                placeholder='Confirm Account Number'
                                                value={refundAccountForm.confirmAccountNumber}
                                                onChange={(e) => setRefundAccountForm({ ...refundAccountForm, confirmAccountNumber: e.target.value.replace(/\D/g, '') })}
                                                className='w-full rounded border border-gray-300 p-2 text-sm'
                                            />
                                            <input
                                                type='text'
                                                placeholder='IFSC Code'
                                                value={refundAccountForm.ifscCode}
                                                onChange={(e) => setRefundAccountForm({ ...refundAccountForm, ifscCode: e.target.value.toUpperCase() })}
                                                className='w-full rounded border border-gray-300 p-2 text-sm'
                                            />
                                            <input
                                                type='text'
                                                placeholder='Bank Name'
                                                value={refundAccountForm.bankName}
                                                onChange={(e) => setRefundAccountForm({ ...refundAccountForm, bankName: e.target.value })}
                                                className='w-full rounded border border-gray-300 p-2 text-sm'
                                            />
                                        </div>

                                        <p className='mt-2 text-xs text-yellow-800'>
                                            Enter the account number twice. The saved list keeps only 4 accounts and removes the oldest automatically.
                                        </p>
                                    </div>
                                )}

                                {refundAccountMode === 'saved' && selectedRefundAccountId && getSelectedRefundAccount() && (
                                    <div className='rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900'>
                                        Refund will use {getSelectedRefundAccount().accountHolder || 'this account'} ending in {getSelectedRefundAccount().accountNumberMasked || '----'}.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className='bg-blue-50 p-3 rounded-lg text-sm text-blue-800'>
                            {paymentMethod === 'Razorpay'
                                ? '✓ Refund will be processed after product pickup'
                                : '✓ Refund will be credited to the selected bank account after pickup'}
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
