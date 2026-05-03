import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../Context/auth/useAuth';
import { alertBox } from '../../../shared/utils/alert';
import { updateProfileAvatar, updateProfileDetails } from '../ProfileAPI';

const ProfileUpdateCard = () => {

    const { userData, refreshUserProfile } = useAuth();
    const defaultAvatar = "https://randomuser.me/api/portraits/men/32.jpg";
    const [editMode, setEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);
    const originalAccountNumberRef = useRef("");

    const parseName = (value) => {
        const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
        return {
            firstName: parts[0] || "",
            lastName: parts.slice(1).join(" ") || "",
        };
    };

    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        location: "",
        bankName: "",
        ifcCode: "",
        accountNumber: "",
        ReEnterAccountNumber: '',
    });

    useEffect(() => {
        if (!userData) {
            return;
        }

        const { firstName, lastName } = parseName(userData.name);

        setProfile({
            firstName,
            lastName,
            phone: userData.mobile ? String(userData.mobile) : "",
            email: userData.email || "",
            location: userData.location || "",
            bankName: userData.bankName || "",
            ifcCode: userData.ifcCode || "",
            accountNumber: userData.accountNumber || "",
            ReEnterAccountNumber: "",
        });
        originalAccountNumberRef.current = userData.accountNumber || "";
    }, [userData]);

    const handleProfileChange = (e) => {
        const nextValue = e.target.value;

        setProfile((current) => {
            const nextProfile = { ...current, [e.target.name]: nextValue };

            if (e.target.name === "accountNumber" && nextValue === originalAccountNumberRef.current) {
                nextProfile.ReEnterAccountNumber = "";
            }

            return nextProfile;
        });
    };

    const handleImageClick = () => {
        if (editMode && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file || !editMode) {
            return;
        }

        const formData = new FormData();
        formData.append("avatar", file);

        updateProfileAvatar(formData)
            .then(async (response) => {
                if (response?.data?.error === false || response?.data?.avatar) {
                    await refreshUserProfile?.();
                    alertBox("Success", response?.data?.message || "Avatar updated successfully");
                    return;
                }

                alertBox("error", response?.data?.message || "Failed to update avatar");
            })
            .catch((error) => {
                alertBox("error", error?.response?.data?.message || "Failed to update avatar");
            })
            .finally(() => {
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            });
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();

        const accountNumberChanged = profile.accountNumber !== originalAccountNumberRef.current;
        if (accountNumberChanged && profile.accountNumber !== profile.ReEnterAccountNumber) {
            alertBox("error", "Account numbers do not match");
            return;
        }

        const payload = {
            name: `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
            email: profile.email,
            mobile: profile.phone,
            location: profile.location,
            bankName: profile.bankName,
            ifcCode: profile.ifcCode,
            accountNumber: profile.accountNumber,
        };

        try {
            setIsSaving(true);
            const response = await updateProfileDetails(payload);

            if (response?.data?.error === false) {
                await refreshUserProfile?.();
                originalAccountNumberRef.current = profile.accountNumber || "";
                setEditMode(false);
                setProfile((current) => ({ ...current, ReEnterAccountNumber: "" }));
                alertBox("Success", response?.data?.message || "Profile updated successfully");
                return;
            }

            alertBox("error", response?.data?.message || "Failed to update profile");
        } catch (error) {
            alertBox("error", error?.response?.data?.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const accountNumberChanged = profile.accountNumber !== originalAccountNumberRef.current;

    return (
        <form onSubmit={handleSaveProfile} className="p-6 flex flex-col gap-4 col-span-1 lg:col-span-2 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg">
            <div className='flex items-center justify-between'>
                <h3 className="text-[18px] font-bold text-[#23272E] dark:text-[#c1c6cf]">Profile Information</h3>
                <button type="button" className='cursor-pointer border-2 border-gray-300 dark:border-gray-700 rounded-lg text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#6B7280] dark:hover:text-[#D1D5DB] transition flex gap-1 items-center px-1.5 py-1' onClick={() => setEditMode(!editMode)}>
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.83337 5.83325H5.00004C4.55801 5.83325 4.13409 6.00885 3.82153 6.32141C3.50897 6.63397 3.33337 7.05789 3.33337 7.49992V14.9999C3.33337 15.4419 3.50897 15.8659 3.82153 16.1784C4.13409 16.491 4.55801 16.6666 5.00004 16.6666H12.5C12.9421 16.6666 13.366 16.491 13.6786 16.1784C13.9911 15.8659 14.1667 15.4419 14.1667 14.9999V14.1666" stroke="#6A717F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M13.3333 4.16663L15.8333 6.66663M16.9875 5.48747C17.3157 5.15926 17.5001 4.71412 17.5001 4.24997C17.5001 3.78581 17.3157 3.34067 16.9875 3.01247C16.6593 2.68426 16.2142 2.49988 15.75 2.49988C15.2858 2.49988 14.8407 2.68426 14.5125 3.01247L7.5 9.99997V12.5H10L16.9875 5.48747Z" stroke="#6A717F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    Edit
                </button>
            </div>
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-full object-cover ${editMode ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    onClick={handleImageClick}>
                    <img src={userData?.avatar || defaultAvatar} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>
                <button type="button" onClick={handleImageClick} className={`px-3 py-1 ${editMode ? 'cursor-pointer' : 'cursor-not-allowed'} rounded text-sm font-medium bg-[#4EA674] text-[#FFFFFF] hover:bg-[#489669] transition`}>Upload New</button>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex flex-col gap-1 mb-2 flex-1">
                        <label className="text-sm font-medium text-[#23272E] dark:text-[#c1c6cf]">First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={profile.firstName}
                            onChange={handleProfileChange}
                            disabled={!editMode || isSaving}
                            className="border border-gray-300 text-[#23272E] dark:text-[#c1c6cf] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                    <div className="flex flex-col gap-1 mb-2 flex-1">
                        <label className="text-sm font-medium text-[#23272E] dark:text-[#c1c6cf]">Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={profile.lastName}
                            onChange={handleProfileChange}
                            disabled={!editMode || isSaving}
                            className="border border-gray-300 text-[#23272E] dark:text-[#c1c6cf] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex flex-col gap-1 mb-2 flex-1">
                        <label className="text-sm font-medium text-[#23272E] dark:text-[#c1c6cf]">E-mail</label>
                        <input
                            type="email"
                            name="email"
                            value={profile.email}
                            onChange={handleProfileChange}
                            disabled={!editMode || isSaving}
                            className="border border-gray-300 text-[#23272E] dark:text-[#c1c6cf] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                    <div className="flex flex-col gap-1 mb-2 flex-1">
                        <label className="text-sm font-medium text-[#23272E] dark:text-[#c1c6cf]">Phone Number</label>
                        <input
                            type="text"
                            max={13}
                            min={10}
                            placeholder="Enter your phone number"
                            name="phone"
                            value={profile.phone}
                            onChange={handleProfileChange}
                            disabled={!editMode || isSaving}
                            className="border border-gray-300 text-[#23272E] dark:text-[#c1c6cf] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-1 mb-2">
                    <label className="text-sm font-medium text-[#23272E] dark:text-[#c1c6cf]">Location</label>
                    <input
                        type="text"
                        name="location"
                        value={profile.location}
                        onChange={handleProfileChange}
                        placeholder='Enter your location'
                        disabled={!editMode || isSaving}
                        className="border border-gray-300 text-[#23272E] dark:text-[#c1c6cf] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                </div>
                <div className="flex flex-col gap-1 mb-2">
                    <label className="text-sm font-medium text-[#23272E] dark:text-[#c1c6cf]">Account Number</label>
                    <input
                        type="text"
                        name="accountNumber"
                        value={profile.accountNumber}
                        onChange={handleProfileChange}
                        placeholder='Enter your Account Number'
                        disabled={!editMode || isSaving}
                        className="border border-gray-300 text-[#23272E] dark:text-[#c1c6cf] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                </div>

                {editMode === true && accountNumberChanged && (
                    <div className="flex flex-col gap-1 mb-2">
                        <label className="text-sm font-medium text-[#23272E] dark:text-[#c1c6cf]">Re-enter Account Number</label>
                        <input
                            type="text"
                            name="ReEnterAccountNumber"
                            value={profile.ReEnterAccountNumber}
                            onChange={handleProfileChange}
                            placeholder='Enter your Account Number'
                            disabled={!editMode || isSaving}
                            className="border border-gray-300 text-[#23272E] dark:text-[#c1c6cf] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                )}
                <div className="flex flex-col gap-1 mb-2">
                    <label className="text-sm font-medium text-[#23272E] dark:text-[#c1c6cf]">IFC CODE</label>
                    <input
                        type="text"
                        name="ifcCode"
                        value={profile.ifcCode}
                        onChange={handleProfileChange}
                        placeholder='eg. SBIN0005943'
                        disabled={!editMode || isSaving}
                        className="border border-gray-300 text-[#23272E] dark:text-[#c1c6cf] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                </div>
                <div className="flex flex-col gap-1 mb-2">
                    <label className="text-sm font-medium text-[#23272E] dark:text-[#c1c6cf]">Bank Name</label>
                    <input
                        type="text"
                        name="bankName"
                        value={profile.bankName}
                        onChange={handleProfileChange}
                        placeholder='eg. SBI, HDFC, ICICI etc.'
                        disabled={!editMode || isSaving}
                        className="border border-gray-300 text-[#23272E] dark:text-[#c1c6cf] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                </div>

                {editMode ? (
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="mt-2 inline-flex items-center justify-center rounded bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                ) : null}
            </div>
        </form>
    )
}

export default ProfileUpdateCard