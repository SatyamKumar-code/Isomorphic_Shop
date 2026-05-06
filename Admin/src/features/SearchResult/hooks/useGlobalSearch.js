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

const formatProductPrice = (item) => {
    const salePrice = Number(item?.price || 0);
    const basePrice = Number(item?.oldPrice || item?.mrp || item?.basePrice || salePrice || 0);

    return {
        salePrice,
        basePrice,
        priceLabel: `Rs ${salePrice.toLocaleString('en-IN')}`,
        basePriceLabel: `Rs ${basePrice.toLocaleString('en-IN')}`,
    };
};

const normalizeProduct = (item) => {
    const { salePrice, basePrice, priceLabel, basePriceLabel } = formatProductPrice(item);
    const normalizedRating = Number(item?.rating ?? item?.avgRating ?? item?.averageRating ?? item?.productRating ?? 0);

    return {
        id: item?._id || '',
        name: item?.productName || 'Untitled Product',
        meta: item?.category?.catName || item?.subCategory?.subCatName || '-',
        routeValue: item?.productName || '',
        image: item?.images?.[0] || item?.image || '',
        rating: Number.isFinite(normalizedRating) ? Number(normalizedRating.toFixed(1)) : 0,
        salePrice,
        basePrice,
        priceLabel,
        basePriceLabel,
        sellerName: item?.createdBy?.name || item?.sellerId?.name || item?.sellerName || '',
    };
};

const formatOrderDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const normalizeOrder = (item) => {
    const customerName = item?.customer?.name || item?.customerId?.name || item?.customerName || item?.userId?.name || '';
    const productName = item?.product || item?.productName || (item?.products?.[0]?.productId?.productName) || '';
    const amountValue = Number(item?.amountValue ?? item?.totalAmount ?? item?.price ?? 0);

    return {
        id: item?._id || item?.id || '',
        name: item?.orderId ? `${item.orderId}` : `${item?._id?.slice(-6) || ''}`,
        meta: customerName || '-',
        productName: productName || '-',
        routeValue: item?.orderId || item?._id || '',
        totalAmount: amountValue,
        amountLabel: `Rs ${amountValue.toLocaleString('en-IN')}`,
        status: (item?.rawStatus || item?.status || 'pending').toString().toLowerCase(),
        createdAt: item?.createdAt || null,
        dateLabel: formatOrderDate(item?.createdAt),
    };
};

const normalizeCustomer = (item) => ({
    id: item?._id || item?.id || '',
    name: item?.name || 'Unknown customer',
    meta: item?.email || item?.phone || '-',
    routeValue: item?.name || '',
    totalSpend: Number(item?.totalSpend || item?.totalSales || 0),
    spendLabel: `Rs ${Number(item?.totalSpend || item?.totalSales || 0).toLocaleString('en-IN')}`,
});

const normalizeSeller = (item) => ({
    id: item?._id || item?.id || '',
    name: item?.name || 'Unknown seller',
    meta: item?.email || item?.phone || '-',
    routeValue: item?.name || '',
});

const normalizeCategory = (item) => ({
    id: item?._id || '',
    name: item?.catName || 'Unnamed category',
    meta: 'Category',
    routeValue: item?.catName || '',
    categoryId: item?._id || '',
});

const normalizeSubCategory = (item) => {
    const parentCategoryId = typeof item?.categoryId === 'object'
        ? item?.categoryId?._id || ''
        : item?.categoryId || '';
    const parentCategoryName = typeof item?.categoryId === 'object'
        ? item?.categoryId?.catName || ''
        : '';

    return {
        id: item?._id || '',
        name: item?.subCatName || 'Unnamed subcategory',
        meta: parentCategoryName || 'Subcategory',
        routeValue: item?.subCatName || '',
        parentCategoryId,
        parentCategoryName,
    };
};

const formatAmount = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

const normalizeAdminPayoutRow = (item) => ({
    id: item?.sellerId || '',
    name: item?.sellerName || 'Unknown seller',
    meta: `${item?.sellerEmail || '-'} | Due: ${formatAmount(item?.payoutDue)} | Paid: ${formatAmount(item?.paidAmount)}`,
    routeValue: item?.sellerName || '',
});

const normalizeSellerPayout = (payload) => ({
    id: payload?.seller?.id || '',
    name: payload?.seller?.name || 'My payout',
    meta: `${payload?.seller?.email || '-'} | Due: ${formatAmount(payload?.summary?.payoutDue)} | Paid: ${formatAmount(payload?.summary?.paidAmount)}`,
    routeValue: payload?.seller?.name || '',
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
            const rawCustomers = customersRes.status === 'fulfilled'
                ? (customersRes.value?.data?.data?.customers || customersRes.value?.data?.customers || customersRes.value?.data?.data?.allCustomers || [])
                : [];
            if ((!Array.isArray(rawCustomers) || rawCustomers.length === 0) && customersRes.status === 'fulfilled') {
                // Debug: log the raw response to diagnose missing fields
                // Remove this log after debugging
                // eslint-disable-next-line no-console
                console.debug('searchCustomersGlobal response:', customersRes.value?.data || customersRes.value);
            }
            const customers = Array.isArray(rawCustomers) ? rawCustomers.map(normalizeCustomer) : [];
            const rawSellers = sellersRes.status === 'fulfilled'
                ? (sellersRes.value?.data?.data?.customers || sellersRes.value?.data?.customers || [])
                : [];
            const sellers = Array.isArray(rawSellers) ? rawSellers.map(normalizeSeller) : [];
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
