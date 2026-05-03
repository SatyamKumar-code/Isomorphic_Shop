import React, { useEffect, useMemo, useState } from 'react';

const CategoriesAddModal = ({ open, mode = 'add', entity = 'category', onClose, onCreateCategory, onCreateSubcategory, onUpdateCategory, onUpdateSubcategory, discoverCategories, subCategories, selectedCategory, setSelectedCategory, initialEditSubCategoryId = '' }) => {
    const [catName, setCatName] = useState('');
    const [catImage, setCatImage] = useState(null);
    const [catPreview, setCatPreview] = useState('');
    const [editCatName, setEditCatName] = useState('');
    const [editCatImage, setEditCatImage] = useState(null);
    const [editCatPreview, setEditCatPreview] = useState('');
    const [subName, setSubName] = useState('');
    const [subCatId, setSubCatId] = useState(selectedCategory?.id || '');
    const [editSubCategoryId, setEditSubCategoryId] = useState('');
    const [editSubCategoryName, setEditSubCategoryName] = useState('');
    const [editSubCategoryParentId, setEditSubCategoryParentId] = useState(selectedCategory?.id || '');

    const selectedSubCategory = useMemo(
        () => subCategories?.find((item) => item._id === editSubCategoryId),
        [subCategories, editSubCategoryId],
    );

    const isCategoryEntity = entity === 'category';
    const isSubcategoryEntity = entity === 'subcategory';

    useEffect(() => {
        setEditCatName(selectedCategory?.name || '');
        setEditCatPreview(selectedCategory?.image || '');
        setEditCatImage(null);
    }, [selectedCategory, open]);

    useEffect(() => {
        if (open) {
            setEditSubCategoryId(initialEditSubCategoryId || '');
        }
    }, [initialEditSubCategoryId, open]);

    useEffect(() => {
        if (!open) return;

        if (entity === 'category') {
            setSubName('');
            setSubCatId(selectedCategory?.id || '');
        }

        if (entity === 'subcategory') {
            setCatName('');
            setCatImage(null);
            setCatPreview('');
        }
    }, [entity, open, selectedCategory]);

    useEffect(() => {
        if (!selectedSubCategory) {
            setEditSubCategoryName('');
            setEditSubCategoryParentId(selectedCategory?.id || '');
            return;
        }

        setEditSubCategoryName(selectedSubCategory.subCatName || '');
        setEditSubCategoryParentId(selectedSubCategory.categoryId?._id || selectedSubCategory.categoryId || selectedCategory?.id || '');
    }, [selectedSubCategory, selectedCategory]);

    if (!open) return null;

    const handleCreateCat = async () => {
        if (!catName.trim()) return;
        await onCreateCategory(catName.trim(), catImage);
        setCatName('');
        setCatImage(null);
        setCatPreview('');
        onClose?.();
    };

    const handleCreateSub = async () => {
        const targetCategoryId = subCatId || selectedCategory?.id;
        if (!subName.trim() || !targetCategoryId) return;
        await onCreateSubcategory(subName.trim(), targetCategoryId);
        setSubName('');
        onClose?.();
    };

    const handleUpdateCat = async () => {
        if (!selectedCategory || !editCatName.trim()) return;
        await onUpdateCategory(selectedCategory.id, editCatName.trim(), editCatImage);
        setEditCatImage(null);
        onClose?.();
    };

    const handleUpdateSub = async () => {
        if (!selectedSubCategory || !editSubCategoryName.trim() || !editSubCategoryParentId) return;
        await onUpdateSubcategory(selectedSubCategory._id, editSubCategoryName.trim(), editSubCategoryParentId);
        onClose?.();
    };

    const isAddMode = mode === 'add';
    const isUpdateMode = mode === 'update';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-gray-500/10 backdrop-blur-xs dark:backdrop-blur-xs">
            <div className="w-full max-w-2xl rounded-md bg-white p-6 shadow-lg dark:bg-gray-900">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg text-slate-900 dark:text-slate-100 font-semibold">{isAddMode ? 'Add Category / Subcategory' : 'Update Category / Subcategory'}</h3>
                    <button onClick={onClose} className="text-slate-500 text-slate-700 dark:text-slate-300">Close</button>
                </div>

                <div className="mt-4 grid gap-4">
                    {isAddMode && isCategoryEntity ? (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">New Category</label>
                            <div className="grid gap-2">
                                <input type="file" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setCatImage(file);
                                    setCatPreview(file ? URL.createObjectURL(file) : '');
                                }} className="rounded-md border text-slate-900 dark:text-slate-100 px-3 py-2" />
                                {catPreview ? (
                                    <img src={catPreview} alt="Category preview" className="h-28 w-28 rounded-md object-cover" />
                                ) : null}
                                <div className="flex gap-2">
                                    <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Category name" className="flex-1 rounded-md border px-3 py-2 text-slate-900 dark:text-slate-100" />
                                    <button onClick={handleCreateCat} className="rounded-md bg-blue-600 px-4 py-2 text-white">Create</button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {isAddMode && isSubcategoryEntity ? (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">New Subcategory</label>
                            <div className="flex gap-2">
                                <select value={subCatId} onChange={(e) => { setSubCatId(e.target.value); const chosen = discoverCategories.find(c => c.id === e.target.value); chosen && setSelectedCategory?.(chosen); }} className="rounded-md bg-white dark:bg-gray-900 border text-slate-900 dark:text-slate-100 px-3 py-2">
                                    <option value="">Select category</option>
                                    {discoverCategories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <input value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="Subcategory name" className="flex-1 rounded-md border text-slate-900 dark:text-slate-100 px-3 py-2" />
                                <button onClick={handleCreateSub} className="rounded-md bg-green-600 px-4 py-2 text-white">Create</button>
                            </div>
                        </div>
                    ) : null}

                    {isUpdateMode && isCategoryEntity ? (
                        <div className="rounded-md border border-dashed border-slate-300 p-3 dark:border-slate-700">
                            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">Update Category</label>
                            <div className="grid gap-2">
                                <input type="file" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setEditCatImage(file);
                                    setEditCatPreview(file ? URL.createObjectURL(file) : selectedCategory?.image || '');
                                }} className="rounded-md border text-slate-900 dark:text-slate-100 px-3 py-2" />
                                {editCatPreview ? (
                                    <img src={editCatPreview} alt="Category edit preview" className="h-28 w-28 rounded-md object-cover" />
                                ) : null}
                                <div className="flex gap-2">
                                    <input value={editCatName} onChange={(e) => setEditCatName(e.target.value)} placeholder="Edit category name" className="flex-1 rounded-md border text-slate-900 dark:text-slate-100 px-3 py-2" />
                                    <button onClick={handleUpdateCat} disabled={!selectedCategory} className="rounded-md bg-amber-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50">Update</button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {isUpdateMode && isSubcategoryEntity ? (
                        <div className="rounded-md border border-dashed border-slate-300 p-3 dark:border-slate-700">
                            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">Update Subcategory</label>
                            <div className="grid gap-2">
                                <select value={editSubCategoryId} onChange={(e) => setEditSubCategoryId(e.target.value)} className="rounded-md border bg-white dark:bg-gray-900 text-slate-900 dark:text-slate-100 px-3 py-2">
                                    <option value="">Select subcategory</option>
                                    {subCategories?.map((item) => (
                                        <option key={item._id} value={item._id}>{item.subCatName}</option>
                                    ))}
                                </select>
                                <div className="flex gap-2">
                                    <select value={editSubCategoryParentId} onChange={(e) => setEditSubCategoryParentId(e.target.value)} className="rounded-md border bg-white dark:bg-gray-900 text-slate-900 dark:text-slate-100 px-3 py-2">
                                        <option value="">Select category</option>
                                        {discoverCategories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <input value={editSubCategoryName} onChange={(e) => setEditSubCategoryName(e.target.value)} placeholder="Edit subcategory name" className="flex-1 rounded-md border text-slate-900 dark:text-slate-100 px-3 py-2" />
                                    <button onClick={handleUpdateSub} disabled={!selectedSubCategory} className="rounded-md bg-amber-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50">Update</button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default CategoriesAddModal;
