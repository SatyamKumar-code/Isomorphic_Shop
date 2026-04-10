import api from '../../services/api';

export const getProductList = (params = {}) => api.get('/api/product/admin/mine', { params });

export const deleteProductById = (productId) => api.delete(`/api/product/${productId}`);
