
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../Context/auth/useAuth';
import { getCategories, getSubCategories, uploadCategoryImage, createCategory, createSubCategory } from './AddProductSidebarAPI';
import toast from 'react-hot-toast';

const AddProductSidebar = () => {
    const navigate = useNavigate();
    const { userData } = useAuth();
    const isAdmin = userData?.role === 'admin';

    const [categories, setCategories] = useState([]);
    const [allSubCategories, setAllSubCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalEntity, setModalEntity] = useState('category'); // 'category' or 'subcategory'
    const [catName, setCatName] = useState('');
    const [catImage, setCatImage] = useState(null);
    const [catPreview, setCatPreview] = useState('');
    const [subCatName, setSubCatName] = useState('');
    const [subCatParentId, setSubCatParentId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [catRes, subCatRes] = await Promise.all([
                getCategories(),
                getSubCategories(),
            ]);

            console.log('Category Response:', catRes?.data);
            console.log('SubCategory Response:', subCatRes?.data);

            // Handle categories response
            let allCategoriesFormatted = [];
            if (catRes?.data?.categories) {
                allCategoriesFormatted = Array.isArray(catRes.data.categories)
                    ? catRes.data.categories.map(cat => ({
                        id: cat._id || cat.id,
                        name: cat.catName || cat.name,
                        img: cat.image || "https://img.icons8.com/ios-filled/50/000000/laptop.png",
                    }))
                    : [];
                setCategories(allCategoriesFormatted);
            }

            // Handle subcategories response - fetch ALL subcategories, not just 3
            if (subCatRes?.data) {
                // Response could be { subcategories: [] } or { data: [] } or directly []
                const subCatList = subCatRes.data.subcategories || subCatRes.data.data || subCatRes.data.subCategories || [];

                const formattedSubCats = Array.isArray(subCatList)
                    ? subCatList.map(subCat => {
                        // Get parent category info
                        const parentCategory = allCategoriesFormatted.find(c =>
                            c.id === (subCat.categoryId?._id || subCat.categoryId)
                        );

                        return {
                            id: subCat._id || subCat.id,
                            name: subCat.subCatName || subCat.name,
                            parentId: subCat.categoryId?._id || subCat.categoryId || '',
                            parentName: parentCategory?.name || subCat.categoryId?.catName || 'Unknown',
                            parentImg: parentCategory?.img || "https://img.icons8.com/ios-filled/50/000000/laptop.png",
                            img: subCat.image || "https://img.icons8.com/ios-filled/50/000000/sofa.png",
                        };
                    })
                    : [];

                setAllSubCategories(formattedSubCats);
                console.log('All SubCategories:', formattedSubCats);
            }
        } catch (error) {
            console.error('Error loading sidebar data:', error);
            toast.error('Failed to load categories and subcategories');
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (entity) => {
        setModalEntity(entity);
        setCatName('');
        setCatImage(null);
        setCatPreview('');
        setSubCatName('');
        setSubCatParentId(categories[0]?.id || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCatName('');
        setCatImage(null);
        setCatPreview('');
        setSubCatName('');
        setSubCatParentId('');
    };

    const handleCategoryImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setCatImage(file);
            setCatPreview(URL.createObjectURL(file));
        }
    };

    const handleCreateCategory = async () => {
        if (!catName.trim()) {
            toast.error('Category name is required');
            return;
        }

        try {
            setIsSubmitting(true);

            // Upload image first if provided
            if (catImage) {
                await uploadCategoryImage(catImage);
            }

            // Then create category
            await createCategory(catName.trim());
            toast.success('Category created successfully');
            closeModal();
            loadData();
        } catch (error) {
            console.error('Error creating category:', error);
            toast.error(error?.response?.data?.message || 'Failed to create category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateSubCategory = async () => {
        if (!subCatName.trim()) {
            toast.error('Subcategory name is required');
            return;
        }

        if (!subCatParentId) {
            toast.error('Parent category is required');
            return;
        }

        try {
            setIsSubmitting(true);
            await createSubCategory(subCatName.trim(), subCatParentId);
            toast.success('Subcategory created successfully');
            closeModal();
            loadData();
        } catch (error) {
            console.error('Error creating subcategory:', error);
            toast.error(error?.response?.data?.message || 'Failed to create subcategory');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCategoryClick = (categoryId) => {
        // Toggle - if already selected, unselect it; otherwise select it
        if (selectedCategoryId === categoryId) {
            setSelectedCategoryId(null);
        } else {
            setSelectedCategoryId(categoryId);
        }
    };

    const handleAddProduct = (subCatId, parentCatId) => {
        // Navigate to add-products with state containing the selected category and subcategory
        navigate('/add-products', {
            state: {
                selectedCategory: parentCatId,
                selectedSubCategory: subCatId,
            }
        });
    };

    // Get filtered subcategories for selected category
    // If no category selected, show ALL subcategories
    const filteredSubCategories = selectedCategoryId
        ? allSubCategories.filter(subCat => subCat.parentId === selectedCategoryId)
        : allSubCategories;

    const handleSeeMoreCategories = () => {
        navigate('/categories');
    };

    return (
        <>
            <div className="add-product-card min-w-81 w-143 h-[600px] flex flex-col shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg">
                {/* Header */}
                <div className="px-5 pt-5 pb-1 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-[14px] leading-6.5 text-[#23272E] dark:text-[#c1c6cf]">
                            {isAdmin ? 'Category Management' : 'Select & Add Products'}
                        </span>
                        {isAdmin && (
                            <button
                                onClick={() => openModal('category')}
                                className="add-new-btn flex items-center gap-1 font-[14px] text-[#6467F2] tracking-[-0.02em]"
                            >
                                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="10" cy="10" r="7.5" stroke="#6467F2" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M7.5 10H12.5" stroke="#6467F2" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M10 7.5V12.5" stroke="#6467F2" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="text-[14px]!">Add New</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Two-Section Layout: Categories (top) and SubCategories (bottom) */}
                <div className="flex flex-col flex-1 min-h-0 gap-0 px-5 pt-1 pb-2">
                    {/* Categories Section - Top Half */}
                    <div className="flex-1 flex flex-col min-h-0 pb-3 border-b border-gray-200 dark:border-gray-800">
                        <div className="section-label text-[#6A717F] text-[13px] tracking-[-0.02em] mb-2 font-semibold">Categories</div>
                        <div className="categories-list flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                            {isLoading ? (
                                <div className="text-center py-4 text-[#6A717F]">Loading...</div>
                            ) : categories.length > 0 ? (
                                categories.map((cat) => (
                                    <div
                                        onClick={() => handleCategoryClick(cat.id)}
                                        className={`category-card flex items-center gap-2 p-2 rounded-lg w-full mb-2 cursor-pointer transition-colors ${selectedCategoryId === cat.id
                                            ? 'bg-[#E8F3ED] dark:bg-gray-800 border border-[#4EA674]'
                                            : 'bg-[#FFFFFF] dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
                                            }`}
                                        key={cat.id}
                                    >
                                        <div className="w-10 flex items-center justify-center h-10 bg-[#f7f7fa] dark:bg-gray-800 rounded-sm flex-shrink-0">
                                            <img src={cat.img} alt={cat.name} className="w-6 h-6" />
                                        </div>
                                        <span className="category-name text-[12px] text-[#23272E] dark:text-[#c1c6cf] truncate flex-1">{cat.name}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-[#6A717F]">No categories</div>
                            )}
                        </div>
                        <div
                            onClick={() => navigate('/categories')}
                            className="see-more text-[#6467F2] text-[12px] flex justify-center mt-1 cursor-pointer tracking-[-0.02em] hover:underline"
                        >
                            See more
                        </div>
                    </div>

                    {/* SubCategories Section - Bottom Half */}
                    <div className="flex-1 flex flex-col min-h-0 pt-3">
                        <div className="section-label text-[#6A717F] text-[13px] tracking-[-0.02em] mb-2 font-semibold">SubCategories</div>
                        <div className="subcategories-list flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                            {isLoading ? (
                                <div className="text-center py-4 text-[#6A717F]">Loading...</div>
                            ) : filteredSubCategories.length > 0 ? (
                                filteredSubCategories.map((subCat) => (
                                    <div
                                        className="subcategory-card flex items-center justify-between p-2 bg-[#FFFFFF] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg w-full mb-2 hover:shadow-sm transition-shadow"
                                        key={subCat.id}
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="w-10 flex items-center justify-center h-10 bg-[#f7f7fa] dark:bg-gray-800 rounded-sm flex-shrink-0">
                                                <img src={subCat.parentImg} alt={subCat.parentName} className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="subcategory-name text-[12px] text-[#23272E] dark:text-[#c1c6cf] truncate">{subCat.name}</div>
                                            </div>
                                        </div>
                                        {!isAdmin && (
                                            <button
                                                onClick={() => handleAddProduct(subCat.id, subCat.parentId)}
                                                className="add-btn bg-[#4EA674] rounded-full min-w-[62px] min-h-[28px] flex items-center justify-center text-[12px] text-[#FFFFFF] pl-2 pr-3 gap-1"
                                                title="Add product"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="10" cy="10" r="7.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M7.5 10H12.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M10 7.5V12.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg> Add
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-[#6A717F] text-[12px]">
                                    {selectedCategoryId ? 'No subcategories for this category' : 'No subcategories available'}
                                </div>
                            )}
                        </div>
                        <div
                            onClick={() => navigate('/categories')}
                            className="see-more text-[#6467F2] text-[12px] flex justify-center mt-1 cursor-pointer tracking-[-0.02em] hover:underline"
                        >
                            See more
                        </div>
                    </div>
                </div>
            </div>

            {/* Category/Subcategory Modal */}
            {isAdmin && isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-gray-500/10 backdrop-blur-xs dark:backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-md bg-white p-6 shadow-lg dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg text-slate-900 dark:text-slate-100 font-semibold">
                                Add {modalEntity === 'category' ? 'Category' : 'Subcategory'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-4 grid gap-4">
                            {modalEntity === 'category' ? (
                                <>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
                                            Category Name
                                        </label>
                                        <input
                                            type="text"
                                            value={catName}
                                            onChange={(e) => setCatName(e.target.value)}
                                            placeholder="Enter category name"
                                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-950 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
                                            Category Image
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCategoryImageChange}
                                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
                                        />
                                        {catPreview && (
                                            <img
                                                src={catPreview}
                                                alt="Preview"
                                                className="mt-2 h-28 w-28 rounded-md object-cover"
                                            />
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
                                            Parent Category
                                        </label>
                                        <select
                                            value={subCatParentId}
                                            onChange={(e) => setSubCatParentId(e.target.value)}
                                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-950 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
                                            Subcategory Name
                                        </label>
                                        <input
                                            type="text"
                                            value={subCatName}
                                            onChange={(e) => setSubCatName(e.target.value)}
                                            placeholder="Enter subcategory name"
                                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-950 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={closeModal}
                                className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={modalEntity === 'category' ? handleCreateCategory : handleCreateSubCategory}
                                disabled={isSubmitting}
                                className="rounded-md bg-[#4EA674] px-3 py-2 text-sm font-semibold text-white hover:bg-[#409162] disabled:opacity-60"
                            >
                                {isSubmitting ? 'Creating...' : 'Create'}
                            </button>
                        </div>

                        {isAdmin && modalEntity === 'category' && (
                            <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                                <button
                                    onClick={() => openModal('subcategory')}
                                    className="w-full rounded-md border border-[#6467F2] px-3 py-2 text-sm font-medium text-[#6467F2] hover:bg-[#6467F2]/10"
                                >
                                    Add Subcategory Instead
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default AddProductSidebar;
