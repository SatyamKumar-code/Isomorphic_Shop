import api from "../../../services/api";

/**
 * Fetch categories for the sidebar
 * @returns {Promise}
 */
export const getCategories = () =>
    api.get("/api/category");

/**
 * Fetch all subcategories for the sidebar
 * @returns {Promise}
 */
export const getSubCategories = () =>
    api.get("/api/category/subcategories");

/**
 * Upload category image to cloudinary
 * @param {File} image - Image file to upload
 * @returns {Promise}
 */
export const uploadCategoryImage = (image) => {
    if (!image) return Promise.resolve(null);
    const formData = new FormData();
    formData.append("images", image);
    return api.post("/api/category/upload-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

/**
 * Create a new category (admin only)
 * @param {string} name - Category name
 * @returns {Promise}
 */
export const createCategory = (name) => {
    return api.post("/api/category", {
        catName: name,
    });
};

/**
 * Create a new subcategory (admin only)
 * @param {string} name - Subcategory name
 * @param {string} categoryId - Parent category ID
 * @returns {Promise}
 */
export const createSubCategory = (name, categoryId) => {
    return api.post("/api/category/subcategory", {
        subCatName: name,
        categoryId: categoryId,
    });
};
