import React from 'react';
import { createSearchParams, useNavigate, useSearchParams } from 'react-router-dom';
import SearchResultSection from '../components/SearchResultSection';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { useAuth } from '../../../Context/auth/useAuth';

const SearchResultPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = (searchParams.get('q') || '').trim();
    const { userData } = useAuth();
    const isAdmin = userData?.role === 'admin';
    const { isLoading, errorMessage, results } = useGlobalSearch(query, { includeSellers: isAdmin });

    const buildTarget = React.useCallback((title, item) => {
        const routeValue = String(item?.routeValue || item?.name || item?.id || '').trim();
        const itemId = String(item?.id || '').trim();

        switch (title) {
            case 'Products':
                return { pathname: '/product-list', search: createSearchParams(routeValue ? { search: routeValue } : {}).toString() };
            case 'Orders':
                return {
                    pathname: '/order-management',
                    search: createSearchParams({
                        search: routeValue || itemId,
                        focusOrder: itemId || routeValue,
                    }).toString(),
                };
            case 'Customers':
                return {
                    pathname: '/customers',
                    search: createSearchParams({
                        search: routeValue,
                        customerId: itemId,
                    }).toString(),
                };
            case 'Sellers':
                return {
                    pathname: '/seller',
                    search: createSearchParams({
                        search: routeValue,
                        customerId: itemId,
                    }).toString(),
                };
            case 'Payouts':
                return {
                    pathname: '/transaction',
                    search: createSearchParams({
                        ...(isAdmin && itemId ? { sellerId: itemId } : {}),
                        ...(routeValue ? { searchTerm: routeValue } : {}),
                    }).toString(),
                };
            case 'Categories':
                return isAdmin
                    ? {
                        pathname: '/categories',
                        search: createSearchParams(routeValue ? { search: routeValue } : {}).toString(),
                    }
                    : {
                        pathname: '/add-products',
                        search: createSearchParams({
                            ...(itemId ? { prefillCategoryId: itemId } : {}),
                        }).toString(),
                    };
            case 'Sub Categories':
                return isAdmin
                    ? {
                        pathname: '/categories',
                        search: createSearchParams(routeValue ? { search: routeValue } : {}).toString(),
                    }
                    : {
                        pathname: '/add-products',
                        search: createSearchParams({
                            ...(item?.parentCategoryId ? { prefillCategoryId: String(item.parentCategoryId) } : {}),
                            ...(itemId ? { prefillSubCategoryId: itemId } : {}),
                        }).toString(),
                    };
            default:
                return null;
        }
    }, [isAdmin]);

    const handleItemClick = React.useCallback((title, item) => {
        const target = buildTarget(title, item);

        if (!target) {
            return;
        }

        navigate({ pathname: target.pathname, search: target.search ? `?${target.search}` : '' });
    }, [buildTarget, navigate]);

    const visibleSections = [
        { title: 'Products', items: results.products },
        { title: 'Orders', items: results.orders },
        { title: 'Customers', items: results.customers },
        ...(isAdmin ? [{ title: 'Sellers', items: results.sellers }] : []),
        { title: 'Payouts', items: results.payouts },
        { title: 'Categories', items: results.categories },
        { title: 'Sub Categories', items: results.subCategories },
    ].filter((section) => Array.isArray(section.items) && section.items.length > 0);

    return (
        <div className="px-5 pb-6 pt-4">
            <div className="mb-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-950">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Global Search Results</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {query ? `Showing all matches for: ${query}` : 'Type in header search to find products, orders, customers, sellers, payouts, and categories.'}
                </p>
            </div>

            {isLoading ? (
                <div className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm dark:bg-gray-950 dark:text-slate-400">
                    Searching across dashboard data...
                </div>
            ) : null}

            {!isLoading && query ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {visibleSections.map((section) => (
                        <SearchResultSection
                            key={section.title}
                            title={section.title}
                            items={section.items}
                            isAdmin={isAdmin}
                            onItemClick={(item) => handleItemClick(section.title, item)}
                        />
                    ))}
                </div>
            ) : null}

            {!isLoading && errorMessage ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-200">
                    {errorMessage}
                </div>
            ) : null}
        </div>
    );
};

export default SearchResultPage;
