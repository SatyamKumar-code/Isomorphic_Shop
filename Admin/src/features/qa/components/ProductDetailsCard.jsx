import React from 'react';

const ProductDetailsCard = ({ productDetails, qaList, qaStats }) => {
    const totalQa = qaStats?.total ?? qaList.length;
    const answeredQa = qaStats?.answered ?? qaList.filter(q => q.isAnswered).length;
    const pendingQa = qaStats?.pending ?? qaList.filter(q => !q.isAnswered).length;

    return (
        <div>
            <h2 className='text-3xl font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-3'>
                <svg className='w-8 h-8 text-blue-600 dark:text-blue-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 7l-8-4-8 4m0 0l8 4m-8-4v10l8 4m0-10l8-4m-8 4v10m0-10l8 4m-8-4l-8 4' />
                </svg>
                Product Details & Q&A Management
            </h2>

            {/* Main Product Info Grid (kept padding to match dashboard) */}
            <div className='grid grid-cols-1 lg:grid-cols-4 gap-8 p-5 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg'>
                {/* Product Image - Featured */}
                <div className='lg:col-span-1'>
                    <div className='sticky top-6'>
                        {(() => {
                            const images = Array.isArray(productDetails?.images) ? productDetails.images : [];
                            const mainImg = images[0] || null;
                            const secondImg = images[1] || null;
                            const thirdImg = images[2] || null;
                            const placeholder = 'https://via.placeholder.com/400x300?text=No+Image';
                            const apiBase = import.meta.env.VITE_API_URL || '';
                            const buildUrl = (p) => {
                                if (!p) return placeholder;
                                if (p.startsWith('http') || p.startsWith('data:')) return p;
                                return `${apiBase.replace(/\/$/, '')}/${p.replace(/^\//, '')}`;
                            };

                            return (
                                <div>
                                    <div className='w-full h-49 rounded-xl overflow-hidden border-2 border-blue-200 dark:border-blue-800 shadow-md hover:shadow-lg transition'>
                                        <img
                                            src={buildUrl(mainImg)}
                                            alt={productDetails?.productName || 'Product'}
                                            className='w-full h-full object-cover object-center'
                                        />
                                    </div>
                                    {secondImg && (
                                        <div className='mt-3'>
                                            <div className='w-full h-48 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700'>
                                                <img
                                                    src={buildUrl(secondImg)}
                                                    alt={`${productDetails?.productName || 'Product'} - 2`}
                                                    className='w-full h-full object-cover object-center'
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {thirdImg && (
                                        <div className='mt-3'>
                                            <div className='w-full h-48 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700'>
                                                <img
                                                    src={buildUrl(thirdImg)}
                                                    alt={`${productDetails?.productName || 'Product'} - 3`}
                                                    className='w-full h-full object-cover object-center'
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Product Information - Details Section */}
                <div className='lg:col-span-3 space-y-6'>
                    {productDetails ? (
                        <>
                            {/* Product Name & Primary Info */}
                            <div className='pb-6 border-b border-gray-200 dark:border-gray-700'>
                                <p className='text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2'>Product Information</p>
                                <h3 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                                    {productDetails.productName}
                                </h3>
                                <div className='flex flex-wrap gap-2'>
                                    {productDetails.category?.catName && (
                                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'>
                                            {productDetails.category.catName}
                                        </span>
                                    )}
                                    {productDetails.subCategory?.subCatName && (
                                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'>
                                            {productDetails.subCategory.subCatName}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Price & Stock Grid */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div className='bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700'>
                                    <p className='text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1'>Price</p>
                                    <p className='text-2xl font-bold text-green-700 dark:text-green-300'>
                                        Rs. {productDetails.price?.toLocaleString() || 'N/A'}
                                    </p>
                                </div>
                                <div className={`rounded-lg p-4 border ${productDetails.stock > 0
                                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700'
                                    : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700'
                                    }`}>
                                    <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${productDetails.stock > 0
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-red-600 dark:text-red-400'
                                        }`}>Stock</p>
                                    <p className={`text-2xl font-bold ${productDetails.stock > 0
                                        ? 'text-blue-700 dark:text-blue-300'
                                        : 'text-red-700 dark:text-red-300'
                                        }`}>
                                        {productDetails.stock || 0} Units
                                    </p>
                                </div>
                            </div>

                            {/* Rating & Sales Grid */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div className='bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700'>
                                    <p className='text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-1'>Rating</p>
                                    <p className='text-2xl font-bold text-yellow-700 dark:text-yellow-300'>
                                        {productDetails.rating ? `${productDetails.rating}⭐` : '—'}
                                    </p>
                                    <p className='text-xs text-yellow-600 dark:text-yellow-400 mt-1'>
                                        {productDetails.rating ? 'Out of 5' : 'No ratings'}
                                    </p>
                                </div>
                                <div className='bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700'>
                                    <p className='text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1'>Total Sales</p>
                                    <p className='text-2xl font-bold text-purple-700 dark:text-purple-300'>
                                        {productDetails.sales || 0}
                                    </p>
                                    <p className='text-xs text-purple-600 dark:text-purple-400 mt-1'>Units Sold</p>
                                </div>
                            </div>

                            {/* Description */}
                            {productDetails.description && (
                                <div className='bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                                    <p className='text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2'>Description</p>
                                    <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3'>
                                        {productDetails.description}
                                    </p>
                                </div>
                            )}

                            {/* Q&A Stats - Summary Badges */}
                            <div className='pt-4 border-t border-gray-200 dark:border-gray-700'>
                                <p className='text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-3'>Q&A Overview</p>
                                <div className='grid grid-cols-3 gap-3'>
                                    <div className='text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'>
                                        <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                                            {totalQa}
                                        </p>
                                        <p className='text-xs text-blue-600 dark:text-blue-400 font-medium mt-1'>Total</p>
                                    </div>
                                    <div className='text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'>
                                        <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
                                            {answeredQa}
                                        </p>
                                        <p className='text-xs text-green-600 dark:text-green-400 font-medium mt-1'>Answered</p>
                                    </div>
                                    <div className='text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700'>
                                        <p className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
                                            {pendingQa}
                                        </p>
                                        <p className='text-xs text-orange-600 dark:text-orange-400 font-medium mt-1'>Pending</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className='text-center py-12'>
                            <p className='text-gray-500 dark:text-gray-400'>No product information available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsCard;
