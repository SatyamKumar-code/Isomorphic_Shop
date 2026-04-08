import React from "react";
import { FiMoreVertical } from "react-icons/fi";
import { useProductReviews } from "../../../Context/productReviews/useProductReviews";
import { getProductReviews } from "../ProductReviewsAPI";
import CsvExportDialog from "../../../shared/components/CsvExportDialog";
import { useCsvExportDialog } from "../../../shared/hooks/useCsvExportDialog";

const ReviewHeader = () => {
    const {
        activeTab,
        searchText,
        sortBy,
        minRating,
        reloadReviews,
        refreshReviewSummary,
        clearReviewFilters,
    } = useProductReviews();
    const [showMenu, setShowMenu] = React.useState(false);

    const buildCsvAndDownload = React.useCallback((items, fileName) => {
        const headers = ["Review ID", "Product", "Customer", "Rating", "Status", "Date", "Comment"];
        const rows = items.map((item) => [
            item.id,
            item.product,
            item.customer,
            item.rating,
            item.status,
            item.date,
            item.comment,
        ]);

        const csvText = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "product-reviews.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, []);

    const fetchAllReviews = React.useCallback(async () => {
        const statusParam = activeTab === "All reviews" ? "All reviews" : activeTab;
        const limit = 100;

        const firstResponse = await getProductReviews({
            page: 1,
            limit,
            status: statusParam,
            search: searchText.trim(),
            sortBy,
            minRating,
        });

        const firstData = firstResponse?.data?.data;
        const firstPageReviews = Array.isArray(firstData?.reviews) ? firstData.reviews : [];
        const totalPagesFromApi = Math.max(1, Number(firstData?.totalPages || 1));
        let allReviews = [...firstPageReviews];

        if (totalPagesFromApi > 1) {
            const requests = [];
            for (let page = 2; page <= totalPagesFromApi; page += 1) {
                requests.push(
                    getProductReviews({
                        page,
                        limit,
                        status: statusParam,
                        search: searchText.trim(),
                        sortBy,
                        minRating,
                    }),
                );
            }

            const responses = await Promise.all(requests);
            const remaining = responses.flatMap((response) => (
                Array.isArray(response?.data?.data?.reviews) ? response.data.data.reviews : []
            ));

            allReviews = [...allReviews, ...remaining];
        }

        return allReviews;
    }, [activeTab, searchText, sortBy, minRating]);

    const exportState = useCsvExportDialog({
        fetchAllItems: fetchAllReviews,
        getItemCreatedAt: (item) => item?.createdAt,
        onDownload: async (items, mode, selection) => {
            let fileName = "product-reviews-all-data.csv";
            if (mode === "month") {
                fileName = `product-reviews-${selection.selectedYear}-${selection.selectedMonth}.csv`;
            }
            if (mode === "year") {
                fileName = `product-reviews-${selection.selectedYear}.csv`;
            }
            if (mode === "date") {
                fileName = `product-reviews-${selection.selectedFromDate}-to-${selection.selectedToDate}.csv`;
            }

            buildCsvAndDownload(items, fileName);
        },
        messages: {
            noData: "No review data available to export",
            prepareError: "Failed to prepare review export",
            noMonthData: "No reviews found for selected month",
            noYearData: "No reviews found for selected year",
            noDateData: "No reviews found in selected date range",
            successAll: "All reviews exported successfully",
            successMonth: "Month-wise export completed",
            successYear: "Year-wise export completed",
            successDate: "Date-to-date export completed",
            exportError: "Failed to export reviews",
        },
    });

    const modeLabelMap = {
        all: "Export all available review data.",
        month: "Select year and month from available review data.",
        year: "Select year from available review data.",
        date: "Select date range from available review dates only.",
    };

    return (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-[22px] font-bold text-slate-900 dark:text-slate-100">Product Reviews</h3>
            <div className="relative">
                <button
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200 dark:hover:bg-gray-900"
                    onClick={() => setShowMenu((prev) => !prev)}
                >
                    More Action
                    <FiMoreVertical />
                </button>

                {showMenu && (
                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg dark:border-slate-700 dark:bg-gray-950">
                        <button
                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                            onClick={async () => {
                                await Promise.all([reloadReviews(), refreshReviewSummary()]);
                                setShowMenu(false);
                            }}
                        >
                            Refresh data
                        </button>

                        <button
                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                            onClick={() => {
                                exportState.openDialog();
                                setShowMenu(false);
                            }}
                        >
                            Export CSV
                        </button>

                        <button
                            className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => {
                                clearReviewFilters();
                                setShowMenu(false);
                            }}
                        >
                            Reset filters
                        </button>
                    </div>
                )}
            </div>

            <CsvExportDialog
                title="Export Reviews CSV"
                modeLabelMap={modeLabelMap}
                exportState={exportState}
            />
        </div>
    );
};

export default ReviewHeader;
