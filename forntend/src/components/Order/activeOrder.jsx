import React from 'react'
import Button from '@mui/material/Button';

const ActiveOrder = ({ orders = [] }) => {
    if (!orders.length) {
        return <div className='mt-4 rounded-lg bg-gray-100 p-4 text-sm text-gray-600'>No active orders.</div>;
    }

    return (
        <div className='w-full h-full overflow-y-auto mt-2'>
            {orders.map((order) => {
                const product = order?.products?.[0]?.productId || {};
                const productId = product?._id || product?.id;
                const image = product?.images?.[0] || 'https://via.placeholder.com/300x300?text=Product';

                return (
                    <div key={order?._id || productId} className='flex w-full h-27.5 items-center rounded-lg bg-gray-100 mt-2'>
                        <img src={image} alt={product?.productName || 'Product'} className='w-31.5 h-24.75 rounded-xl object-cover' />
                        <div className='ml-4'>
                            <h4 className='font-bold text-[14px]'>{product?.productName || 'Product Name'}</h4>
                            <p className='text-gray-500 text-[12px] my-2'>{order?.paymentMethod || 'brand name'}</p>
                            <span className='text-blue-500 font-bold text-[14px]'>₹{Number(order?.totalAmount || product?.price || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className='mt-14 mr-2 ml-auto'>
                            <Button variant='contained' color='primary' size='small' className='mr-2 rounded-full!'>
                                Track Order
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ActiveOrder;
