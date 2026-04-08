import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductList } from '../../../Context/productList/useProductList';
import ProductListFilters from '../components/ProductListFilters';
import ProductListHeader from '../components/ProductListHeader';
import ProductListPagination from '../components/ProductListPagination';
import ProductListTable from '../components/ProductListTable';

const ProductListPage = () => {
    const navigate = useNavigate();
    const {
        rows,
        totalCount,
        currentPage,
        pageSize,
        isLoading,
        isDeletingId,
        deleteProduct,
        thumbnailColors,
    } = useProductList();

    return (
        <div className="w-full overflow-x-auto scrollbarNone px-5 pb-6 pt-4">
            <ProductListHeader />

            <div className="rounded-lg bg-white p-4 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:bg-gray-950 dark:inset-shadow-gray-700 dark:shadow-gray-700">
                <ProductListFilters />

                <ProductListTable
                    rows={rows}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    isLoading={isLoading || Boolean(isDeletingId)}
                    thumbnailColors={thumbnailColors}
                    onDelete={deleteProduct}
                    onEdit={(id) => navigate(`/add-products?edit=${id}`)}
                />

                {totalCount > 0 ? <ProductListPagination /> : null}
            </div>
        </div>
    );
};

export default ProductListPage;
