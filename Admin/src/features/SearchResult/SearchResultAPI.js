import api from '../../services/api';

export const searchProductsGlobal = (query) =>
    api.get('/api/product/search', {
        params: { q: query },
    });

export const searchOrdersGlobal = (query) =>
    api.get('/api/order', {
        params: {
            page: 1,
            limit: 5,
            search: query,
        },
    });

export const searchCustomersGlobal = (query) =>
    api.get('/api/user/admin/customers', {
        params: {
            page: 1,
            limit: 5,
            search: query,
        },
    });

export const searchSellersGlobal = (query) =>
    api.get('/api/user/admin/customers', {
        params: {
            role: 'seller',
            page: 1,
            limit: 5,
            search: query,
        },
    });

export const searchSubCategoriesGlobal = (query) =>
    api.get('/api/category/subcategories', {
        params: {
            page: 1,
            pageSize: 5,
            search: query,
        },
    });

export const getAllCategories = () => api.get('/api/category');

export const getPayoutDashboardGlobal = (params = {}) => api.get('/api/payout/dashboard', { params });
