import React from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchResultSection from '../components/SearchResultSection';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { useAuth } from '../../../Context/auth/useAuth';

const SearchResultPage = () => {
    const [searchParams] = useSearchParams();
    const query = (searchParams.get('q') || '').trim();
    const { userData } = useAuth();
    const isAdmin = userData?.role === 'admin';
    const { isLoading, errorMessage, results } = useGlobalSearch(query, { includeSellers: isAdmin });
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
                        <SearchResultSection key={section.title} title={section.title} items={section.items} />
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
