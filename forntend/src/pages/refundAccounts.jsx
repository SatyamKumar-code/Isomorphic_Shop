import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import BackButton from '../components/backButton';
import { MyContext } from '../App';
import { deleteData, editData, fetchDataFromApi, postData } from '../utils/api';

const emptyForm = {
    accountHolder: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
};

const normalizeDigits = (value) => String(value || '').replace(/\D/g, '');

const RefundAccounts = () => {
    const context = useContext(MyContext);
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingAccountId, setEditingAccountId] = useState('');
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        if (!context?.isLoggedIn) {
            navigate('/login');
        }
    }, [context?.isLoggedIn, navigate]);

    const loadAccounts = async () => {
        setIsLoading(true);
        try {
            const response = await fetchDataFromApi('/api/user/refund-accounts');
            setAccounts(Array.isArray(response?.data) ? response.data : []);
        } catch (error) {
            context.alertBox('error', error.message || 'Failed to load refund accounts');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (context?.isLoggedIn) {
            loadAccounts();
        }
    }, [context?.isLoggedIn]);

    const startAdd = () => {
        setEditingAccountId('');
        setForm(emptyForm);
        setShowForm(true);
    };

    const startEdit = (account) => {
        setEditingAccountId(String(account._id));
        setForm({
            accountHolder: account.accountHolder || '',
            accountNumber: account.accountNumber || '',
            confirmAccountNumber: account.accountNumber || '',
            ifscCode: account.ifscCode || '',
            bankName: account.bankName || '',
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingAccountId('');
        setForm(emptyForm);
    };

    const validate = () => {
        if (!form.accountHolder.trim() || !form.accountNumber.trim() || !form.confirmAccountNumber.trim() || !form.ifscCode.trim()) {
            context.alertBox('error', 'Please fill all required fields');
            return false;
        }

        if (normalizeDigits(form.accountNumber) !== normalizeDigits(form.confirmAccountNumber)) {
            context.alertBox('error', 'Account number and confirm account number must match');
            return false;
        }

        return true;
    };

    const saveAccount = async () => {
        if (!validate()) return;

        setIsSaving(true);
        try {
            const payload = {
                accountId: editingAccountId || undefined,
                accountHolder: form.accountHolder,
                accountNumber: form.accountNumber,
                confirmAccountNumber: form.confirmAccountNumber,
                ifscCode: form.ifscCode,
                bankName: form.bankName,
            };

            const response = editingAccountId
                ? await editData(`/api/user/refund-accounts/${editingAccountId}`, payload)
                : await postData('/api/user/refund-accounts', payload);

            if (response?.error === false) {
                context.alertBox('Success', response?.message || 'Refund account saved successfully');
                setAccounts(Array.isArray(response?.data) ? response.data : []);
                resetForm();
            } else {
                context.alertBox('error', response?.message || 'Failed to save refund account');
            }
        } catch (error) {
            context.alertBox('error', error.message || 'Failed to save refund account');
        } finally {
            setIsSaving(false);
        }
    };

    const removeAccount = async (accountId) => {
        if (!window.confirm('Delete this refund account?')) return;

        setIsSaving(true);
        try {
            const response = await deleteData(`/api/user/refund-accounts/${accountId}`);
            if (response?.error === false) {
                context.alertBox('Success', 'Refund account deleted successfully');
                setAccounts(Array.isArray(response?.data) ? response.data : []);
            } else {
                context.alertBox('error', response?.message || 'Failed to delete refund account');
            }
        } catch (error) {
            context.alertBox('error', error.message || 'Failed to delete refund account');
        } finally {
            setIsSaving(false);
        }
    };

    const subtitle = useMemo(() => {
        return accounts.length
            ? 'Manage the bank accounts used for COD return refunds.'
            : 'Save up to 4 refund accounts for faster COD return refunds.';
    }, [accounts.length]);

    if (!context?.isLoggedIn) {
        return null;
    }

    return (
        <div className='min-h-screen bg-[#f4f5f7] pb-10'>
            <div className='flex items-center gap-4 w-full px-4 py-4 bg-white border-b border-gray-200'>
                <BackButton />
                <div>
                    <h2 className='font-bold text-[22px] text-gray-900'>Refund Accounts</h2>
                    <p className='text-sm text-gray-500'>{subtitle}</p>
                </div>
            </div>

            <div className='mx-auto w-full max-w-3xl px-4 pt-4'>
                <div className='rounded-3xl bg-white p-4 shadow-sm sm:p-6'>
                    <div className='mb-4 flex items-center justify-between gap-3'>
                        <div>
                            <p className='text-sm font-semibold text-gray-900'>Saved accounts</p>
                            <p className='text-xs text-gray-500'>Only four accounts are kept. The oldest one is removed automatically.</p>
                        </div>
                        <button
                            type='button'
                            onClick={startAdd}
                            className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700'
                        >
                            <MdAdd /> Add
                        </button>
                    </div>

                    <div className='space-y-3'>
                        {isLoading ? (
                            <div className='rounded-2xl border border-dashed border-gray-300 p-5 text-sm text-gray-500'>Loading accounts...</div>
                        ) : accounts.length ? (
                            accounts.map((account) => (
                                <div key={account._id} className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
                                    <div className='flex items-start justify-between gap-3'>
                                        <div className='min-w-0 flex-1'>
                                            <p className='truncate text-base font-semibold text-gray-900'>{account.accountHolder || 'Unnamed account'}</p>
                                            <p className='mt-1 text-sm text-gray-700'>{account.accountNumberMasked || 'Account number hidden'}</p>
                                            <p className='mt-1 text-xs text-gray-500'>
                                                {account.bankName ? `${account.bankName} • ` : ''}
                                                {account.ifscCode ? `IFSC ${account.ifscCode}` : 'IFSC not added'}
                                            </p>
                                        </div>

                                        <div className='flex shrink-0 items-center gap-2'>
                                            <button
                                                type='button'
                                                onClick={() => startEdit(account)}
                                                className='inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100'
                                            >
                                                <MdEdit /> Edit
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => removeAccount(account._id)}
                                                disabled={isSaving}
                                                className='inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60'
                                            >
                                                <MdDelete /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className='rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500'>
                                No refund accounts saved yet.
                            </div>
                        )}
                    </div>

                    {showForm && (
                        <div className='mt-5 rounded-3xl border border-yellow-200 bg-yellow-50 p-4 sm:p-5'>
                            <div className='mb-4 flex items-start justify-between gap-3'>
                                <div>
                                    <h3 className='text-lg font-bold text-yellow-900'>{editingAccountId ? 'Edit refund account' : 'Add new refund account'}</h3>
                                    <p className='text-sm text-yellow-800'>Enter the account number twice. Both entries must match before saving.</p>
                                </div>
                                <button
                                    type='button'
                                    onClick={resetForm}
                                    className='rounded-lg border border-yellow-200 bg-white px-3 py-2 text-xs font-semibold text-yellow-900'
                                >
                                    Close
                                </button>
                            </div>

                            <div className='grid gap-3 sm:grid-cols-2'>
                                <input
                                    type='text'
                                    placeholder='Account Holder Name'
                                    value={form.accountHolder}
                                    onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                                    className='w-full rounded-xl border border-gray-300 bg-white p-3 text-sm outline-none focus:border-blue-500'
                                />
                                <input
                                    type='text'
                                    placeholder='Bank Name'
                                    value={form.bankName}
                                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                                    className='w-full rounded-xl border border-gray-300 bg-white p-3 text-sm outline-none focus:border-blue-500'
                                />
                                <input
                                    type='text'
                                    inputMode='numeric'
                                    placeholder='Account Number'
                                    value={form.accountNumber}
                                    onChange={(e) => setForm({ ...form, accountNumber: normalizeDigits(e.target.value) })}
                                    className='w-full rounded-xl border border-gray-300 bg-white p-3 text-sm outline-none focus:border-blue-500'
                                />
                                <input
                                    type='text'
                                    inputMode='numeric'
                                    placeholder='Confirm Account Number'
                                    value={form.confirmAccountNumber}
                                    onChange={(e) => setForm({ ...form, confirmAccountNumber: normalizeDigits(e.target.value) })}
                                    className='w-full rounded-xl border border-gray-300 bg-white p-3 text-sm outline-none focus:border-blue-500'
                                />
                                <input
                                    type='text'
                                    placeholder='IFSC Code'
                                    value={form.ifscCode}
                                    onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                                    className='w-full rounded-xl border border-gray-300 bg-white p-3 text-sm outline-none focus:border-blue-500 sm:col-span-2'
                                />
                            </div>

                            <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end'>
                                <button
                                    type='button'
                                    onClick={resetForm}
                                    className='rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='button'
                                    onClick={saveAccount}
                                    disabled={isSaving}
                                    className='rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60'
                                >
                                    {isSaving ? 'Saving...' : 'Save Account'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className='mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900'>
                    These accounts are reused on COD returns. Editing or adding a new account still requires matching the account number twice.
                </div>
            </div>
        </div>
    );
};

export default RefundAccounts;