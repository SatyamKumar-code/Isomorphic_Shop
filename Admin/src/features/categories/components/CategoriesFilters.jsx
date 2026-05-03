import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiMoreVertical, FiPlusCircle, FiSearch, FiSliders } from 'react-icons/fi';
import { useCategories } from '../../../Context/categories/useCategories';

const baseFilterOptions = [
    { label: 'Default', value: 'default' },
    { label: 'Subcategory A-Z', value: 'subcat-az' },
    { label: 'Subcategory Z-A', value: 'subcat-za' },
    { label: 'Products High to Low', value: 'products-desc' },
    { label: 'Products Low to High', value: 'products-asc' },
];

const categoryFilterOptions = [
    { label: 'Default', value: 'default' },
    { label: 'Category A-Z', value: 'category-az' },
    { label: 'Category Z-A', value: 'category-za' },
    { label: 'Subcategory A-Z', value: 'subcat-az' },
    { label: 'Subcategory Z-A', value: 'subcat-za' },
    { label: 'Products High to Low', value: 'products-desc' },
    { label: 'Products Low to High', value: 'products-asc' },
];

const CategoriesFilters = ({ onAddSubcategory, onUpdateCategory, onUpdateSubcategory, selectedCategory = null, activeFilter = 'default', onFilterChange, pageSize = 10, setPageSize, setCurrentPage }) => {
    const { searchText, setSearchText } = useCategories();
    const [menuOpen, setMenuOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const menuRef = useRef(null);
    const filterRef = useRef(null);
    const filterOptions = selectedCategory ? baseFilterOptions : categoryFilterOptions;

    const activeFilterLabel = useMemo(
        () => filterOptions.find((option) => option.value === activeFilter)?.label || 'Default',
        [activeFilter, filterOptions],
    );

    const searchPlaceholder = selectedCategory ? 'Search subcategory or products' : 'Search category, subcategory, or products';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }

            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setFilterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="mb-3 mt-1 inline-flex items-center justify-between gap-3">
                <h4 className="font-semibold text-slate-900 dark:text-slate-50">{selectedCategory ? `Subcategories for: ${selectedCategory?.name}` : 'All Subcategories'}</h4>
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                <label className="flex min-w-70 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-gray-950 dark:text-slate-400">
                    <FiSearch className="shrink-0" />
                    <input
                        type="text"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full bg-transparent outline-none placeholder:text-slate-400"
                    />
                </label>

                <div ref={filterRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setFilterOpen((prev) => !prev)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:hover:bg-gray-900"
                        aria-label="Filter table rows"
                        title={activeFilterLabel}
                    >
                        <FiSliders />
                    </button>

                    {filterOpen ? (
                        <div className="absolute right-0 top-12 z-40 w-60 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950">
                            {filterOptions.map((option) => {
                                const isActive = option.value === activeFilter;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onFilterChange?.(option.value);
                                            setFilterOpen(false);
                                        }}
                                        className={`block w-full px-4 py-3 text-left text-sm transition ${isActive ? 'bg-emerald-50 text-[#4EA674] dark:bg-emerald-950 dark:text-emerald-200' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900'}`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}
                </div>

                <button type="button" onClick={() => onAddSubcategory?.()} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:hover:bg-gray-900" aria-label="Add subcategory" title="Add Subcategory">
                    <FiPlusCircle />
                </button>

                <div ref={menuRef} className="relative">
                    <button type="button" onClick={() => setMenuOpen((prev) => !prev)} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:hover:bg-gray-900" aria-label="More actions" title="More Actions">
                        <FiMoreVertical />
                    </button>

                    {menuOpen ? (
                        <div className="absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950">
                            <div className="border-b px-4 py-2 text-xs text-slate-500 dark:text-slate-400">Rows per page</div>
                            <div className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                    {[10, 20, 30, 50].map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => {
                                                setPageSize?.(size);
                                                setCurrentPage?.(1);
                                                setMenuOpen(false);
                                            }}
                                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${pageSize === size ? 'bg-[#EAF8E7] text-[#2f7f50]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-900 dark:text-slate-300'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onUpdateCategory?.();
                                        setMenuOpen(false);
                                    }}
                                    className="block w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                                >
                                    Update Category
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onUpdateSubcategory?.();
                                        setMenuOpen(false);
                                    }}
                                    className="block w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                                >
                                    Update Sub Category
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default CategoriesFilters;
