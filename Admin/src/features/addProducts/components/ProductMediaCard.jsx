import React from 'react';
import { FiImage, FiRefreshCcw, FiTrash2 } from 'react-icons/fi';
import { useAddProduct } from '../../../Context/addproduct/useAddProduct';



const Fiplus = <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="7.5" stroke="#4ea674" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="10" cy="10" r="7.5" stroke="#4ea674" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M7.5 10H12.5" stroke="#4ea674" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M7.5 10H12.5" stroke="#4ea674" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M10 7.5V12.5" stroke="#4ea674" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M10 7.5V12.5" stroke="#4ea674" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
</svg>

const colors = ['#DCECCF', '#E9D5D8', '#D8DEE2', '#E8DFC3', '#4F5358'];

const ProductMediaCard = () => {
    const {
        formData,
        categories,
        subCategories,
        uploadedImages,
        isLoadingCategories,
        isUploadingImage,
        updateField,
        onCategoryChange,
        uploadImage,
        uploadMultipleImages,
        replaceFirstImage,
        removeUploadedImage,
        reorderUploadedImages,
    } = useAddProduct();

    const browseInputRef = React.useRef(null);
    const replaceInputRef = React.useRef(null);
    const addInputRef = React.useRef(null);
    const [dragIndex, setDragIndex] = React.useState(null);

    const mainImage = uploadedImages[0] || '';
    const labelClass = 'mb-1.5 inline-block text-[13px] font-bold text-slate-900 dark:text-slate-100';
    const inputClass = 'h-[42px] w-full rounded-lg border border-[#dde5ea] dark:border-gray-600 bg-white dark:bg-gray-950 px-3 text-[13px] text-slate-900 dark:text-slate-100 outline-none';
    const btnClass = 'inline-flex h-[34px] items-center justify-center gap-1.5 rounded-lg border border-[#dbe3e8] dark:border-gray-600 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100';

    return (
        <section className="p-3.5 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg">
            <h3 className="mb-3 text-[28px] font-bold leading-[1.1] text-slate-900 dark:text-slate-100 xl:text-[24px]">Upload Product Image</h3>

            <div className="mb-3">
                <label className={labelClass}>Product Image</label>
                <div className="relative rounded-lg h-66.5 border border-[#dde5ea] dark:border-gray-800 dark:bg-gray-950/10 p-3">
                    {mainImage ? (
                        <img src={mainImage} alt="Product" className="block h-full w-full object-contain" />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg text-xs text-[#8a98a5]">
                            <FiImage className="text-2xl" />
                            <span>No image selected</span>
                        </div>
                    )}
                    <div className=" absolute bottom-2 right-2 justify-between!">
                        <input
                            ref={replaceInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => replaceFirstImage(event.target.files?.[0])}
                        />
                        <button
                            type="button"
                            className={`${btnClass} h-9.5 disabled:cursor-not-allowed disabled:opacity-70`}
                            onClick={() => replaceInputRef.current?.click()}
                            disabled={isUploadingImage}
                        >
                            <FiRefreshCcw /> Replace
                        </button>
                    </div>
                </div>
            </div>

            {uploadedImages.length === 0 ? (
                <div className="mt-2.5">
                    <input
                        ref={addInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                            uploadMultipleImages(event.target.files);
                            event.target.value = '';
                        }}
                    />
                    <button
                        type="button"
                        className="inline-flex flex-col h-24.75 w-24.5 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#cfd9df] dark:border-gray-700 dark:bg-gray-950/10 bg-white text-xs font-semibold text-[#4ea674] disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={() => addInputRef.current?.click()}
                        disabled={isUploadingImage}
                    >

                        {Fiplus}
                        <span>{isUploadingImage ? 'Uploading...' : 'Add Image'}</span>
                    </button>
                </div>
            ) : (
                <div className="mt-2.5 flex flex-wrap items-start gap-2.5">
                    {uploadedImages.map((imageUrl, index) => (
                        <div
                            key={`${imageUrl}-${index}`}
                            draggable
                            onDragStart={() => setDragIndex(index)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => {
                                if (dragIndex === null) {
                                    return;
                                }
                                reorderUploadedImages(dragIndex, index);
                                setDragIndex(null);
                            }}
                            onDragEnd={() => setDragIndex(null)}
                            className={`group relative flex h-24.75 w-24.5 flex-none cursor-grab items-center justify-center overflow-hidden rounded-md border bg-white dark:bg-gray-950 ${dragIndex === index ? 'border-[#4ea674] ring-1 ring-[#4ea674]' : 'border-[#dde5ea] dark:border-gray-600'}`}
                        >
                            <img src={imageUrl} alt={`Preview ${index + 1}`} className="h-24.5 w-24.5 object-contain" />
                            <button
                                type="button"
                                className="absolute right-1 top-1 inline-flex h-5.5 w-5.5 items-center justify-center rounded-full bg-white dark:bg-gray-800 text-[#7b8790] dark:text-gray-400 shadow-sm"
                                onClick={() => removeUploadedImage(imageUrl)}
                                aria-label={`Remove image ${index + 1}`}
                            >
                                <FiTrash2 className="text-[11px]" />
                            </button>
                        </div>
                    ))}
                    <input
                        ref={addInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                            uploadMultipleImages(event.target.files);
                            event.target.value = '';
                        }}
                    />
                    <button
                        type="button"
                        className="inline-flex flex-col h-24.75 w-24.5 flex-none cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#cfd9df] dark:border-gray-700 dark:bg-gray-950/10 bg-white text-xs font-semibold text-[#4ea674] disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={() => addInputRef.current?.click()}
                        disabled={isUploadingImage}
                    >
                        {Fiplus}
                        <span>{isUploadingImage ? 'Uploading...' : 'Add Image'}</span>

                    </button>
                </div>
            )}

            <h3 className="mb-2.5 mt-4 text-[28px] font-bold leading-[1.1] text-slate-900 dark:text-slate-100 xl:text-[24px]">Categories</h3>

            <div className="mb-3">
                <label className={labelClass} htmlFor="productCategory">Product Categories</label>
                <select
                    id="productCategory"
                    className={inputClass}
                    value={formData.category}
                    onChange={(event) => onCategoryChange(event.target.value)}
                    disabled={isLoadingCategories}
                >
                    <option value="">Select your product</option>
                    {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                            {category.catName}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-3">
                <label className={labelClass} htmlFor="productTag">Product Tag</label>
                <select
                    id="productTag"
                    className={inputClass}
                    value={formData.subCategory}
                    onChange={(event) => updateField('subCategory', event.target.value)}
                    disabled={!formData.category}
                >
                    <option value="">Select your product</option>
                    {subCategories.map((subCategory) => (
                        <option key={subCategory._id} value={subCategory._id}>
                            {subCategory.subCatName}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-1">
                <label className={labelClass}>Select your color</label>
                <div className="flex items-center gap-2">
                    {colors.map((color) => (
                        <button
                            key={color}
                            type="button"
                            className={`h-7.5 w-7.5 cursor-pointer rounded-md border ${formData.color === color ? 'border-[#111827] ring-1 ring-[#111827]' : 'border-[#d3dce2]'
                                }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Color ${color}`}
                            onClick={() => updateField('color', color)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProductMediaCard;
