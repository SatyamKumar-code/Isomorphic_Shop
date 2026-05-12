import { createContext, useState, useCallback } from 'react';
import api from '../../services/api';

export const QAContext = createContext();

export const QAProvider = ({ children }) => {
    const [qaProducts, setQaProducts] = useState([]);
    const [qaProductsLoading, setQaProductsLoading] = useState(false);
    const [qaProductsPagination, setQaProductsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productDetails, setProductDetails] = useState(null);
    const [qaList, setQaList] = useState([]);
    const [qaStats, setQaStats] = useState({ total: 0, answered: 0, pending: 0 });
    const [qaPagination, setQaPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [activeFilter, setActiveFilter] = useState('latest');
    const [tableLoading, setTableLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all products with Q&A counts (for admin)
    const fetchQAProducts = useCallback(async (options = {}) => {
        setQaProductsLoading(true);
        setError(null);
        try {
            const params = {
                page: options.page || 1,
                limit: options.limit || qaProductsPagination.limit || 10,
                filter: options.filter || 'all'
            };

            const response = await api.get('/api/qa/admin/products', { params });
            setQaProducts(response.data.products || []);
            setQaProductsPagination(response.data.pagination || {
                page: params.page,
                limit: params.limit,
                total: 0,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            });
        } catch (err) {
            setError(err.message || 'Failed to fetch Q&A products');
            console.error('Error fetching Q&A products:', err);
        } finally {
            setQaProductsLoading(false);
        }
    }, [qaProductsPagination.limit]);

    // Fetch Q&As for a specific product
    const fetchQAByProduct = useCallback(async (productId, options = {}) => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: options.page || 1,
                limit: options.limit || 10,
                filter: options.filter || 'latest'
            };

            const response = await api.get(`/api/qa/seller/product/${productId}`, { params });
            setQaList(response.data.qas || []);
            setProductDetails(response.data.product || null);
            setSelectedProduct(productId);
            setQaStats(response.data.stats || { total: 0, answered: 0, pending: 0 });
            setQaPagination(response.data.pagination || {
                page: params.page,
                limit: params.limit,
                total: 0,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            });
            setActiveFilter(response.data.filter || params.filter);
        } catch (err) {
            setError(err.message || 'Failed to fetch Q&As');
            console.error('Error fetching Q&As:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch only Q&A list + pagination/stats for the product (table-only refresh)
    const fetchQAListForProduct = useCallback(async (productId, options = {}) => {
        setTableLoading(true);
        setError(null);
        try {
            const params = {
                page: options.page || 1,
                limit: options.limit || 10,
                filter: options.filter || 'latest'
            };

            const response = await api.get(`/api/qa/seller/product/${productId}`, { params });
            setQaList(response.data.qas || []);
            setQaStats(response.data.stats || { total: 0, answered: 0, pending: 0 });
            setQaPagination(response.data.pagination || {
                page: params.page,
                limit: params.limit,
                total: 0,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            });
            // do not alter selectedProduct or productDetails here to avoid full-page refresh
        } catch (err) {
            setError(err.message || 'Failed to fetch Q&As');
            console.error('Error fetching Q&As:', err);
        } finally {
            setTableLoading(false);
        }
    }, []);

    // Answer a question
    const answerQuestion = useCallback(async (qaId, answer) => {
        try {
            const response = await api.patch(`/api/qa/${qaId}/answer`, {
                answer
            });

            // Update the QA list
            setQaList(prev =>
                prev.map(qa => qa._id === qaId ? response.data.qa : qa)
            );

            // Update the product Q&A count
            setQaProducts(prev =>
                prev.map(product => {
                    if (product._id === selectedProduct) {
                        return {
                            ...product,
                            totalQA: product.totalQA,
                            answeredQA: product.answeredQA + 1,
                            unansweredQA: Math.max(0, product.unansweredQA - 1)
                        };
                    }
                    return product;
                })
            );

            return { success: true, data: response.data };
        } catch (err) {
            setError(err.message || 'Failed to answer question');
            console.error('Error answering question:', err);
            return { success: false, error: err.message };
        }
    }, [selectedProduct]);

    // Delete a question
    const deleteQuestion = useCallback(async (qaId) => {
        try {
            await api.delete(`/api/qa/${qaId}`);

            // Update the QA list
            setQaList(prev => prev.filter(qa => qa._id !== qaId));

            return { success: true };
        } catch (err) {
            setError(err.message || 'Failed to delete question');
            console.error('Error deleting question:', err);
            return { success: false, error: err.message };
        }
    }, []);

    return (
        <QAContext.Provider
            value={{
                qaProducts,
                qaProductsPagination,
                qaProductsLoading,
                selectedProduct,
                productDetails,
                qaList,
                qaStats,
                qaPagination,
                activeFilter,
                tableLoading,
                loading,
                error,
                fetchQAProducts,
                fetchQAByProduct,
                fetchQAListForProduct,
                answerQuestion,
                deleteQuestion,
                setError,
                setActiveFilter
            }}
        >
            {children}
        </QAContext.Provider>
    );
};
