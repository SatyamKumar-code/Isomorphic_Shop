import React from 'react';
import ProfileCard from '../components/ProfileCard';
import ChangePasswordCard from '../components/ChangePasswordCard';
import ProfileUpdateCard from '../components/ProfileUpdateCard';


const ProfileSettings = () => {



    return (
        <div className="p-5 w-full max-w-7xl mx-auto">
            <h2 className="text-[22px] text-[#23272E] dark:text-[#c1c6cf] font-bold tracking-[0.005em] mb-5">About section</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className=" flex flex-col gap-5">

                    <ProfileCard />
                    <ChangePasswordCard />
                </div>

                <ProfileUpdateCard />

            </div>
        </div>
    );
};

export default ProfileSettings;
