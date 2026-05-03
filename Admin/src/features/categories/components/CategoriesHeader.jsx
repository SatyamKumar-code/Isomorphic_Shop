import React from 'react';
import { FiPlus } from 'react-icons/fi';

const CategoriesHeader = ({ onOpenAddCategory }) => {

    return (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-[22px] font-semibold text-slate-900 dark:text-slate-100">Discover</h3>

            <div className="flex items-center gap-3">
                <button onClick={() => onOpenAddCategory?.()} className="inline-flex items-center gap-2 rounded-md bg-[#4EA674] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#4EA674]/20 transition hover:bg-[#409162]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/70 text-xs">
                        <FiPlus />
                    </span>
                    Add Category
                </button>
            </div>
        </div>
    );
};

export default CategoriesHeader;
