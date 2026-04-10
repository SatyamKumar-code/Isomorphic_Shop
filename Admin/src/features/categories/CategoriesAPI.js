import api from '../../services/api';

export const getCategories = () => api.get('/api/category');

export const getProducts = () => api.get('/api/product/admin/mine');
