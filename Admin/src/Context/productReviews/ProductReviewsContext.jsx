import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getProductReviewSummary, getProductReviews, updateProductReviewStatus } from "../../features/productReviews/ProductReviewsAPI";

export const ProductReviewsContext = createContext();


const pageSize = 8;

const statusColor = {
    Approved: "#22C55E",
    Pending: "#F59E0B",
    Rejected: "#EF4444",
};

const thumbnailColors = [
    { background: "#F1F8FF", color: "#2563EB" },
    { background: "#FFF7ED", color: "#EA580C" },
    { background: "#F0FDF4", color: "#16A34A" },
    { background: "#F5F3FF", color: "#7C3AED" },
    { background: "#FFF1F2", color: "#E11D48" },
    { background: "#EFF6FF", color: "#0284C7" },
];

export const ProductReviewsProvider = ({ children }) => {
    const [summaryCards, setSummaryCards] = useState([]);
    const [tabs, setTabs] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [activeTab, setActiveTab] = useState("All reviews");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchText, setSearchText] = useState("");
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const [sortBy, setSortBy] = useState("latest");
    const [minRating, setMinRating] = useState("all");
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdatingReviewId, setIsUpdatingReviewId] = useState("");

    const loadSummary = useCallback(async () => {
        try {
            const res = await getProductReviewSummary();
            if (Array.isArray(res?.data?.data?.summaryCards)) {
                setSummaryCards(res.data.data.summaryCards);
            }
            if (Array.isArray(res?.data?.data?.tabs)) {
                setTabs(res.data.data.tabs);
            }
        } catch (error) {
            // Keep fallback local data when API is unavailable.
        }
    }, []);

    const loadReviews = useCallback(async () => {
        try {
            setIsLoading(true);
            const statusParam = activeTab === "All reviews" ? "All reviews" : activeTab;
            const res = await getProductReviews({
                page: currentPage,
                limit: pageSize,
                status: statusParam,
                search: debouncedSearchText.trim(),
                sortBy,
                minRating,
            });

            const responseData = res?.data?.data;
            const fetchedReviews = Array.isArray(responseData?.reviews)
                ? responseData.reviews
                : Array.isArray(res?.data?.reviews)
                    ? res.data.reviews
                    : [];

            setReviews(fetchedReviews);
            setTotalPages(Math.max(1, Number(responseData?.totalPages || 1)));
        } catch (error) {
            setReviews([]);
            setTotalPages(1);
            toast.error(error?.response?.data?.message || "Failed to load reviews");
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, currentPage, debouncedSearchText, sortBy, minRating]);

    const refreshReviewSummary = useCallback(async () => {
        await loadSummary();
    }, [loadSummary]);

    const updateReviewStatus = useCallback(async (reviewId, status) => {
        try {
            setIsUpdatingReviewId(reviewId);
            await updateProductReviewStatus(reviewId, { status });
            toast.success(`Review ${status.toLowerCase()} successfully`);
            await Promise.all([loadSummary(), loadReviews()]);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update review status");
        } finally {
            setIsUpdatingReviewId("");
        }
    }, [loadReviews, loadSummary]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, 450);

        return () => clearTimeout(timer);
    }, [searchText]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, debouncedSearchText, sortBy, minRating]);

    const clearReviewFilters = useCallback(() => {
        setActiveTab("All reviews");
        setCurrentPage(1);
        setSearchText("");
        setDebouncedSearchText("");
        setSortBy("latest");
        setMinRating("all");
    }, []);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const pagination = useMemo(() => {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }, [totalPages]);

    const value = useMemo(() => ({
        summaryCards,
        tabs,
        reviews,
        statusColor,
        thumbnailColors,
        pagination,
        totalPages,
        pageSize,
        activeTab,
        setActiveTab,
        currentPage,
        setCurrentPage,
        searchText,
        setSearchText,
        sortBy,
        setSortBy,
        minRating,
        setMinRating,
        isLoading,
        isUpdatingReviewId,
        updateReviewStatus,
        reloadReviews: loadReviews,
        refreshReviewSummary,
        clearReviewFilters,
    }), [summaryCards, tabs, reviews, pagination, totalPages, activeTab, currentPage, searchText, sortBy, minRating, isLoading, isUpdatingReviewId, updateReviewStatus, loadReviews, refreshReviewSummary, clearReviewFilters]);

    return <ProductReviewsContext.Provider value={value}>{children}</ProductReviewsContext.Provider>;
};
