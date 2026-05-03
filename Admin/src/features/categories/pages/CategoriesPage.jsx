import React, { useEffect, useMemo, useState } from 'react';
import { useCategories } from '../../../Context/categories/useCategories';
import CategoriesDiscover from '../components/CategoriesDiscover';
import CategoriesFilters from '../components/CategoriesFilters';
import CategoriesHeader from '../components/CategoriesHeader';
import CategoriesPagination from '../components/CategoriesPagination';
import { createCategory, createSubCategory, getAllSubCategories, deleteSubCategory, uploadCategoryImages, updateCategory, updateSubCategory, deleteCategory } from '../CategoriesAPI';
import CategoriesAddModal from '../components/CategoriesAddModal';

const CategoriesPage = () => {
    const { discoverCategories, reloadCategoriesData, searchText } = useCategories();

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [subCategories, setSubCategories] = useState([]);
    const [loadingSubs, setLoadingSubs] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialEditSubCategoryId, setInitialEditSubCategoryId] = useState('');
    const [modalMode, setModalMode] = useState('add');
    const [modalEntity, setModalEntity] = useState('category');
    const [subCategoryFilter, setSubCategoryFilter] = useState('default');

    const openAddCategoryModal = () => {
        setModalMode('add');
        setModalEntity('category');
        setInitialEditSubCategoryId('');
        setIsModalOpen(true);
    };

    const openAddSubcategoryModal = () => {
        setModalMode('add');
        setModalEntity('subcategory');
        setIsModalOpen(true);
    };

    const openUpdateCategoryModal = () => {
        setModalMode('update');
        setModalEntity('category');
        if (!selectedCategory && discoverCategories.length > 0) {
            setSelectedCategory(discoverCategories[0]);
        }

        setInitialEditSubCategoryId('');
        setIsModalOpen(true);
    };

    const openUpdateSubCategoryModal = () => {
        setModalMode('update');
        setModalEntity('subcategory');
        setInitialEditSubCategoryId(subCategories?.[0]?._id || '');
        setIsModalOpen(true);
    };

    useEffect(() => {
        const load = async () => {
            try {
                setLoadingSubs(true);
                const res = await getAllSubCategories(selectedCategory?.id || '', currentPage, pageSize, searchText);
                const items = res?.data?.subCategories || [];
                setSubCategories(items);
                setTotalPages(res?.data?.totalPages || 1);
            } catch (err) {
                setSubCategories([]);
            } finally {
                setLoadingSubs(false);
            }
        };

        load();
    }, [selectedCategory, currentPage, pageSize, searchText]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchText]);

    const handleAddCategory = async (catName, catImage) => {
        if (!catName || !catName.trim()) return;
        try {
            if (catImage) {
                const formData = new FormData();
                formData.append('images', catImage);
                await uploadCategoryImages(formData);
            }

            await createCategory({ catName: catName.trim() });
            reloadCategoriesData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddSubcategory = async (subName, categoryId) => {
        if (!subName || !subName.trim() || !categoryId) return;
        try {
            await createSubCategory({ subCatName: subName.trim(), categoryId });
            const res = await getAllSubCategories(selectedCategory?.id || '');
            setSubCategories(res?.data?.subCategories || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateCategory = async (categoryId, catName, catImage) => {
        try {
            let imageUrl;

            if (catImage) {
                const formData = new FormData();
                formData.append('images', catImage);
                const uploadResponse = await uploadCategoryImages(formData);
                imageUrl = uploadResponse?.data?.images?.[0];
            }

            await updateCategory(categoryId, {
                catName,
                ...(imageUrl ? { image: imageUrl } : {}),
            });
            reloadCategoriesData();
            if (selectedCategory?.id === categoryId) {
                setSelectedCategory((prev) => prev ? { ...prev, name: catName, ...(imageUrl ? { image: imageUrl } : {}) } : prev);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateSubcategory = async (subCategoryId, subCatName, categoryId) => {
        try {
            await updateSubCategory(subCategoryId, { subCatName, categoryId });
            const res = await getAllSubCategories(selectedCategory?.id || '');
            setSubCategories(res?.data?.subCategories || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteSub = async (id) => {
        try {
            await deleteSubCategory(id);
            setSubCategories((prev) => prev.filter((s) => s._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        const confirmed = window.confirm('Are you sure you want to delete this category? All its subcategories will also be deleted.');
        if (!confirmed) return;

        try {
            await deleteCategory(categoryId);
            if (selectedCategory?.id === categoryId) {
                setSelectedCategory(null);
            }
            reloadCategoriesData();
        } catch (err) {
            console.error(err);
        }
    };

    const visibleSubCategories = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        const items = [...subCategories].filter((item) => {
            if (!query) {
                return true;
            }

            return [item.subCatName, item.category?.catName, item.productCount ?? 0]
                .map((value) => String(value ?? '').toLowerCase())
                .some((value) => value.includes(query));
        });

        const compareText = (left, right, key) => {
            return String(left?.[key] || '').localeCompare(String(right?.[key] || ''));
        };

        switch (subCategoryFilter) {
            case 'category-az':
                return items.sort((left, right) => compareText(left.category, right.category, 'catName') || compareText(left, right, 'subCatName'));
            case 'category-za':
                return items.sort((left, right) => compareText(right.category, left.category, 'catName') || compareText(right, left, 'subCatName'));
            case 'subcat-az':
                return items.sort((left, right) => compareText(left, right, 'subCatName'));
            case 'subcat-za':
                return items.sort((left, right) => compareText(right, left, 'subCatName'));
            case 'products-desc':
                return items.sort((left, right) => Number(right.productCount || 0) - Number(left.productCount || 0) || compareText(left, right, 'subCatName'));
            case 'products-asc':
                return items.sort((left, right) => Number(left.productCount || 0) - Number(right.productCount || 0) || compareText(left, right, 'subCatName'));
            default:
                return items.sort((left, right) => compareText(left, right, 'subCatName'));
        }
    }, [subCategories, subCategoryFilter, searchText]);

    return (
        <div className="w-full h-screen overflow-x-auto scrollbarNone px-5 pb-6 pt-4">
            <CategoriesHeader
                onOpenAddCategory={openAddCategoryModal}
            />

            <CategoriesAddModal
                open={isModalOpen}
                mode={modalMode}
                entity={modalEntity}
                onClose={() => {
                    setIsModalOpen(false);
                    setInitialEditSubCategoryId('');
                }}
                onCreateCategory={handleAddCategory}
                onCreateSubcategory={handleAddSubcategory}
                onUpdateCategory={handleUpdateCategory}
                onUpdateSubcategory={handleUpdateSubcategory}
                discoverCategories={discoverCategories}
                subCategories={subCategories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                initialEditSubCategoryId={initialEditSubCategoryId}
            />

            <CategoriesDiscover selectedCategory={selectedCategory} onSelect={(cat) => setSelectedCategory(cat)} onDeleteCategory={handleDeleteCategory} />

            <div className="rounded-lg bg-white p-4 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:bg-gray-950 dark:inset-shadow-gray-700 dark:shadow-gray-700">
                <CategoriesFilters
                    onAddSubcategory={openAddSubcategoryModal}
                    onUpdateCategory={openUpdateCategoryModal}
                    onUpdateSubcategory={openUpdateSubCategoryModal}
                    selectedCategory={selectedCategory}
                    activeFilter={subCategoryFilter}
                    onFilterChange={setSubCategoryFilter}
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                    setCurrentPage={setCurrentPage}
                />

                {selectedCategory ? (
                    <div>
                        {loadingSubs ? (
                            <p>Loading...</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className='text-slate-900 dark:text-slate-100'>
                                        <tr>
                                            <th className="px-4 py-2">#</th>
                                            <th className="px-4 py-2">Subcategory</th>
                                            <th className="px-4 py-2">Products</th>
                                            <th className="px-4 py-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleSubCategories.length === 0 && (
                                            <tr><td colSpan={4} className="px-4 py-4">No subcategories found.</td></tr>
                                        )}
                                        {visibleSubCategories.map((s, idx) => {
                                            const perPageIndex = (currentPage - 1) * pageSize + idx + 1;
                                            return (
                                                <tr key={s._id} className="border-t text-slate-700 dark:text-slate-300">
                                                    <td className="px-4 py-3">{perPageIndex}</td>
                                                    <td className="px-4 py-3">{s.subCatName}</td>
                                                    <td className="px-4 py-3">{s.productCount ?? 0}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <button onClick={() => { setModalMode('update'); setModalEntity('subcategory'); setInitialEditSubCategoryId(s._id); setIsModalOpen(true); }} className="text-amber-600">Edit</button>
                                                            <button onClick={() => handleDeleteSub(s._id)} className="text-red-600">Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <CategoriesPagination currentPage={currentPage} setCurrentPage={setCurrentPage} pagination={Array.from({ length: totalPages }, (_, i) => i + 1)} totalPages={totalPages} />
                    </div>
                ) : (
                    <div>
                        {loadingSubs ? (
                            <p>Loading...</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className='text-slate-900 dark:text-slate-100'>
                                        <tr>
                                            <th className="px-4 py-2">#</th>
                                            <th className="px-4 py-2">Category</th>
                                            <th className="px-4 py-2">Subcategory</th>
                                            <th className="px-4 py-2">Products</th>
                                            <th className="px-4 py-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleSubCategories.length === 0 && (
                                            <tr><td colSpan={5} className="px-4 py-4">No subcategories found.</td></tr>
                                        )}
                                        {visibleSubCategories.map((s, idx) => {
                                            const perPageIndex = (currentPage - 1) * pageSize + idx + 1;
                                            return (
                                                <tr key={s._id} className="border-t text-slate-700 dark:text-slate-300">
                                                    <td className="px-4 py-3">{perPageIndex}</td>
                                                    <td className="px-4 py-3">{s.category?.catName || '-'}</td>
                                                    <td className="px-4 py-3">{s.subCatName}</td>
                                                    <td className="px-4 py-3">{s.productCount ?? 0}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <button onClick={() => { setModalMode('update'); setModalEntity('subcategory'); setInitialEditSubCategoryId(s._id); setIsModalOpen(true); }} className="text-amber-600">Edit</button>
                                                            <button onClick={() => handleDeleteSub(s._id)} className="text-red-600">Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <CategoriesPagination currentPage={currentPage} setCurrentPage={setCurrentPage} pagination={Array.from({ length: totalPages }, (_, i) => i + 1)} totalPages={totalPages} />
                    </div>
                )}

            </div>
        </div>
    );
};

export default CategoriesPage;
