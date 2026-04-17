import React, { useState, useRef } from 'react'
import { useAuth } from '../../../Context/auth/useAuth';

const ProfileUpdateCard = () => {

    const { userData } = useAuth();
    const [editMode, setEditMode] = useState(false);
    const fileInputRef = useRef(null);
    const [profile, setProfile] = useState({
        firstName: userData.name.split(" ")[0],
        lastName: userData.name.split(" ")[1],
        password: '********',
        phone: userData.mobile,
        email: userData.email,
        location: '2972 Westheimer Rd. Santa Ana, Illinois 85486',
        bankName: '',
        ifcCode: '',
        accountNumber: userData.accountNumber,
        ReEnterAccountNumber: '',
    });

    // Store the original account number for comparison
    const originalAccountNumber = userData.accountNumber || '';

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleImageClick = () => {
        if (editMode && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        // Handle file change logic here (e.g., upload or preview)
        // Example: const file = e.target.files[0];
    };

    return (
        <div className="p-6 flex flex-col gap-4 col-span-1 lg:col-span-2 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg">
            <div className='flex items-center justify-between'>
                <h3 className="text-[18px] font-bold text-[#23272E] dark:text-[#c1c6cf]">Profile Information</h3>
                <button className='cursor-pointer border-2 border-gray-300 dark:border-gray-700 rounded-lg text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#6B7280] dark:hover:text-[#D1D5DB] transition flex gap-1 items-center px-1.5 py-1' onClick={() => setEditMode(!editMode)}>
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
                    <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>
                <button className={`px-3 py-1 ${editMode ? 'cursor-pointer' : 'cursor-not-allowed'} rounded text-sm font-medium bg-[#4EA674] text-[#FFFFFF] hover:bg-[#489669] transition`}>Upload New</button>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex flex-col gap-1 mb-2 flex-1">
                        <label className="text-sm font-medium text-gray-700">First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={profile.firstName}
                            onChange={handleProfileChange}
                            disabled={!editMode}
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                    <div className="flex flex-col gap-1 mb-2 flex-1">
                        <label className="text-sm font-medium text-gray-700">Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={profile.lastName}
                            onChange={handleProfileChange}
                            disabled={!editMode}
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex flex-col gap-1 mb-2 flex-1">
                        <label className="text-sm font-medium text-gray-700">E-mail</label>
                        <input
                            type="email"
                            name="email"
                            value={profile.email}
                            onChange={handleProfileChange}
                            disabled={!editMode}
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                    <div className="flex flex-col gap-1 mb-2 flex-1">
                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                        <input
                            type="text"
                            max={13}
                            min={10}
                            placeholder="Enter your phone number"
                            name="phone"
                            value={profile.phone}
                            onChange={handleProfileChange}
                            disabled={!editMode}
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-1 mb-2">
                    <label className="text-sm font-medium text-gray-700">Location</label>
                    <input
                        type="text"
                        name="location"
                        value={profile.location}
                        onChange={handleProfileChange}
                        placeholder='Enter your location'
                        disabled={!editMode}
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                </div>
                <div className="flex flex-col gap-1 mb-2">
                    <label className="text-sm font-medium text-gray-700">Account Number</label>
                    <input
                        type="text"
                        name="accountNumber"
                        value={profile.accountNumber}
                        onChange={handleProfileChange}
                        placeholder='Enter your Account Number'
                        disabled={!editMode}
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                </div>

                {editMode === true && profile.accountNumber && profile.accountNumber !== originalAccountNumber && (
                    <div className="flex flex-col gap-1 mb-2">
                        <label className="text-sm font-medium text-gray-700">Re-enter Account Number</label>
                        <input
                            type="text"
                            name="ReEnterAccountNumber"
                            value={profile.ReEnterAccountNumber}
                            onChange={handleProfileChange}
                            placeholder='Enter your Account Number'
                            disabled={!editMode}
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                )}
                <div className="flex flex-col gap-1 mb-2">
                    <label className="text-sm font-medium text-gray-700">IFC CODE</label>
                    <input
                        type="text"
                        name="ifcCode"
                        value={profile.ifcCode}
                        onChange={handleProfileChange}
                        placeholder='eg. SBIN0005943'
                        disabled={!editMode}
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                </div>
                <div className="flex flex-col gap-1 mb-2">
                    <label className="text-sm font-medium text-gray-700">Bank Name</label>
                    <input
                        type="text"
                        name="bankName"
                        value={profile.bankName}
                        onChange={handleProfileChange}
                        placeholder='eg. SBI, HDFC, ICICI etc.'
                        disabled={!editMode}
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                </div>
            </div>
        </div>
    )
}

export default ProfileUpdateCard