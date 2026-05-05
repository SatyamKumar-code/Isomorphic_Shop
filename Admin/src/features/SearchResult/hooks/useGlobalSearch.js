import { useCallback, useEffect, useState } from 'react';
import {
    getPayoutDashboardGlobal,
    getAllCategories,
    searchCustomersGlobal,
    searchOrdersGlobal,
    searchProductsGlobal,
    searchSellersGlobal,
    searchSubCategoriesGlobal,
} from '../SearchResultAPI';

const normalizeProduct = (item) => ({
    id: item?._id || '',
    name: item?.productName || 'Untitled Product',
    meta: item?.category?.catName || item?.subCategory?.subCatName || '-',
});

const normalizeOrder = (item) => ({
    id: item?._id || item?.id || '',
    name: item?.orderId ? `Order #${item.orderId}` : `Order ${item?._id?.slice(-6) || ''}`,
    meta: item?.customerId?.name || item?.customerName || item?.status || '-',
});

const normalizeCustomer = (item) => ({
    id: item?._id || item?.id || '',
    name: item?.name || 'Unknown customer',
    meta: item?.email || item?.phone || '-',
});

const normalizeSeller = (item) => ({
    id: item?._id || item?.id || '',
    name: item?.name || 'Unknown seller',
    meta: item?.email || item?.phone || '-',
});

const normalizeCategory = (item) => ({
    id: item?._id || '',
    name: item?.catName || 'Unnamed category',
    meta: 'Category',
});

const normalizeSubCategory = (item) => ({
    id: item?._id || '',
    name: item?.subCatName || 'Unnamed subcategory',
    meta: item?.categoryId?.catName || 'Subcategory',
});

const formatAmount = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

const normalizeAdminPayoutRow = (item) => ({
    id: item?.sellerId || '',
    name: item?.sellerName || 'Unknown seller',
    meta: `${item?.sellerEmail || '-'} | Due: ${formatAmount(item?.payoutDue)} | Paid: ${formatAmount(item?.paidAmount)}`,
});

const normalizeSellerPayout = (payload) => ({
    id: payload?.seller?.id || '',
    name: payload?.seller?.name || 'My payout',
    meta: `${payload?.seller?.email || '-'} | Due: ${formatAmount(payload?.summary?.payoutDue)} | Paid: ${formatAmount(payload?.summary?.paidAmount)}`,
});

export const useGlobalSearch = (searchText, options = {}) => {
    const { includeSellers = false } = options;
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [results, setResults] = useState({
        products: [],
        orders: [],
        customers: [],
        sellers: [],
        payouts: [],
        categories: [],
        subCategories: [],
    });

    const runSearch = useCallback(async () => {
        const query = String(searchText || '').trim();

        if (!query) {
            setResults({
                products: [],
                orders: [],
                customers: [],
                sellers: [],
                payouts: [],
                categories: [],
                subCategories: [],
            });
            setErrorMessage('');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            const [productsRes, ordersRes, customersRes, sellersRes, payoutRes, categoriesRes, subCategoriesRes] = await Promise.allSettled([
                searchProductsGlobal(query),
                searchOrdersGlobal(query),
                searchCustomersGlobal(query),
                includeSellers ? searchSellersGlobal(query) : Promise.resolve({ data: { data: { customers: [] } } }),
                getPayoutDashboardGlobal(),
                getAllCategories(),
                searchSubCategoriesGlobal(query),
            ]);

            const products = productsRes.status === 'fulfilled' && Array.isArray(productsRes.value?.data?.products)
                ? productsRes.value.data.products.map(normalizeProduct)
                : [];
            const orders = ordersRes.status === 'fulfilled'
                ? (Array.isArray(ordersRes.value?.data?.orders) ? ordersRes.value.data.orders.map(normalizeOrder) : [])
                : [];
            const customers = customersRes.status === 'fulfilled'
                ? (Array.isArray(customersRes.value?.data?.data?.customers)
                    ? customersRes.value.data.data.customers.map(normalizeCustomer)
                    : [])
                : [];
            const sellers = sellersRes.status === 'fulfilled'
                ? (Array.isArray(sellersRes.value?.data?.data?.customers)
                    ? sellersRes.value.data.data.customers.map(normalizeSeller)
                    : [])
                : [];
            const payoutPayload = payoutRes.status === 'fulfilled' ? payoutRes.value?.data?.data : null;
            const payouts = Array.isArray(payoutPayload?.sellerWise)
                ? payoutPayload.sellerWise
                    .filter((item) => {
                        const haystack = `${item?.sellerName || ''} ${item?.sellerEmail || ''} ${item?.payoutDue || ''} ${item?.paidAmount || ''}`.toLowerCase();
                        return haystack.includes(query.toLowerCase());
                    })
                    .slice(0, 5)
                    .map(normalizeAdminPayoutRow)
                : (payoutPayload?.seller
                    ? [normalizeSellerPayout(payoutPayload)].filter((item) => {
                        const haystack = `${item.name} ${item.meta}`.toLowerCase();
                        return haystack.includes(query.toLowerCase());
                    })
                    : []);
            const allCategories = categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value?.data?.categories)
                ? categoriesRes.value.data.categories
                : [];
            const normalizedCategories = allCategories
                .filter((item) => String(item?.catName || '').toLowerCase().includes(query.toLowerCase()))
                .slice(0, 5)
                .map(normalizeCategory);
            const subCategories = subCategoriesRes.status === 'fulfilled'
                ? (Array.isArray(subCategoriesRes.value?.data?.subCategories)
                    ? subCategoriesRes.value.data.subCategories.map(normalizeSubCategory)
                    : [])
                : [];

            setResults({
                products,
                orders,
                customers,
                sellers,
                payouts,
                categories: normalizedCategories,
                subCategories,
            });

            const hasNoResults = !products.length && !orders.length && !customers.length && !sellers.length && !payouts.length && !normalizedCategories.length && !subCategories.length;
            if (hasNoResults) {
                setErrorMessage('No results found for this search.');
            }
        } catch (error) {
            setResults({
                products: [],
                orders: [],
                customers: [],
                sellers: [],
                payouts: [],
                categories: [],
                subCategories: [],
            });
            setErrorMessage('Search service is currently unavailable.');
        } finally {
            setIsLoading(false);
        }
    }, [searchText, includeSellers]);

    useEffect(() => {
        runSearch();
    }, [runSearch]);

    return {
        isLoading,
        errorMessage,
        results,
    };
};
