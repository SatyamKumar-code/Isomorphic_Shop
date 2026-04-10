import React, { useEffect, useMemo, useRef } from 'react';
import { FiCalendar, FiEdit2, FiMoreHorizontal } from 'react-icons/fi';
import { useAddProduct } from '../../../Context/addProduct/useAddProduct';

const BasicDetailsCard = () => {
    const { formData, categories, subCategories, updateField, salePrice, saveDraft, publishProduct, isSubmitting, submitButtonLabel } = useAddProduct();
    const startDateInputRef = useRef(null);
    const endDateInputRef = useRef(null);
    const labelClass = 'mb-1.5 inline-block text-[13px] font-bold text-slate-900 dark:text-slate-100';
    const inputClass = 'h-[42px] w-full border border-[#dde5ea] dark:border-gray-600 bg-white dark:bg-gray-950 px-3 text-[13px] text-slate-900 dark:text-slate-100 outline-none rounded-lg';
    const btnBase = 'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3.5 text-[13px] font-semibold';

    const openDatePicker = (inputRef) => {
        const input = inputRef.current;
        if (!input) {
            return;
        }

        input.type = 'date';
        input.focus();

        if (typeof input.showPicker === 'function') {
            input.showPicker();
            return;
        }

        input.click();
    };

    const selectedCategory = useMemo(
        () => categories.find((category) => category._id === formData.category),
        [categories, formData.category],
    );

    const selectedSubCategory = useMemo(
        () => subCategories.find((subCategory) => subCategory._id === formData.subCategory),
        [subCategories, formData.subCategory],
    );

    const selectionText = `${selectedCategory?.catName || ''} ${selectedSubCategory?.subCatName || ''}`.toLowerCase();
    const hasKeyword = (keywords) => keywords.some((keyword) => selectionText.includes(keyword));

    const showRamRomFields = hasKeyword(['mobile', 'phone', 'smartphone', 'tab', 'tablet', 'laptop', 'notebook']);
    const showSizeField = hasKeyword(['cloth', 'clothing', 'fashion', 'shoe', 'footwear', 'apparel', 'wear', 'dress', 'shirt', 'jeans', 'kurta']);
    const showWeightField = hasKeyword(['grocery', 'food', 'rice', 'flour', 'atta', 'spice', 'oil', 'fruit', 'vegetable', 'milk', 'drink', 'beverage', 'snack']);

    useEffect(() => {
        if (!showRamRomFields && (formData.RAM || formData.ROM)) {
            updateField('RAM', '');
            updateField('ROM', '');
        }
    }, [formData.RAM, formData.ROM, showRamRomFields, updateField]);

    useEffect(() => {
        if (!showSizeField && formData.size) {
            updateField('size', '');
        }
    }, [formData.size, showSizeField, updateField]);

    useEffect(() => {
        if (!showWeightField && formData.weight) {
            updateField('weight', '');
        }
    }, [formData.weight, showWeightField, updateField]);

    return (
        <section className="p-3.5 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg">
            <h3 className="mb-3 text-[28px] font-bold leading-[1.1] text-slate-900 dark:text-slate-100 xl:text-[24px]">Basic Details</h3>

            <div className="mb-3">
                <label className={labelClass} htmlFor="productName">Product Name</label>
                <input
                    id="productName"
                    className={inputClass}
                    value={formData.productName}
                    onChange={(event) => updateField('productName', event.target.value)}
                />
            </div>

            <div className="mb-3">
                <label className={labelClass} htmlFor="productDescription">Product Description</label>
                <div className="rounded-lg border border-[#eef3f6] dark:border-gray-600 dark:bg-gray-950/10">
                    <textarea
                        id="productDescription"
                        className="min-h-24 w-full resize-none border-0 bg-transparent px-3 py-2.5 text-[13px] leading-[1.45] text-slate-900 dark:text-slate-100 outline-none"
                        value={formData.description}
                        onChange={(event) => updateField('description', event.target.value)}
                    />
                    <div className="flex h-7.5 items-center justify-end gap-2.5 border-t border-t-[#eef3f6] dark:border-t-gray-600 px-2.5 text-[#6f7d88]">
                        <FiEdit2 />
                        <FiMoreHorizontal />
                    </div>
                </div>
            </div>

            <h3 className="mb-2.5 mt-2 text-[28px] font-bold leading-[1.1] text-slate-900 dark:text-slate-100 xl:text-[24px]">Pricing</h3>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                <div className="mb-3 md:mb-0">
                    <label className={labelClass} htmlFor="productPrice">Product Price</label>
                    <div className="relative">
                        <input
                            id="productPrice"
                            type='number'
                            className={inputClass}
                            value={formData.price}
                            onChange={(event) => updateField('price', event.target.value)}
                        />
                        <button className="absolute right-1.5 top-1.5 h-7.5 min-w-11 rounded-md border border-[#dbe3e8] dark:border-gray-600 bg-white dark:bg-gray-950 text-xs font-bold text-[#5d6a74]" type="button">INR</button>
                    </div>
                </div>

                <div className="mb-3 md:mb-0">
                    <label className={labelClass} htmlFor="discountPrice">Discount Percentage (%) <span className="font-medium text-[#8696a2]">(Optional)</span></label>
                    <div className="flex h-10.5 items-center justify-between overflow-hidden rounded-lg border border-[#dde5ea] bg-[#f7fbf8] dark:bg-gray-950">
                        <div className="flex h-full items-center gap-1.5 px-2.5">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">%</span>
                            <input
                                id="discountPrice"
                                className="max-w-13.5 border-0 bg-transparent text-[13px] font-bold text-slate-900 dark:text-slate-100 outline-none"
                                value={formData.discountedPrice}
                                type="number"
                                min="0"
                                max="99"
                                step="1"
                                onChange={(event) => updateField('discountedPrice', event.target.value)}
                            />
                        </div>
                        <span className="px-2.5 text-xs font-bold text-slate-900 dark:text-slate-100">Sale= ₹{salePrice}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                <div className="mb-3 md:mb-0">
                    <label className={labelClass} htmlFor="expStart">Expiration</label>
                    <div className="relative">
                        <input
                            ref={startDateInputRef}
                            id="expStart"
                            className={`${inputClass} pr-9 appearance-none [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0`}
                            placeholder="Start"
                            type={formData.expirationStart ? 'date' : 'text'}
                            value={formData.expirationStart}
                            onChange={(event) => updateField('expirationStart', event.target.value)}
                            onFocus={(event) => {
                                event.target.type = 'date';
                            }}
                            onBlur={(event) => {
                                if (!event.target.value) {
                                    event.target.type = 'text';
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6f7d88]"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => openDatePicker(startDateInputRef)}
                            aria-label="Open start date calendar"
                        >
                            <FiCalendar />
                        </button>
                    </div>
                </div>

                <div className="mb-3 md:mb-0">
                    <label className={`${labelClass} invisible`} htmlFor="expEnd">End</label>
                    <div className="relative">
                        <input
                            ref={endDateInputRef}
                            id="expEnd"
                            className={`${inputClass} pr-9 appearance-none [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0`}
                            placeholder="End"
                            type={formData.expirationEnd ? 'date' : 'text'}
                            value={formData.expirationEnd}
                            onChange={(event) => updateField('expirationEnd', event.target.value)}
                            onFocus={(event) => {
                                event.target.type = 'date';
                            }}
                            onBlur={(event) => {
                                if (!event.target.value) {
                                    event.target.type = 'text';
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6f7d88]"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => openDatePicker(endDateInputRef)}
                            aria-label="Open end date calendar"
                        >
                            <FiCalendar />
                        </button>
                    </div>
                </div>
            </div>

            {(showRamRomFields || showSizeField || showWeightField) && (
                <>
                    <h3 className="mb-2.5 mt-2 text-[28px] font-bold leading-[1.1] text-slate-900 dark:text-slate-100 xl:text-[24px]">Specifications</h3>
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                        {showRamRomFields && (
                            <>
                                <div className="mb-3 md:mb-0">
                                    <label className={labelClass} htmlFor="productRam">RAM</label>
                                    <input
                                        id="productRam"
                                        className={inputClass}
                                        placeholder="e.g. 8 GB"
                                        value={formData.RAM}
                                        onChange={(event) => updateField('RAM', event.target.value)}
                                    />
                                </div>
                                <div className="mb-3 md:mb-0">
                                    <label className={labelClass} htmlFor="productRom">ROM</label>
                                    <input
                                        id="productRom"
                                        className={inputClass}
                                        placeholder="e.g. 128 GB"
                                        value={formData.ROM}
                                        onChange={(event) => updateField('ROM', event.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {showSizeField && (
                            <div className="mb-3 md:mb-0">
                                <label className={labelClass} htmlFor="productSize">Size</label>
                                <input
                                    id="productSize"
                                    className={inputClass}
                                    placeholder="e.g. M / L / XL"
                                    value={formData.size}
                                    onChange={(event) => updateField('size', event.target.value)}
                                />
                            </div>
                        )}

                        {showWeightField && (
                            <div className="mb-3 md:mb-0">
                                <label className={labelClass} htmlFor="productWeight">Weight</label>
                                <input
                                    id="productWeight"
                                    className={inputClass}
                                    placeholder="e.g. 1 kg"
                                    value={formData.weight}
                                    onChange={(event) => updateField('weight', event.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}

            <h3 className="mb-2.5 mt-2 text-[28px] font-bold leading-[1.1] text-slate-900 dark:text-slate-100 xl:text-[24px]">Inventory</h3>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                <div className="mb-3 md:mb-0">
                    <label className={labelClass} htmlFor="stockQuantity">Stock Quantity</label>
                    <input
                        id="stockQuantity"
                        className={`${inputClass} disabled:bg-[#f5f7f9] dark:disabled:bg-gray-800`}
                        value={formData.unlimitedStock ? 'Unlimited' : formData.stock}
                        onChange={(event) => updateField('stock', event.target.value)}
                        disabled={formData.unlimitedStock}
                    />
                </div>

                <div className="mb-3 md:mb-0">
                    <label className={labelClass} htmlFor="brandName">Brand Name</label>
                    <input
                        id="brandName"
                        className={inputClass}
                        placeholder="e.g. Nike, Apple, Samsung"
                        value={formData.brand}
                        onChange={(event) => updateField('brand', event.target.value)}
                    />
                </div>
            </div>

            <div className="mt-0.5 flex items-center gap-2">
                <button
                    type="button"
                    className={`relative h-4 w-7.5 rounded-[10px] ${formData.unlimitedStock ? 'bg-[#4ea674]' : 'bg-[#d5dce2] dark:bg-gray-700'}`}
                    onClick={() => updateField('unlimitedStock', !formData.unlimitedStock)}
                    aria-label="Toggle unlimited stock"
                >
                    <span
                        className={`absolute top-0.5 h-3 w-3 rounded-full bg-white dark:bg-gray-400 transition-all ${formData.unlimitedStock ? 'left-4' : 'left-0.5'}`}
                    />
                </button>
                <span className="text-[13px] text-slate-900 dark:text-slate-100">Unlimited</span>
            </div>

            <label className="mt-3 inline-flex items-center gap-2 text-[13px] text-slate-900 dark:text-slate-100">
                <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(event) => updateField('featured', event.target.checked)}
                />
                <span>Highlight this product in a featured section.</span>
            </label>

            <div className="mt-3.5 flex justify-end gap-2.5">
                <button
                    type="button"
                    className={`${btnBase} border-[#dbe3e8] dark:border-gray-600 dark:bg-gray-950/10 dark:hover:bg-gray-900 text-[#33414b] disabled:cursor-not-allowed disabled:opacity-70`}
                    onClick={saveDraft}
                    disabled={isSubmitting}
                >
                    Save to draft
                </button>

                <button
                    type="button"
                    className={`${btnBase} border-[#4ea674] dark:border-[#4ea674]  bg-[#4ea674] dark:hover:bg-[#4ea674]/90 text-white disabled:cursor-not-allowed disabled:opacity-70`}
                    onClick={publishProduct}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : submitButtonLabel}
                </button>
            </div>
        </section>
    );
};

export default BasicDetailsCard;
