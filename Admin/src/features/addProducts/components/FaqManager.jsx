import React, { useState, useEffect } from 'react';
import { getProductFaqs, createFaq, updateFaq, deleteFaq } from '../AddProductAPI';
import { IoClose } from 'react-icons/io5';

const FaqManager = ({ productId, productName }) => {
    const [faqs, setFaqs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingFaqId, setEditingFaqId] = useState(null);
    const [formData, setFormData] = useState({
        question: '',
        answer: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load FAQs
    const loadFaqs = async () => {
        if (!productId) return;
        try {
            setIsLoading(true);
            const response = await getProductFaqs(productId);
            if (response.data?.error === false) {
                setFaqs(response.data.faqs || []);
            }
        } catch (err) {
            setError('Failed to load FAQs');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFaqs();
    }, [productId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.question.trim() || !formData.answer.trim()) {
            setError('Question and answer are required');
            return;
        }

        try {
            setIsSaving(true);
            setError('');

            if (editingFaqId) {
                // Update existing FAQ
                const response = await updateFaq(editingFaqId, {
                    question: formData.question,
                    answer: formData.answer
                });
                if (response.data?.error === false) {
                    setSuccess('FAQ updated successfully');
                    setEditingFaqId(null);
                    loadFaqs();
                } else {
                    setError(response.data?.message || 'Failed to update FAQ');
                }
            } else {
                // Create new FAQ
                const response = await createFaq({
                    productId,
                    question: formData.question,
                    answer: formData.answer
                });
                if (response.data?.error === false) {
                    setSuccess('FAQ created successfully');
                    loadFaqs();
                } else {
                    setError(response.data?.message || 'Failed to create FAQ');
                }
            }

            setFormData({ question: '', answer: '' });
            setShowForm(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (faq) => {
        setEditingFaqId(faq._id);
        setFormData({
            question: faq.question,
            answer: faq.answer
        });
        setShowForm(true);
    };

    const handleDelete = async (faqId) => {
        if (!window.confirm('Are you sure you want to delete this FAQ?')) return;

        try {
            const response = await deleteFaq(faqId);
            if (response.data?.error === false) {
                setSuccess('FAQ deleted successfully');
                loadFaqs();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data?.message || 'Failed to delete FAQ');
            }
        } catch (err) {
            setError(err.message || 'Failed to delete FAQ');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingFaqId(null);
        setFormData({ question: '', answer: '' });
        setError('');
    };

    return (
        <div className='mt-6 p-4 border border-gray-300 rounded-lg bg-gray-50'>
            <div className='flex items-center justify-between mb-4'>
                <div>
                    <h3 className='text-lg font-bold text-gray-800'>Frequently Asked Questions</h3>
                    <p className='text-sm text-gray-600'>Manage FAQs for {productName}</p>
                </div>
                {!showForm && (
                    <button
                        type='button'
                        onClick={() => setShowForm(true)}
                        className='bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600'
                    >
                        + Add FAQ
                    </button>
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

            {/* FAQ Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className='mb-4 p-4 bg-white border border-gray-300 rounded-lg'>
                    <div className='mb-3'>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Question
                        </label>
                        <input
                            type='text'
                            name='question'
                            value={formData.question}
                            onChange={handleInputChange}
                            placeholder='Enter question'
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                            disabled={isSaving}
                        />
                    </div>

                    <div className='mb-3'>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Answer
                        </label>
                        <textarea
                            name='answer'
                            value={formData.answer}
                            onChange={handleInputChange}
                            placeholder='Enter answer'
                            rows='4'
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                            disabled={isSaving}
                        />
                    </div>

                    <div className='flex gap-2'>
                        <button
                            type='submit'
                            disabled={isSaving}
                            className='bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-60'
                        >
                            {isSaving ? 'Saving...' : editingFaqId ? 'Update FAQ' : 'Create FAQ'}
                        </button>
                        <button
                            type='button'
                            onClick={handleCancel}
                            className='bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-400'
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* FAQs List */}
            {isLoading ? (
                <div className='text-center py-8 text-gray-600'>Loading FAQs...</div>
            ) : faqs.length === 0 ? (
                <div className='text-center py-8 text-gray-600'>No FAQs yet. Add your first FAQ!</div>
            ) : (
                <div className='space-y-2'>
                    {faqs.map((faq) => (
                        <div key={faq._id} className='p-3 bg-white border border-gray-200 rounded-lg'>
                            <div className='flex items-start justify-between gap-2'>
                                <div className='flex-1'>
                                    <h4 className='font-medium text-gray-800'>{faq.question}</h4>
                                    <p className='text-sm text-gray-600 mt-1'>{faq.answer}</p>
                                </div>
                                <div className='flex gap-2 flex-shrink-0'>
                                    <button
                                        type='button'
                                        onClick={() => handleEdit(faq)}
                                        className='text-blue-500 hover:text-blue-700 text-sm font-medium'
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => handleDelete(faq._id)}
                                        className='text-red-500 hover:text-red-700 text-sm font-medium'
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FaqManager;
