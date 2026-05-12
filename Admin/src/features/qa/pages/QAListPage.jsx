import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQA } from '../../../Context/qa/useQA';
import toast from 'react-hot-toast';

const QAListPage = () => {
    const navigate = useNavigate();
    const { qaProducts, qaProductsLoading, qaProductsPagination, error, fetchQAProducts } = useQA();
    const [localFilter, setLocalFilter] = useState('all');
    const [localLimit, setLocalLimit] = useState(10);
    const [localPage, setLocalPage] = useState(1);

    useEffect(() => {
        fetchQAProducts({ page: localPage, limit: localLimit, filter: localFilter });
    }, [fetchQAProducts]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const handleProductClick = (productId) => {
        navigate(`/qa-management/${productId}`);
    };

    return (
        <div className='w-full h-[calc(100vh-6.25rem)] overflow-x-auto scrollbarNone px-5 pb-6 pt-4'>
            <div className='mb-6'>
                <h1 className='text-2xl font-bold text-gray-800 dark:text-white mb-2'>
                    Questions & Answers Management
                </h1>
                <p className='text-gray-600 dark:text-gray-400'>
                    Manage customer questions and answers for your products
                </p>
            </div>

            {qaProductsLoading ? (
                <div className='flex justify-center items-center py-12'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-500'></div>
                </div>
            ) : qaProducts.length === 0 ? (
                <div className='text-center py-12'>
                    <svg
                        className='mx-auto h-12 w-12 text-gray-400'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                    </svg>
                    <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                        No products with questions
                    </h3>
                    <p className='mt-1 text-sm text-gray-500'>
                        When customers ask questions about your products, they will appear here.
                    </p>
                </div>
            ) : (
                <div>
                    <div className='mb-4 flex items-center justify-between gap-3'>


                    </div>

                    <div className='overflow-x-auto shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg'>
                        <div className='flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700'>
                            <h2 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
                                Products with Questions
                            </h2>
                            <div className='flex items-center gap-1'>
                                <label className='text-sm font-medium text-[#23272E] dark:text-[#c1c6cf] mr-2'>Filter</label>
                                <select
                                    value={localFilter}
                                    onChange={async (e) => {
                                        const f = e.target.value;
                                        setLocalFilter(f);
                                        setLocalPage(1);
                                        await fetchQAProducts({ page: 1, limit: localLimit, filter: f });
                                    }}
                                    className='px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-[#23272E] dark:text-[#c1c6cf]'
                                >
                                    <option value='all'>All</option>
                                    <option value='answered'>Answered</option>
                                    <option value='pending'>Pending</option>
                                    <option value='latest'>Latest</option>
                                    <option value='oldest'>Oldest</option>
                                </select>
                            </div>
                        </div>

                        <table className='w-full text-sm'>
                            <thead className='bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
                                <tr>
                                    <th className='px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300'>
                                        Product Name
                                    </th>
                                    <th className='px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300'>
                                        Total Questions
                                    </th>
                                    <th className='px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300'>
                                        Answered
                                    </th>
                                    <th className='px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300'>
                                        Unanswered
                                    </th>
                                    <th className='px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300'>
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                                {qaProducts.map((product) => (
                                    <tr
                                        key={product._id}
                                        className='hover:bg-gray-50 dark:hover:bg-gray-800'
                                    >
                                        <td className='px-6 py-4'>
                                            <div className='flex items-center gap-3'>
                                                {product.productImage && (
                                                    <img
                                                        src={product.productImage}
                                                        alt={product.productName}
                                                        className='h-10 w-10 rounded object-cover'
                                                    />
                                                )}
                                                <span className='text-gray-800 dark:text-gray-200 font-medium'>
                                                    {product.productName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4 text-center'>
                                            <span className='inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold'>
                                                {product.totalQA}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4 text-center'>
                                            <span className='inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-semibold'>
                                                {product.answeredQA}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4 text-center'>
                                            <span
                                                className={`inline-flex items-center justify-center h-8 w-8 rounded-full font-semibold ${product.unansweredQA > 0
                                                    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                                    }`}
                                            >
                                                {product.unansweredQA}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4 text-center'>
                                            <button
                                                onClick={() => handleProductClick(product._id)}
                                                className='inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded transition cursor-pointer'
                                            >
                                                <svg
                                                    className='w-4 h-4 mr-1'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M9 5l7 7-7 7'
                                                    />
                                                </svg>
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className='flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-700'>
                            <div className='flex items-center gap-2'>
                                <label className='text-sm font-medium text-[#23272E] dark:text-[#c1c6cf]'>Per page</label>
                                <select
                                    value={localLimit}
                                    onChange={async (e) => {
                                        const l = Number.parseInt(e.target.value, 10) || 10;
                                        setLocalLimit(l);
                                        setLocalPage(1);
                                        await fetchQAProducts({ page: 1, limit: l, filter: localFilter });
                                    }}
                                    className='px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-[#23272E] dark:text-[#c1c6cf]'
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={30}>30</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>

                                <p className='text-sm text-gray-600 dark:text-gray-400'>
                                    Page {qaProductsPagination.page} of {qaProductsPagination.totalPages} ({qaProductsPagination.total} items)
                                </p>

                            </div>

                            <div className='flex items-center gap-2'>
                                <button
                                    type='button'
                                    onClick={async () => {
                                        const next = Math.max(1, (qaProductsPagination.page || 1) - 1);
                                        setLocalPage(next);
                                        await fetchQAProducts({ page: next, limit: localLimit, filter: localFilter });
                                    }}
                                    disabled={!qaProductsPagination.hasPrevPage}
                                    className='px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800'
                                >
                                    Previous
                                </button>
                                <button
                                    type='button'
                                    onClick={async () => {
                                        const next = Math.min(qaProductsPagination.totalPages || 1, (qaProductsPagination.page || 1) + 1);
                                        setLocalPage(next);
                                        await fetchQAProducts({ page: next, limit: localLimit, filter: localFilter });
                                    }}
                                    disabled={!qaProductsPagination.hasNextPage}
                                    className='px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800'
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>


                </div>
            )}
        </div>
    );
};

export default QAListPage;
