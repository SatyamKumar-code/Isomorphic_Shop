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

// FAQ API methods
export const getProductFaqs = (productId) => api.get(`/api/faq/seller/product/${productId}`);

export const createFaq = (payload) => api.post('/api/faq/create', payload);

export const updateFaq = (faqId, payload) => api.patch(`/api/faq/${faqId}`, payload);

export const deleteFaq = (faqId) => api.delete(`/api/faq/${faqId}`);

// Q&A API methods
export const getProductQas = (productId) => api.get(`/api/qa/seller/product/${productId}`);

export const answerQuestion = (qaId, answer) => api.patch(`/api/qa/${qaId}/answer`, { answer });

export const deleteQa = (qaId) => api.delete(`/api/qa/${qaId}`);
