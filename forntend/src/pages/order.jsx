import React, { useState } from 'react'
import BackButton from '../components/backButton';
import ActiveOrder from '../components/Order/activeOrder';
import CancelledOrder from '../components/Order/CancleOrder';
import CompletedOrder from '../components/Order/CompletedOrder';

const Order = () => {
    const [activeTab, setActiveTab] = useState('active');
    return (
        <div className='w-full h-screen'>
            <div className='flex items-center justify-between w-full'>
                <BackButton />
                <h2 className='font-bold'>Orders</h2>
                <div >
                    {/* <BiDotsVerticalRounded className='text-2xl' /> */}
                </div>
            </div>
            <div className='flex items-center justify-between w-full mt-4 px-4'>
                <h4 className={`font-bold text-md ${activeTab === 'active' ? 'underline underline-offset-4 text-blue-500' : 'text-gray-500'}`} onClick={() => setActiveTab('active')}>
                    Active
                </h4>
                <h4 className={`font-bold text-md ${activeTab === 'completed' ? 'underline underline-offset-4 text-blue-500' : 'text-gray-500'}`} onClick={() => setActiveTab('completed')}>
                    Completed
                </h4>
                <h4 className={`font-bold text-md ${activeTab === 'cancelled' ? 'underline underline-offset-4 text-blue-500' : 'text-gray-500'}`} onClick={() => setActiveTab('cancelled')}>
                    Cancelled
                </h4>
            </div>

            {
                activeTab === 'active' && <ActiveOrder />
            }

            {
                activeTab === 'completed' && <CompletedOrder />
            }

            {
                activeTab === 'cancelled' && <CancelledOrder />
            }
        </div >
    )
}

export default Order