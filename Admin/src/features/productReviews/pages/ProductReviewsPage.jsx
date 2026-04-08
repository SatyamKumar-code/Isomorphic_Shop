import React from "react";
import { useProductReviews } from "../../../Context/productReviews/useProductReviews";
import ReviewFilters from "../components/ReviewFilters";
import ReviewHeader from "../components/ReviewHeader";
import ReviewPagination from "../components/ReviewPagination";
import ReviewsTable from "../components/ReviewsTable";
import ReviewSummaryCards from "../components/ReviewSummaryCards";

const ProductReviewsPage = () => {
    const { activeTab, setActiveTab, currentPage, setCurrentPage } = useProductReviews();

    return (
        <div className="w-full overflow-x-auto scrollbarNone px-5 pb-6 pt-4">
            <ReviewHeader />

            <ReviewSummaryCards />

            <div className="rounded-lg bg-white p-4 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:bg-gray-950 dark:shadow-gray-700 dark:inset-shadow-gray-700">
                <ReviewFilters activeTab={activeTab} onTabChange={setActiveTab} />
                <ReviewsTable />
                <ReviewPagination currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
};

export default ProductReviewsPage;
