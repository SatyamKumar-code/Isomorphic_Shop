import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MyContext } from '../App'
import { getNotifications, markNotificationAsRead } from '../utils/notificationsAPI'
import { fetchDataFromApi } from '../utils/api'

const Notifications = () => {
    const context = useContext(MyContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [ordersMap, setOrdersMap] = useState({});
    const navigate = useNavigate();

    const load = async () => {
        if (!context?.isLoggedIn) return;
        const res = await getNotifications({ limit: 50 });
        if (res?.error === false && res?.data) {
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        }
    }

    // also fetch user's orders once so we can show product names/prices for notifications
    const loadOrders = async () => {
        if (!context?.isLoggedIn) return;
        const res = await fetchDataFromApi('/api/order/my-orders');
        if (res?.error === false && res?.orders) {
            const map = {};
            for (const o of res.orders) {
                map[String(o._id)] = o;
            }
            setOrdersMap(map);
        }
    }

    useEffect(() => {
        load();
        loadOrders();
    }, [context?.isLoggedIn]);

    const openNotification = async (n) => {
        try {
            if (!n.isRead) {
                await markNotificationAsRead(n._id);
            }
        } catch (err) {
            console.error(err);
        }

        navigate(`/order/${n?.meta?.orderId}`);
    }

    return (
        <div className='py-3 px-1'>
            <h1 className='text-xl font-bold mb-4'>Notifications</h1>
            
            <div className='space-y-2'>
                {notifications.length === 0 && (
                    <div className='text-gray-500'>No notifications</div>
                )}

                {notifications.map((n) => {
                    const order = n?.meta?.orderId ? ordersMap[String(n.meta.orderId)] : null;
                    const productName = order ? (order.products?.[0]?.productId?.name || order.products?.[0]?.productId?.title || '') : '';

                    return (
                        <div key={n._id}
                            onClick={() => openNotification(n)}
                            className={`p-3 rounded border cursor-pointer flex justify-between items-start ${n.isRead ? 'bg-white' : 'bg-blue-50 border-blue-100'}`}>
                            <div>
                                <div className={`font-medium ${n.isRead ? 'text-gray-800' : 'text-blue-800'}`}>{n.title}</div>
                                <div className='text-sm text-gray-600'>{productName ? productName : (n.message?.length > 80 ? n.message.slice(0, 80) + '...' : n.message)}</div>
                                
                            </div>
                            <div className='text-xs flex-shrink-0 text-gray-500'>{new Date(n.createdAt).toLocaleDateString('en-GB')}</div>
                        </div>
                    )
                })}

            </div>
        </div>
    )
}

export default Notifications
