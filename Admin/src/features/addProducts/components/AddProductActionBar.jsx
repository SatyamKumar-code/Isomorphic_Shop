import React from 'react';
import { FiPlus, FiSave, FiSearch } from 'react-icons/fi';
import { useAddProduct } from '../../../Context/addProduct/useAddProduct';

const AddProductActionBar = () => {
    const { formData, onSearchChange, publishProduct, saveDraft, createNewDraft, isSubmitting, submitButtonLabel } = useAddProduct();

    return (
        <div className="flex w-full flex-wrap items-center justify-end gap-2.5 lg:w-auto lg:flex-nowrap">
            <div className="relative w-full sm:max-w-75 lg:w-75 bg-[#e7e8e8] dark:bg-[#f7fafa52] focus:outline-none rounded-lg">
                <input
                    type="text"
                    placeholder="Search product for add"
                    className="h-10 w-full border bg-transparent text-[#4B5563] dark:text-white pl-3 pr-9 text-[13px] outline-none placeholder:text-[#8b98a3] border-none"
                    value={formData.searchText}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
                <FiSearch className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8a95]" />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
                <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-[#4ea674] bg-[#4ea674] px-3.5 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={publishProduct}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : submitButtonLabel}
                </button>
                <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#dbe3e8] bg-white px-3.5 text-[13px] font-semibold text-[#33414b] disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={saveDraft}
                    disabled={isSubmitting}
                >
                    <FiSave />
                    <span>Save to draft</span>
                </button>
                <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#dbe3e8] bg-white text-[#33414b]"
                    aria-label="Create product"
                    onClick={createNewDraft}
                >
                    <FiPlus />
                </button>
            </div>
        </div>
    );
};

export default AddProductActionBar;
