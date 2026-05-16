import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaRegSave, FaUser } from 'react-icons/fa';
import { MdEmail, MdPhone } from 'react-icons/md';
import BackButton from '../components/backButton';
import { MyContext } from '../App';
import { putData, uploadImage } from '../utils/api';

const emptyPreview = 'profile.png';
const normalizeDigits = (value) => String(value || '').replace(/\D/g, '');

const ProfileManage = () => {
    const context = useContext(MyContext);
    const navigate = useNavigate();
    const isAuthReady = context?.isAuthReady;
    const fileInputRef = useRef(null);
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [initialName, setInitialName] = useState('');
    const [initialMobile, setInitialMobile] = useState('');

    useEffect(() => {
        if (isAuthReady && !context?.isLoggedIn) {
            navigate('/login');
        }
    }, [context?.isLoggedIn, isAuthReady, navigate]);

    useEffect(() => {
        setName(context?.userData?.name || '');
        setInitialName(context?.userData?.name || '');
        setMobile(context?.userData?.mobile ? String(context.userData.mobile) : '');
        setInitialMobile(context?.userData?.mobile ? String(context.userData.mobile) : '');
        setPreviewUrl(context?.userData?.avatar || '');
        setSelectedFile(null);
    }, [context?.userData]);

    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const currentAvatar = useMemo(() => {
        if (previewUrl) {
            return previewUrl;
        }

        return emptyPreview;
    }, [previewUrl]);

    const hasChanges = useMemo(() => {
        const nameChanged = name !== initialName;
        const mobileChanged = mobile !== initialMobile;
        const avatarChanged = selectedFile !== null;

        return nameChanged || mobileChanged || avatarChanged;
    }, [name, initialName, mobile, initialMobile, selectedFile]);

    const triggerFilePicker = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }

        const nextPreviewUrl = URL.createObjectURL(file);
        setSelectedFile(file);
        setPreviewUrl(nextPreviewUrl);
    };

    const applyUserData = (data) => {
        if (!data) {
            return;
        }

        context.setUserData((previous) => ({
            ...(previous || {}),
            ...data,
        }));
    };

    const saveProfile = async () => {
        const trimmedName = name.trim();
        const trimmedMobile = normalizeDigits(mobile);

        if (!trimmedName) {
            context.alertBox('error', 'Name is required');
            return;
        }

        if (trimmedMobile && trimmedMobile.length !== 10) {
            context.alertBox('error', 'Mobile number must be 10 digits');
            return;
        }

        setIsSaving(true);
        try {
            let avatarUpdate = null;

            if (selectedFile) {
                const formData = new FormData();
                formData.append('avatar', selectedFile);
                avatarUpdate = await uploadImage('/api/user/user-avatar', formData);

                if (avatarUpdate?.data?.avatar) {
                    applyUserData({ avatar: avatarUpdate.data.avatar });
                }
            }

            const nameUpdate = await putData('/api/user', {
                name: trimmedName,
                mobile: trimmedMobile ? Number(trimmedMobile) : undefined,
            });
            if (nameUpdate?.error === false) {
                context.alertBox('Success', nameUpdate?.message || 'Profile updated successfully');
                applyUserData(nameUpdate?.data);

                if (selectedFile && avatarUpdate?.data?.avatar) {
                    context.setUserData((previous) => ({
                        ...(previous || {}),
                        name: nameUpdate?.data?.name || trimmedName,
                        avatar: avatarUpdate.data.avatar,
                    }));
                }

                setSelectedFile(null);
            } else {
                context.alertBox('error', nameUpdate?.message || 'Failed to update profile');
            }
        } catch (error) {
            context.alertBox('error', error?.response?.data?.message || error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isAuthReady || !context?.isLoggedIn) {
        return null;
    }

    return (
        <div className='min-h-screen bg-[#f4f5f7] pb-10'>
            <div className='border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur'>
                <div className='mx-auto flex w-full max-w-2xl items-center gap-4'>
                    <BackButton />
                    <div className='min-w-0'>
                        <h2 className='text-[22px] font-bold text-gray-900'>Manage Profile</h2>
                    </div>
                </div>
            </div>

            <div className='mx-auto w-full max-w-2xl px-0! pt-5'>
                <div className='overflow-hidden rounded-[20px] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]'>
                    <div className='bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-6 text-white sm:px-6'>
                        <div className='flex flex-col gap-5 sm:flex-row sm:items-center'>
                            <div className='relative mx-auto sm:mx-0'>
                                <img
                                    src={currentAvatar}
                                    alt='Profile avatar'
                                    className='h-28 w-28 rounded-full border-4 border-white/30 object-cover shadow-2xl ring-4 ring-white/20'
                                />
                                <button
                                    type='button'
                                    onClick={triggerFilePicker}
                                    className='absolute bottom-1 right-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-lg transition hover:scale-105'
                                    aria-label='Change profile photo'
                                >
                                    <FaCamera />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type='file'
                                    accept='image/*'
                                    className='hidden'
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className='flex-1 text-center sm:text-left'>
                                <p className='text-sm/6 text-white/80 hidden sm:block'>Profile details</p>
                                <h3 className='-mt-3 sm:mt-1 text-2xl font-bold'>{name.trim() || 'Your name'}</h3>
                                <p className='mt-2 text-sm text-white/90'>Use a clear photo and keep your profile up to date.</p>
                                <div className='mt-4 flex flex-wrap justify-center gap-2 sm:justify-start'>
                                   
                                    <span className='inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur'>
                                        <MdPhone /> {mobile ? `${mobile}` : 'Mobile read-only'}
                                    </span>
                                    <span className='inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur'>
                                        <MdEmail /> {context?.userData?.email || 'No email available'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='space-y-5 px-0 py-6 sm:px-6'>
                        <div className='grid gap-4 sm:grid-cols-2'>
                            <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
                                <label className='mb-2 block text-sm font-semibold text-gray-700'>Name</label>
                                <input
                                    type='text'
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder='Enter your name'
                                    className='w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500'
                                />
                            </div>

                            <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
                                <label className='mb-2 block text-sm font-semibold text-gray-700'>Mobile</label>
                                <input
                                    type='tel'
                                    inputMode='numeric'
                                    value={mobile}
                                    onChange={(event) => setMobile(normalizeDigits(event.target.value))}
                                    placeholder='Enter mobile number'
                                    maxLength={10}
                                    className='w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500'
                                />
                                <p className='mt-2 text-xs text-gray-500'>Digits only, 10 numbers.</p>
                            </div>
                        </div>

                        <div className='grid gap-4 sm:grid-cols-2'>
                            <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600'>
                                <p className='font-semibold text-gray-900'>Email</p>
                                <p className='mt-1 break-all'>{context?.userData?.email || 'No email available'}</p>
                            </div>
                        </div>
                    </div>

                    <div className='sticky bottom-0 flex flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6'>
                        
                        {hasChanges && (
                            <button
                                type='button'
                                onClick={saveProfile}
                                disabled={isSaving}
                                className='inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'
                            >
                                <FaRegSave />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileManage;