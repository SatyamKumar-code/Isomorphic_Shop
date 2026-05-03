import api from '../../services/api';

export const getCategories = () => api.get('/api/category');

export const getProducts = () => api.get('/api/product/admin/mine');

export const createCategory = (data) => api.post('/api/category', data);

export const updateCategory = (categoryId, data) => api.put(`/api/category/${categoryId}`, data);

export const uploadCategoryImages = (formData) =>
    api.post('/api/category/upload-images', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

export const createSubCategory = (data) => api.post('/api/category/subcategory', data);

export const updateSubCategory = (subCategoryId, data) => api.put(`/api/category/subcategory/${subCategoryId}`, data);

export const getAllSubCategories = (categoryId, page, pageSize, search) =>
    api.get('/api/category/subcategories', {
        params: {
            ...(categoryId ? { categoryId } : {}),
            ...(page ? { page } : {}),
            ...(pageSize ? { pageSize } : {}),
            ...(search ? { search } : {}),
        },
    });

export const getSubCategoriesByCategoryId = (categoryId) => api.get(`/api/category/subcategories/${categoryId}`);

export const deleteSubCategory = (subCategoryId) => api.delete(`/api/category/subcategory/${subCategoryId}`);

export const deleteCategory = (categoryId) => api.delete(`/api/category/${categoryId}`);
