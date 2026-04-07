import React from 'react';
import { FiTrash2 } from 'react-icons/fi';
import AddProductActionBar from '../components/AddProductActionBar';
import BasicDetailsCard from '../components/BasicDetailsCard';
import ProductMediaCard from '../components/ProductMediaCard';
import { useAddProduct } from '../../../Context/addproduct/useAddProduct';

const AddProductPage = () => {
    const { isLoadingCategories, drafts, activeDraftId, loadDraft, deleteDraft } = useAddProduct();

    return (
        <div className="w-full min-h-[calc(100vh-96px)] px-5 pb-6 pt-4">
            <div className="mb-3.5 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-[22px] font-bold leading-[1.2] text-slate-900 dark:text-slate-100">Add New Product</h2>
                <AddProductActionBar />
            </div>
            {isLoadingCategories ? <p className="mb-2.5 text-xs text-[#6f7d88]">Loading category data...</p> : null}

            {drafts.length > 0 && (
                <div className="mb-3.5 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg p-3">
                    <div className="mb-2.5 flex items-center justify-between">
                        <h3 className="m-0 text-sm text-[#1e3b49] dark:text-slate-100">Saved Drafts</h3>
                        <span className="inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-[#e8f3ed] text-xs font-bold text-[#2f6f4a] dark:text-green-400">{drafts.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {drafts.map((draft) => (
                            <div
                                key={draft.id}
                                className={`flex min-w-55 max-w-80 items-center rounded-lg border ${activeDraftId === draft.id ? 'border-[#4ea674] bg-[#edf7f1] dark:bg-gray-800' : 'border-[#dbe3e8] dark:border-gray-600 bg-[#f8fbfd] dark:bg-gray-950'
                                    }`}
                            >
                                <button
                                    type="button"
                                    className="flex w-full cursor-pointer flex-col gap-0.5 border-0 bg-transparent px-2.5 py-2 text-left"
                                    onClick={() => loadDraft(draft.id)}
                                >
                                    <strong className="text-xs text-[#203741] dark:text-slate-100">{draft.name || 'Untitled Draft'}</strong>
                                    <small className="text-[11px] text-[#6f7d88] dark:text-slate-500">{new Date(draft.savedAt).toLocaleString()}</small>
                                </button>

                                <button
                                    type="button"
                                    className="h-full w-9 hover:text-red-400 justify-items-center cursor-pointer border-0 border-l border-l-[#dbe3e8] dark:border-l-gray-600 bg-transparent text-[#7b8790]"
                                    onClick={() => deleteDraft(draft.id)}
                                    aria-label="Delete draft"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        ))}
                    </div>

                </div>
            )}

            <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[1.25fr_0.9fr]">
                <BasicDetailsCard />
                <ProductMediaCard />
            </div>
        </div>
    );
};

export default AddProductPage;
