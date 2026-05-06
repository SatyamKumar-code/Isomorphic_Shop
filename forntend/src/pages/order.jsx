import React, { useEffect, useMemo, useState } from 'react'
import BackButton from '../components/backButton';
import ActiveOrder from '../components/Order/activeOrder';
import CancelledOrder from '../components/Order/CancleOrder';
import CompletedOrder from '../components/Order/CompletedOrder';
import { fetchDataFromApi } from '../utils/api';

const Order = () => {
    const [activeTab, setActiveTab] = useState('active');
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadOrders = async () => {
            setIsLoading(true);
            const response = await fetchDataFromApi('/api/order/my-orders');
            setOrders(response?.orders || []);
            setIsLoading(false);
        };

        loadOrders();
    }, []);

    const groupedOrders = useMemo(() => {
        return orders.reduce((accumulator, order) => {
            const status = String(order?.status || 'pending').toLowerCase();

            if (status === 'delivered') {
                accumulator.completed.push(order);
            } else if (status === 'cancelled') {
                accumulator.cancelled.push(order);
            } else {
                accumulator.active.push(order);
            }

            return accumulator;
        }, { active: [], completed: [], cancelled: [] });
    }, [orders]);

    const renderOrders = () => {
        if (isLoading) {
            return <div className='mt-4 text-sm text-gray-500'>Loading orders...</div>;
        }

        if (activeTab === 'active') {
            return <ActiveOrder orders={groupedOrders.active} />;
        }

        if (activeTab === 'completed') {
            return <CompletedOrder orders={groupedOrders.completed} />;
        }

        return <CancelledOrder orders={groupedOrders.cancelled} />;
    };

    return (
        <div className='w-full h-screen'>
            <div className='flex items-center justify-between w-full'>
                <BackButton />
                <h2 className='font-bold'>Orders</h2>
                <div />
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

            {renderOrders()}
        </div>
    )
}

export default Order
