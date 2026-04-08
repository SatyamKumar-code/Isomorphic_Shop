import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getCategories, getProducts } from '../../features/categories/CategoriesAPI';

export const CategoriesContext = createContext();

const pageSize = 10;

const thumbnailColors = [
    { background: '#F1F8FF', color: '#2563EB' },
    { background: '#FFF7ED', color: '#EA580C' },
    { background: '#F0FDF4', color: '#16A34A' },
    { background: '#F5F3FF', color: '#7C3AED' },
    { background: '#FFF1F2', color: '#E11D48' },
    { background: '#EFF6FF', color: '#0284C7' },
];

const initialTabs = [
    { label: 'All Product', count: 145 },
    { label: 'Featured Products', count: null },
    { label: 'On Sale', count: null },
    { label: 'Out of Stock', count: null },
];

const matchesTab = (item, activeTab) => {
    if (activeTab === 'All Product') return true;
    if (activeTab === 'Featured Products') return item.featured;
    if (activeTab === 'On Sale') return item.onSale;
    if (activeTab === 'Out of Stock') return item.stock === 0;
    return true;
};

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

export const CategoriesProvider = ({ children }) => {
    const [discoverCategories, setDiscoverCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [tabs, setTabs] = useState(initialTabs);
    const [activeTab, setActiveTab] = useState('All Product');
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const loadCategories = useCallback(async () => {
        try {
            const response = await getCategories();
            const categories = response?.data?.categories;

            if (Array.isArray(categories) && categories.length) {
                const normalized = categories.map((category) => ({
                    id: category._id,
                    name: category.catName,
                    image: category.image,
                }));
                setDiscoverCategories(normalized);
            }
        } catch (error) {
            // Keep fallback discover cards when API is unavailable.
            setDiscoverCategories([]);
            if (error.response) {
                console.error('API Error:', error.response.status, error.response.data);
            } else if (error.request) {
                console.error('Network Error: No response received from the server.');
            } else {
                console.error('Error:', error.message);
            }
        }
    }, []);

    const loadProducts = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await getProducts();
            const items = response?.data?.products;

            if (Array.isArray(items) && items.length) {
                const normalized = items.map((item) => {
                    const stock = Number(item.stock || 0);

                    return {
                        id: item._id,
                        product: item.productName,
                        image: item.images?.[0],
                        date: formatDate(item.createdAt),
                        stock: Math.max(stock),
                        featured: Boolean(item.featured),
                        onSale: Number(item.discountPercentage || 0) > 0,
                    };
                });

                setProducts(normalized);
                setTabs((prev) =>
                    prev.map((tab) => {
                        if (tab.label === 'All Product') {
                            return { ...tab, count: normalized.length };
                        }

                        return { ...tab, count: normalized.filter((item) => matchesTab(item, tab.label)).length };
                    }),
                );
            } else {
                setProducts([]);
                setTabs((prev) => prev.map((tab) => ({ ...tab, count: 0 })));
            }
        } catch (error) {
            // Keep fallback table rows when API is unavailable.
            setProducts([]);
            setDiscoverCategories([]);
            if (error.response) {
                console.error('API Error:', error.response.status, error.response.data);
            } else if (error.request) {
                console.error('Network Error: No response received from the server.');
            } else {
                console.error('Error:', error.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
        loadProducts();
    }, [loadCategories, loadProducts]);

    const filteredProducts = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        return products.filter((item) => {
            const tabMatch = matchesTab(item, activeTab);
            if (!query) {
                return tabMatch;
            }

            return tabMatch && `${item.product} ${item.date} ${item.stock}`.toLowerCase().includes(query);
        });
    }, [products, activeTab, searchText]);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredProducts.length / pageSize));
    }, [filteredProducts.length]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchText]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredProducts.slice(start, start + pageSize);
    }, [filteredProducts, currentPage]);

    const pagination = useMemo(() => {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }, [totalPages]);

    const value = useMemo(
        () => ({
            discoverCategories,
            tabs,
            activeTab,
            setActiveTab,
            searchText,
            setSearchText,
            rows: paginatedProducts,
            currentPage,
            setCurrentPage,
            pageSize,
            pagination,
            totalPages,
            isLoading,
            thumbnailColors,
            reloadCategoriesData: () => {
                loadCategories();
                loadProducts();
            },
        }),
        [discoverCategories, tabs, activeTab, searchText, paginatedProducts, currentPage, pagination, totalPages, isLoading, loadCategories, loadProducts],
    );

    return (
        <CategoriesContext.Provider value={value}>
            {children}
        </CategoriesContext.Provider>
    );
};
