import React from 'react';
import { useCategories } from '../../../Context/categories/useCategories';
import OrdersTable from '../../../shared/components/OrdersTable';
import CategoriesDiscover from '../components/CategoriesDiscover';
import CategoriesFilters from '../components/CategoriesFilters';
import CategoriesHeader from '../components/CategoriesHeader';
import CategoriesPagination from '../components/CategoriesPagination';

const CategoriesPage = () => {
    const { rows, currentPage, pageSize, isLoading, thumbnailColors } = useCategories();

    return (
        <div className="w-full h-screen overflow-x-auto scrollbarNone px-5 pb-6 pt-4">
            <CategoriesHeader />
            <CategoriesDiscover />

            <div className="rounded-lg bg-white p-4 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:bg-gray-950 dark:inset-shadow-gray-700 dark:shadow-gray-700">
                <CategoriesFilters />

                <OrdersTable
                    variant="categories"
                    rows={rows}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    isLoading={isLoading}
                    thumbnailColors={thumbnailColors}
                />

                <CategoriesPagination />
            </div>
        </div>
    );
};

export default CategoriesPage;
