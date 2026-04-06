import React from 'react';
import { FiMoreVertical, FiPlusCircle, FiSearch, FiSliders } from 'react-icons/fi';
import { useCategories } from '../../../Context/categories/useCategories';

const CategoriesFilters = () => {
    const { tabs, activeTab, setActiveTab, searchText, setSearchText } = useCategories();

    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex rounded-lg bg-[#EAF8E7] p-1 text-sm font-medium text-slate-600">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.label;

                    return (
                        <button
                            key={tab.label}
                            className={`rounded-md px-3 py-1.5 transition ${isActive ? 'bg-white text-[#4EA674] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab(tab.label)}
                        >
                            {tab.label}
                            {tab.count ? ` (${tab.count})` : ''}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                <label className="flex min-w-70 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-gray-950 dark:text-slate-400">
                    <FiSearch className="shrink-0" />
                    <input
                        type="text"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="Search your product"
                        className="w-full bg-transparent outline-none placeholder:text-slate-400"
                    />
                </label>

                <button className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:hover:bg-gray-900">
                    <FiSliders />
                </button>

                <button className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:hover:bg-gray-900">
                    <FiPlusCircle />
                </button>

                <button className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:hover:bg-gray-900">
                    <FiMoreVertical />
                </button>
            </div>
        </div>
    );
};

export default CategoriesFilters;
