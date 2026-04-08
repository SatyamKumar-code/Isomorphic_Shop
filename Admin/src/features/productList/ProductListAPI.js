import api from '../../services/api';

export const getProductList = (params = {}) => api.get('/api/product', { params });

export const deleteProductById = (productId) => api.delete(`/api/product/${productId}`);
