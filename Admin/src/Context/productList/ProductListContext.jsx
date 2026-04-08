import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteProductById, getProductList } from '../../features/productList/ProductListAPI';

export const ProductListContext = createContext();

const defaultPageSize = 10;

const thumbnailColors = [
    { background: '#F1F8FF', color: '#2563EB' },
    { background: '#FFF7ED', color: '#EA580C' },
    { background: '#F0FDF4', color: '#16A34A' },
    { background: '#F5F3FF', color: '#7C3AED' },
    { background: '#FFF1F2', color: '#E11D48' },
    { background: '#EFF6FF', color: '#0284C7' },
];

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '01-01-2025';
    }

    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const normalizeProducts = (items = []) => {
    return items.map((item) => ({
        id: item?._id,
        product: item?.productName || 'Untitled Product',
        image: item?.images?.[0] || '',
        date: formatDate(item?.createdAt),
        createdAt: item?.createdAt || null,
        stock: Number(item?.stock || 0),
        outOfStock: Number(item?.stock || 0) <= 0,
        sale: Number(item?.discountPercentage || 0),
        totalSales: Number(item?.sales || 0),
        category: item?.category?.catName || '-',
        subCategory: item?.subCategory?.subCatName || '-',
    }));
};

export const ProductListProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');
    const [sortBy, setSortBy] = useState('latest');
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeletingId, setIsDeletingId] = useState('');

    const loadProducts = useCallback(async (page = currentPage, search = debouncedSearchText, sort = sortBy) => {
        try {
            setIsLoading(true);
            const response = await getProductList({
                paginate: true,
                page,
                limit: pageSize,
                search: search.trim(),
                sortBy: sort,
            });

            const items = response?.data?.products;
            const pagination = response?.data?.pagination;
            setProducts(Array.isArray(items) ? normalizeProducts(items) : []);
            setTotalCount(Number(pagination?.totalCount || 0));
            setTotalPages(Math.max(1, Number(pagination?.totalPages || 1)));
        } catch (error) {
            setProducts([]);
            setTotalCount(0);
            setTotalPages(1);
            toast.error(error?.response?.data?.message || 'Failed to load products');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, debouncedSearchText, sortBy, pageSize]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, 450);

        return () => clearTimeout(timer);
    }, [searchText]);

    useEffect(() => {
        loadProducts(currentPage, debouncedSearchText, sortBy);
    }, [currentPage, debouncedSearchText, sortBy, pageSize, loadProducts]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchText, sortBy, pageSize]);

    const rows = products;

    const pagination = useMemo(() => {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }, [totalPages]);

    const handleDeleteProduct = useCallback(
        async (productId) => {
            const selected = products.find((item) => item.id === productId);
            if (!selected) {
                return;
            }

            const confirmed = window.confirm(`Delete ${selected.product}? This action cannot be undone.`);
            if (!confirmed) {
                return;
            }

            try {
                setIsDeletingId(productId);
                await deleteProductById(productId);
                const nextPage = rows.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
                if (nextPage !== currentPage) {
                    setCurrentPage(nextPage);
                } else {
                    await loadProducts(nextPage, debouncedSearchText, sortBy);
                }
                toast.success('Product deleted successfully');
            } catch (error) {
                toast.error(error?.response?.data?.message || 'Unable to delete product');
            } finally {
                setIsDeletingId('');
            }
        },
        [currentPage, loadProducts, rows.length, debouncedSearchText, sortBy],
    );

    const value = useMemo(
        () => ({
            rows,
            totalCount,
            searchText,
            setSearchText,
            sortBy,
            setSortBy,
            pageSize,
            setPageSize,
            currentPage,
            setCurrentPage,
            pagination,
            totalPages,
            isLoading,
            isDeletingId,
            thumbnailColors,
            reloadProductList: () => loadProducts(currentPage, debouncedSearchText, sortBy),
            deleteProduct: handleDeleteProduct,
        }),
        [
            rows,
            totalCount,
            searchText,
            sortBy,
            pageSize,
            currentPage,
            pagination,
            totalPages,
            isLoading,
            isDeletingId,
            debouncedSearchText,
            loadProducts,
            handleDeleteProduct,
        ],
    );

    return <ProductListContext.Provider value={value}>{children}</ProductListContext.Provider>;
};
