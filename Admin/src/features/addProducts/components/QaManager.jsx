import React, { useState, useEffect } from 'react';
import { getProductQas, answerQuestion, deleteQa } from '../AddProductAPI';

const QaManager = ({ productId, productName }) => {
    const [qas, setQas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [answeringQaId, setAnsweringQaId] = useState(null);
    const [answerText, setAnswerText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load Q&As
    const loadQas = async () => {
        if (!productId) return;
        try {
            setIsLoading(true);
            setError('');
            const response = await getProductQas(productId);
            if (response.data?.error === false) {
                setQas(response.data.qas || []);
            } else {
                setError(response.data?.message || 'Failed to load questions');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to load questions';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadQas();
    }, [productId]);

    const handleAnswerSubmit = async (qaId) => {
        if (!answerText.trim()) {
            setError('Please enter an answer');
            return;
        }

        try {
            setIsSaving(true);
            setError('');

            const response = await answerQuestion(qaId, answerText.trim());
            if (response.data?.error === false) {
                setSuccess('Answer posted successfully');
                setAnsweringQaId(null);
                setAnswerText('');
                await loadQas();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data?.message || 'Failed to post answer');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Something went wrong';
            setError(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (qaId) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;

        try {
            setError('');
            const response = await deleteQa(qaId);
            if (response.data?.error === false) {
                setSuccess('Question deleted successfully');
                await loadQas();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data?.message || 'Failed to delete question');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to delete question';
            setError(errorMsg);
        }
    };

    const unansweredCount = qas.filter(qa => !qa.isAnswered).length;

    return (
        <div className='mt-6 p-4 border border-gray-300 rounded-lg bg-gray-50'>
            <div className='flex items-center justify-between mb-4'>
                <div>
                    <h3 className='text-lg font-bold text-gray-800'>Customer Questions</h3>
                    <p className='text-sm text-gray-600'>Manage Q&A for {productName}</p>
                </div>
                {unansweredCount > 0 && (
                    <div className='bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium'>
                        {unansweredCount} unanswered
                    </div>
                )}
            </div>

            {/* Success message */}
            {success && (
                <div className='mb-4 p-3 bg-green-100 border border-green-300 rounded text-green-700 text-sm'>
                    {success}
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className='mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm'>
                    {error}
                </div>
            )}

            {/* Q&A List */}
            {isLoading ? (
                <div className='text-center py-8 text-gray-600'>Loading questions...</div>
            ) : qas.length === 0 ? (
                <div className='text-center py-8 text-gray-600'>No questions yet</div>
            ) : (
                <div className='space-y-3'>
                    {qas.map((qa) => (
                        <div key={qa._id} className='p-3 bg-white border border-gray-200 rounded-lg'>
                            <div className='flex items-start justify-between gap-2 mb-2'>
                                <div className='flex-1'>
                                    <div className='flex items-center gap-2 mb-1'>
                                        <h4 className='font-medium text-gray-800'>{qa.userId?.name || 'Anonymous'}</h4>
                                        <span className='text-xs text-gray-500'>
                                            {new Date(qa.createdAt).toLocaleDateString('en-IN')}
                                        </span>
                                    </div>
                                    <p className='text-sm text-gray-700 font-medium'>Q: {qa.question}</p>
                                </div>
                                <div className='flex gap-2 flex-shrink-0'>
                                    <button
                                        type='button'
                                        onClick={() => handleDelete(qa._id)}
                                        className='text-red-500 hover:text-red-700 text-xs font-medium'
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Answer Section */}
                            {qa.isAnswered ? (
                                <div className='ml-4 p-2 bg-green-50 rounded border-l-2 border-green-500 mt-2'>
                                    <div className='text-xs font-medium text-green-700 mb-1'>Your Answer:</div>
                                    <p className='text-sm text-gray-700'>A: {qa.answer}</p>
                                </div>
                            ) : (
                                <>
                                    {answeringQaId === qa._id ? (
                                        <div className='ml-4 mt-2 p-2 bg-gray-100 rounded'>
                                            <textarea
                                                value={answerText}
                                                onChange={(e) => setAnswerText(e.target.value)}
                                                placeholder='Type your answer here...'
                                                rows='3'
                                                className='w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2'
                                                disabled={isSaving}
                                            />
                                            <div className='flex gap-2'>
                                                <button
                                                    type='button'
                                                    onClick={() => handleAnswerSubmit(qa._id)}
                                                    disabled={isSaving}
                                                    className='bg-green-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-600 disabled:opacity-60'
                                                >
                                                    {isSaving ? 'Posting...' : 'Post Answer'}
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => { setAnsweringQaId(null); setAnswerText(''); }}
                                                    className='bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-400'
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className='ml-4 mt-2'>
                                            <button
                                                type='button'
                                                onClick={() => { setAnsweringQaId(qa._id); setAnswerText(''); }}
                                                className='text-blue-500 hover:text-blue-700 text-xs font-medium'
                                            >
                                                Answer Question
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QaManager;
