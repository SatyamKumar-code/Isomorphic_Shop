import React from 'react';
import { FiMoreVertical, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useProductList } from '../../../Context/productList/useProductList';
import { getProductList } from '../ProductListAPI';
import CsvExportDialog from '../../../shared/components/CsvExportDialog';
import { useCsvExportDialog } from '../../../shared/hooks/useCsvExportDialog';

const ProductListHeader = () => {
    const navigate = useNavigate();
    const {
        searchText,
        sortBy,
        setSearchText,
        setSortBy,
        setCurrentPage,
        setPageSize,
        totalPages,
        currentPage,
    } = useProductList();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const formatDate = React.useCallback((value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '01-01-2025';
        }

        const day = `${date.getDate()}`.padStart(2, '0');
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }, []);

    const buildCsvAndDownload = React.useCallback((items, fileName) => {
        const headers = ['Product ID', 'Product', 'Category', 'Sub Category', 'Stock', 'Sale (%)', 'Total Sales', 'Created Date'];
        const csvRows = items.map((item) => [
            item?._id,
            item?.productName || 'Untitled Product',
            item?.category?.catName || '-',
            item?.subCategory?.subCatName || '-',
            Number(item?.stock || 0),
            Number(item?.discountPercentage || 0),
            Number(item?.sales || 0),
            formatDate(item?.createdAt),
        ]);

        const csvText = [headers, ...csvRows]
            .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [formatDate]);

    const fetchAllProducts = React.useCallback(async () => {
        const limit = 100;
        const firstResponse = await getProductList({
            paginate: true,
            page: 1,
            limit,
            search: searchText.trim(),
            sortBy,
        });

        const firstPageProducts = Array.isArray(firstResponse?.data?.products) ? firstResponse.data.products : [];
        const totalPagesFromApi = Math.max(1, Number(firstResponse?.data?.pagination?.totalPages || 1));
        let allProducts = [...firstPageProducts];

        if (totalPagesFromApi > 1) {
            const requests = [];
            for (let page = 2; page <= totalPagesFromApi; page += 1) {
                requests.push(
                    getProductList({
                        paginate: true,
                        page,
                        limit,
                        search: searchText.trim(),
                        sortBy,
                    }),
                );
            }

            const responses = await Promise.all(requests);
            const remainingProducts = responses.flatMap((response) => (
                Array.isArray(response?.data?.products) ? response.data.products : []
            ));

            allProducts = [...allProducts, ...remainingProducts];
        }

        return allProducts;
    }, [searchText, sortBy]);

    const exportState = useCsvExportDialog({
        fetchAllItems: fetchAllProducts,
        getItemCreatedAt: (item) => item?.createdAt,
        onDownload: async (items, mode, selection) => {
            let fileName = 'product-list-all-data.csv';
            if (mode === 'month') {
                fileName = `product-list-${selection.selectedYear}-${selection.selectedMonth}.csv`;
            }
            if (mode === 'year') {
                fileName = `product-list-${selection.selectedYear}.csv`;
            }
            if (mode === 'date') {
                fileName = `product-list-${selection.selectedFromDate}-to-${selection.selectedToDate}.csv`;
            }

            buildCsvAndDownload(items, fileName);
        },
        messages: {
            noData: 'No product data available to export',
            prepareError: 'Failed to prepare export data',
            noMonthData: 'No products found for selected month',
            noYearData: 'No products found for selected year',
            noDateData: 'No products found in selected date range',
            successAll: 'All products exported successfully',
            successMonth: 'Month-wise export completed',
            successYear: 'Year-wise export completed',
            successDate: 'Date-to-date export completed',
            exportError: 'Failed to export product list',
        },
    });

    const modeLabelMap = {
        all: 'Export all available product data.',
        month: 'Select year and month from available data.',
        year: 'Select year from available data.',
        date: 'Select date range from available dates only.',
    };

    return (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-[22px] font-semibold text-slate-900 dark:text-slate-100">Product List</h3>

            <div className="relative flex items-center gap-3">
                <button
                    className="inline-flex items-center gap-2 rounded-md bg-[#4EA674] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#4EA674]/20 transition hover:bg-[#409162]"
                    onClick={() => navigate('/add-products')}
                >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/70 text-xs">
                        <FiPlus />
                    </span>
                    Add Product
                </button>

                <button
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200 dark:hover:bg-gray-900"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                >
                    More Action
                    <FiMoreVertical />
                </button>

                {isMenuOpen ? (
                    <div className="absolute right-0 top-12 z-20 min-w-52 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950">
                        <button
                            className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                            onClick={() => {
                                exportState.openDialog();
                                setIsMenuOpen(false);
                            }}
                        >
                            Export CSV
                        </button>

                        <button
                            className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                            onClick={() => {
                                setSearchText('');
                                setCurrentPage(1);
                                setIsMenuOpen(false);
                            }}
                        >
                            Clear Search
                        </button>

                        <button
                            className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                            onClick={() => {
                                setSearchText('');
                                setSortBy('latest');
                                setPageSize(10);
                                setCurrentPage(1);
                                setIsMenuOpen(false);
                            }}
                        >
                            Clear All Filters
                        </button>

                        <button
                            className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                            onClick={() => {
                                setCurrentPage(1);
                                setIsMenuOpen(false);
                            }}
                        >
                            Go First Page
                        </button>

                        <button
                            className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-gray-900"
                            onClick={() => {
                                setCurrentPage(totalPages);
                                setIsMenuOpen(false);
                            }}
                            disabled={currentPage === totalPages}
                        >
                            Go Last Page
                        </button>
                    </div>
                ) : null}
            </div>

            <CsvExportDialog
                title="Export Product CSV"
                modeLabelMap={modeLabelMap}
                exportState={exportState}
            />
        </div>
    );
};

export default ProductListHeader;
