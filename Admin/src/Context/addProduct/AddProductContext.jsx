import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    createAddProduct,
    getAddProductCategories,
    getAddProductSubCategories,
    removeAddProductImage,
    uploadAddProductImage,
} from '../../features/addProducts/AddProductAPI';

export const AddProductContext = createContext();

const DRAFTS_STORAGE_KEY = 'addProductDrafts';
const LEGACY_DRAFT_KEY = 'addProductDraft';

const defaultFormData = {
    productName: '',
    description: '',
    price: '',
    discountedPrice: '',
    taxIncluded: false,
    expirationStart: '',
    expirationEnd: '',
    stock: '',
    stockStatus: '',
    unlimitedStock: false,
    featured: false,
    category: '',
    subCategory: '',
    color: '',
    searchText: '',
};

const getStoredDrafts = () => {
    try {
        const storedDrafts = JSON.parse(localStorage.getItem(DRAFTS_STORAGE_KEY));
        if (Array.isArray(storedDrafts)) {
            return storedDrafts;
        }

        const legacy = JSON.parse(localStorage.getItem(LEGACY_DRAFT_KEY));
        if (legacy?.formData) {
            return [
                {
                    id: `${Date.now()}`,
                    name: legacy?.formData?.productName || 'Untitled Draft',
                    savedAt: new Date().toISOString(),
                    formData: legacy.formData,
                    uploadedImages: Array.isArray(legacy.uploadedImages) ? legacy.uploadedImages : [],
                },
            ];
        }

        return [];
    } catch (error) {
        return [];
    }
};

export const AddProductProvider = ({ children }) => {
    const [formData, setFormData] = useState(defaultFormData);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [drafts, setDrafts] = useState(getStoredDrafts());
    const [activeDraftId, setActiveDraftId] = useState(null);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const persistDrafts = useCallback((nextDrafts) => {
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts));
        localStorage.removeItem(LEGACY_DRAFT_KEY);
        setDrafts(nextDrafts);
    }, []);

    const loadCategories = useCallback(async () => {
        try {
            setIsLoadingCategories(true);
            const response = await getAddProductCategories();
            const data = response?.data?.categories;

            if (Array.isArray(data)) {
                setCategories(data);
            } else {
                setCategories([]);
            }
        } catch (error) {
            setCategories([]);
            toast.error(error?.response?.data?.message || 'Failed to load categories');
        } finally {
            setIsLoadingCategories(false);
        }
    }, []);

    const loadSubCategories = useCallback(async (categoryId) => {
        if (!categoryId) {
            setSubCategories([]);
            return;
        }

        try {
            const response = await getAddProductSubCategories(categoryId);
            const data = response?.data?.subCategories;
            setSubCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            setSubCategories([]);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    useEffect(() => {
        if (formData.category) {
            loadSubCategories(formData.category);
        }
    }, [formData.category, loadSubCategories]);

    const updateField = useCallback((field, value) => {
        if (field === 'discountedPrice') {
            if (value === '') {
                setFormData((prev) => ({ ...prev, discountedPrice: '' }));
                return;
            }

            const numericValue = Number(value);
            if (Number.isNaN(numericValue)) {
                return;
            }

            const clampedValue = Math.min(Math.max(numericValue, 0), 99);
            setFormData((prev) => ({ ...prev, discountedPrice: String(clampedValue) }));
            return;
        }

        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const onCategoryChange = useCallback(
        async (value) => {
            setFormData((prev) => ({ ...prev, category: value, subCategory: '' }));
            await loadSubCategories(value);
        },
        [loadSubCategories],
    );

    const onSearchChange = useCallback((value) => {
        setFormData((prev) => ({ ...prev, searchText: value }));
    }, []);

    const uploadImage = useCallback(async (file) => {
        if (!file) {
            return;
        }

        const form = new FormData();
        form.append('image', file);

        try {
            setIsUploadingImage(true);
            const response = await uploadAddProductImage(form);
            const imageUrls = response?.data?.images;

            if (Array.isArray(imageUrls) && imageUrls.length) {
                setUploadedImages((prev) => [...prev, ...imageUrls]);
                toast.success('Image uploaded');
                return;
            }

            toast.error('Image upload failed');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Image upload failed');
        } finally {
            setIsUploadingImage(false);
        }
    }, []);

    const uploadMultipleImages = useCallback(async (files) => {
        const fileList = Array.from(files || []).filter(Boolean);
        if (!fileList.length) {
            return;
        }

        try {
            setIsUploadingImage(true);
            const uploadedUrls = [];

            for (const file of fileList) {
                const form = new FormData();
                form.append('image', file);

                const response = await uploadAddProductImage(form);
                const imageUrls = response?.data?.images;

                if (Array.isArray(imageUrls) && imageUrls.length) {
                    uploadedUrls.push(...imageUrls);
                }
            }

            if (uploadedUrls.length) {
                setUploadedImages((prev) => [...prev, ...uploadedUrls]);
                toast.success(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''} uploaded`);
                return;
            }

            toast.error('Image upload failed');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Image upload failed');
        } finally {
            setIsUploadingImage(false);
        }
    }, []);

    const replaceFirstImage = useCallback(async (file) => {
        if (!file) {
            return;
        }

        const previousFirstImage = uploadedImages[0];
        const form = new FormData();
        form.append('image', file);

        try {
            setIsUploadingImage(true);
            const response = await uploadAddProductImage(form);
            const imageUrls = response?.data?.images;

            if (!Array.isArray(imageUrls) || !imageUrls.length) {
                toast.error('Image upload failed');
                return;
            }

            setUploadedImages((prev) => {
                const rest = prev.slice(1);
                return [...imageUrls, ...rest];
            });

            if (previousFirstImage) {
                try {
                    await removeAddProductImage(previousFirstImage);
                } catch (error) {
                    // Keep UI order and state even if delete API fails.
                }
            }

            toast.success('Image replaced');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Image replace failed');
        } finally {
            setIsUploadingImage(false);
        }
    }, [uploadedImages]);

    const removeUploadedImage = useCallback(async (imageUrl) => {
        if (!imageUrl) {
            return;
        }

        try {
            await removeAddProductImage(imageUrl);
        } catch (error) {
            // Keep local state consistent even if delete request fails.
        }

        setUploadedImages((prev) => prev.filter((image) => image !== imageUrl));
        toast.success('Image removed');
    }, []);

    const reorderUploadedImages = useCallback((sourceIndex, targetIndex) => {
        setUploadedImages((prev) => {
            if (
                sourceIndex < 0 ||
                targetIndex < 0 ||
                sourceIndex >= prev.length ||
                targetIndex >= prev.length ||
                sourceIndex === targetIndex
            ) {
                return prev;
            }

            const next = [...prev];
            const [moved] = next.splice(sourceIndex, 1);
            next.splice(targetIndex, 0, moved);
            return next;
        });
    }, []);

    const salePrice = useMemo(() => {
        const base = Number(formData.price || 0);
        const discount = Number(formData.discountedPrice || 0);
        const safeDiscount = Math.min(Math.max(discount, 0), 99);

        if (!base) {
            return '0.00';
        }

        const computed = Math.max(base - (base * safeDiscount) / 100, 0);
        return computed.toFixed(2);
    }, [formData.price, formData.discountedPrice]);

    const saveDraft = useCallback(() => {
        const draftId = activeDraftId || `${Date.now()}`;
        const draftName = formData.productName?.trim() || 'Untitled Draft';
        const newDraft = {
            id: draftId,
            name: draftName,
            savedAt: new Date().toISOString(),
            formData,
            uploadedImages,
        };

        const exists = drafts.some((item) => item.id === draftId);
        const nextDrafts = exists
            ? drafts.map((item) => (item.id === draftId ? newDraft : item))
            : [newDraft, ...drafts];

        persistDrafts(nextDrafts);
        setActiveDraftId(draftId);
        toast.success('Draft saved');
    }, [activeDraftId, drafts, formData, uploadedImages, persistDrafts]);

    const loadDraft = useCallback(
        async (draftId) => {
            const selectedDraft = drafts.find((item) => item.id === draftId);
            if (!selectedDraft) {
                return;
            }

            setFormData({ ...defaultFormData, ...selectedDraft.formData });
            setUploadedImages(Array.isArray(selectedDraft.uploadedImages) ? selectedDraft.uploadedImages : []);
            setActiveDraftId(draftId);

            if (selectedDraft?.formData?.category) {
                await loadSubCategories(selectedDraft.formData.category);
            } else {
                setSubCategories([]);
            }
        },
        [drafts, loadSubCategories],
    );

    const deleteDraft = useCallback(
        (draftId) => {
            const nextDrafts = drafts.filter((item) => item.id !== draftId);
            persistDrafts(nextDrafts);

            if (activeDraftId === draftId) {
                setActiveDraftId(null);
                setFormData(defaultFormData);
                setUploadedImages([]);
                setSubCategories([]);
            }

            toast.success('Draft deleted');
        },
        [activeDraftId, drafts, persistDrafts],
    );

    const createNewDraft = useCallback(() => {
        setActiveDraftId(null);
        setFormData(defaultFormData);
        setUploadedImages([]);
        setSubCategories([]);
    }, []);

    const publishProduct = useCallback(async () => {
        if (!formData.productName || !formData.description || !formData.price) {
            toast.error('Product name, description, and price are required');
            return;
        }

        if (!formData.stock && !formData.unlimitedStock) {
            toast.error('Stock is required when unlimited is disabled');
            return;
        }

        try {
            setIsSubmitting(true);
            const oldPrice = Number(formData.price || 0);
            const discountPercentage = Math.min(Math.max(Number(formData.discountedPrice || 0), 0), 99);
            const computedSalePrice = Math.max(oldPrice - (oldPrice * discountPercentage) / 100, 0);

            const payload = {
                productName: formData.productName,
                description: formData.description,
                price: Number(computedSalePrice.toFixed(2)),
                oldPrice,
                discountPercentage,
                discount: discountPercentage,
                stock: formData.unlimitedStock ? 999999 : Number(formData.stock),
                category: formData.category || undefined,
                subCategory: formData.subCategory || undefined,
                color: formData.color,
                images: uploadedImages,
                ...(formData.expirationStart ? { expirationStart: formData.expirationStart } : {}),
                ...(formData.expirationEnd ? { expirationEnd: formData.expirationEnd } : {}),
            };

            await createAddProduct(payload);
            toast.success('Product published successfully');
            const currentSearch = formData.searchText || '';
            setFormData({ ...defaultFormData, searchText: currentSearch });
            setSubCategories([]);
            setUploadedImages([]);
            if (activeDraftId) {
                const nextDrafts = drafts.filter((item) => item.id !== activeDraftId);
                persistDrafts(nextDrafts);
                setActiveDraftId(null);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to publish product');
        } finally {
            setIsSubmitting(false);
        }
    }, [activeDraftId, drafts, formData, uploadedImages, persistDrafts]);

    const value = useMemo(
        () => ({
            formData,
            categories,
            subCategories,
            uploadedImages,
            drafts,
            activeDraftId,
            isLoadingCategories,
            isSubmitting,
            isUploadingImage,
            salePrice,
            updateField,
            onCategoryChange,
            onSearchChange,
            uploadImage,
            uploadMultipleImages,
            replaceFirstImage,
            removeUploadedImage,
            reorderUploadedImages,
            saveDraft,
            loadDraft,
            deleteDraft,
            createNewDraft,
            publishProduct,
            reloadCategories: loadCategories,
        }),
        [
            formData,
            categories,
            subCategories,
            uploadedImages,
            drafts,
            activeDraftId,
            isLoadingCategories,
            isSubmitting,
            isUploadingImage,
            salePrice,
            updateField,
            onCategoryChange,
            onSearchChange,
            uploadImage,
            uploadMultipleImages,
            replaceFirstImage,
            removeUploadedImage,
            reorderUploadedImages,
            saveDraft,
            loadDraft,
            deleteDraft,
            createNewDraft,
            publishProduct,
            loadCategories,
        ],
    );

    return <AddProductContext.Provider value={value}>{children}</AddProductContext.Provider>;
};
