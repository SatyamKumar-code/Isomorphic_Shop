import api from '../../services/api';

export const getAddProductCategories = () => api.get('/api/category');

export const getAddProductSubCategories = (categoryId) => api.get(`/api/category/subcategories/${categoryId}`);

export const uploadAddProductImage = (formData) => api.post('/api/product/upload-images', formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

export const removeAddProductImage = (imgUrl) => api.delete('/api/product/remove-image', {
    params: {
        img: imgUrl,
    },
});

export const createAddProduct = (payload) => api.post('/api/product', payload);

export const getAddProductById = (productId) => api.get(`/api/product/admin/${productId}`);

export const updateAddProduct = (productId, payload) => api.put(`/api/product/${productId}`, payload);
