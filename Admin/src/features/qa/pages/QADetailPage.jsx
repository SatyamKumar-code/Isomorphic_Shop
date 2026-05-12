import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQA } from '../../../Context/qa/useQA';
import FaqManager from '../../addProducts/components/FaqManager';
import ProductDetailsCard from '../components/ProductDetailsCard';
import QATable from '../components/QATable';
import toast from 'react-hot-toast';

const QADetailPage = () => {
    const { productId } = useParams();
    const {
        qaList,
        qaStats,
        qaPagination,
        activeFilter,
        productDetails,
        tableLoading,
        loading,
        fetchQAByProduct,
        fetchQAListForProduct,
        answerQuestion
    } = useQA();
    const [localFilter, setLocalFilter] = useState(activeFilter || 'latest');
    const [localLimit, setLocalLimit] = useState(qaPagination.limit || 10);
    const [answerText, setAnswerText] = useState({});
    const [answeringId, setAnsweringId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const perPageOptions = [10, 20, 30, 50, 100];
    const selectedLimit = perPageOptions.includes(qaPagination.limit) ? qaPagination.limit : 10;
    const managedProductId = productDetails?._id || qaList[0]?.productId?._id || qaList[0]?.productId || productId;
    const managedProductName = productDetails?.productName || qaList[0]?.productId?.productName || 'Product';

    useEffect(() => {
        if (productId) {
            // initial load should fetch full product details once
            fetchQAByProduct(productId, { page: 1, limit: localLimit, filter: localFilter });
        }
    }, [productId, fetchQAByProduct]);

    const handleAnswerSubmit = async (qaId, currentAnswer) => {
        const text = answerText[qaId] || currentAnswer;

        if (!text.trim()) {
            toast.error('Please enter an answer');
            return;
        }

        setAnsweringId(qaId);
        const result = await answerQuestion(qaId, text);
        setAnsweringId(null);

        if (result.success) {
            setAnswerText(prev => ({ ...prev, [qaId]: '' }));
            setEditingId(null);
            await fetchQAByProduct(productId, {
                page: qaPagination.page,
                limit: qaPagination.limit,
                filter: activeFilter
            });
            toast.success('Answer posted successfully');
        } else {
            toast.error(result.error || 'Failed to post answer');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setAnswerText(prev => ({ ...prev, [editingId]: '' }));
    };

    const handleFilterChange = async (event) => {
        const nextFilter = event.target.value;
        setLocalFilter(nextFilter);
        await fetchQAListForProduct(productId, { page: 1, limit: localLimit, filter: nextFilter });
    };

    const handleLimitChange = async (event) => {
        const nextLimit = Number.parseInt(event.target.value, 10) || 10;
        setLocalLimit(nextLimit);
        await fetchQAListForProduct(productId, {
            page: 1,
            limit: nextLimit,
            filter: localFilter
        });
    };

    const handlePageChange = async (nextPage) => {
        if (nextPage < 1 || nextPage > qaPagination.totalPages) return;
        await fetchQAByProduct(productId, {
            page: nextPage,
            limit: qaPagination.limit,
            filter: activeFilter
        });
    };

    return (
        <div className='w-full h-[calc(100vh-6.25rem)] overflow-x-auto scrollbarNone px-5 pb-6 pt-4'>

            {loading ? (
                <div className='flex justify-center items-center py-20'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-500'></div>
                </div>
            ) : (
                <div className='space-y-6'>
                    {/* Product Details Card Component */}
                    <ProductDetailsCard productDetails={productDetails} qaList={qaList} qaStats={qaStats} />

                    {/* FAQ Section */}
                    {managedProductId && (
                        <div className='my-5'>
                            <FaqManager
                                productId={managedProductId}
                                productName={managedProductName}
                            />
                        </div>
                    )}

                    {/* Q&A Section */}
                    <div className="shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg">
                        <div className='p-5 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                            <div>
                                <h3 className='text-xl font-bold text-[#23272E] dark:text-[#c1c6cf]'>
                                    Customer Questions & Answers
                                </h3>
                                <p className='text-sm text-[#23272E] dark:text-[#c1c6cf] mt-1'>
                                    Manage all customer questions and provide answers
                                </p>
                            </div>

                            <div className='flex items-center gap-2'>
                                <label htmlFor='qa-filter' className='text-sm font-medium text-[#23272E] dark:text-[#c1c6cf]'>
                                    Filter
                                </label>
                                <select
                                    id='qa-filter'
                                    value={localFilter}
                                    onChange={handleFilterChange}
                                    className='px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-[#23272E] dark:text-[#c1c6cf] focus:outline-none focus:ring-2 focus:ring-green-500'
                                >
                                    <option value='latest'>Latest</option>
                                    <option value='oldest'>Oldest</option>
                                    <option value='pending'>Pending</option>
                                    <option value='answered'>Answered</option>
                                </select>
                            </div>
                        </div>

                        {/* Q&A Table Component */}
                        {tableLoading ? (
                            <div className='flex justify-center items-center py-12'>
                                <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-green-500'></div>
                            </div>
                        ) : (
                            <QATable
                                qaList={qaList}
                                editingId={editingId}
                                setEditingId={setEditingId}
                                answerText={answerText}
                                setAnswerText={setAnswerText}
                                answeringId={answeringId}
                                handleAnswerSubmit={handleAnswerSubmit}
                                handleCancelEdit={handleCancelEdit}
                            />
                        )}

                        <div className='flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700'>
                            <div className='flex items-center gap-3'>
                                <label htmlFor='qa-per-page' className='text-sm font-medium text-[#23272E] dark:text-[#c1c6cf]'>
                                    Per page
                                </label>
                                <select
                                    id='qa-per-page'
                                    value={localLimit}
                                    onChange={handleLimitChange}
                                    className='px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-[#23272E] dark:text-[#c1c6cf] focus:outline-none focus:ring-2 focus:ring-green-500'
                                >
                                    <option value='10'>10</option>
                                    <option value='20'>20</option>
                                    <option value='30'>30</option>
                                    <option value='50'>50</option>
                                    <option value='100'>100</option>
                                </select>
                                <p className='text-sm text-gray-600 dark:text-gray-400 ml-3'>
                                    Page {qaPagination.page} of {qaPagination.totalPages} ({qaPagination.total} items)
                                </p>
                            </div>
                            <div className='flex items-center gap-2'>
                                <button
                                    type='button'
                                    onClick={() => handlePageChange(qaPagination.page - 1)}
                                    disabled={!qaPagination.hasPrevPage || loading}
                                    className='px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800'
                                >
                                    Previous
                                </button>
                                <button
                                    type='button'
                                    onClick={() => handlePageChange(qaPagination.page + 1)}
                                    disabled={!qaPagination.hasNextPage || loading}
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

export default QADetailPage;
