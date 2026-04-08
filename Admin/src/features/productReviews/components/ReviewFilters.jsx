import React from "react";
import { FiMoreVertical, FiSearch, FiSliders } from "react-icons/fi";
import { useProductReviews } from "../../../Context/productReviews/useProductReviews";

const ReviewFilters = ({ activeTab, onTabChange }) => {
    const {
        tabs,
        searchText,
        setSearchText,
        sortBy,
        setSortBy,
        minRating,
        setMinRating,
        reloadReviews,
        clearReviewFilters,
    } = useProductReviews();

    const [showFilterMenu, setShowFilterMenu] = React.useState(false);
    const [showMoreMenu, setShowMoreMenu] = React.useState(false);

    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex rounded-lg bg-[#EAF8E7] p-1 text-sm font-medium text-slate-600">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.label;

                    return (
                        <button
                            key={tab.label}
                            className={`rounded-md px-3 py-1.5 transition ${isActive ? "bg-white text-[#4EA674] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            onClick={() => onTabChange(tab.label)}
                        >
                            {tab.label}{typeof tab.count === "number" ? ` (${tab.count})` : ""}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                <label className="flex min-w-70 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-gray-950 dark:text-slate-400">
                    <FiSearch className="shrink-0" />
                    <input
                        type="text"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="Search product reviews"
                        className="w-full bg-transparent outline-none placeholder:text-slate-400"
                    />
                </label>
                <div className="relative">
                    <button
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:hover:bg-gray-900"
                        onClick={() => {
                            setShowFilterMenu((prev) => !prev);
                            setShowMoreMenu(false);
                        }}
                        aria-label="Filter options"
                    >
                        <FiSliders />
                    </button>

                    {showFilterMenu && (
                        <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-gray-950">
                            <label className="mb-3 block text-xs font-semibold text-slate-500">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(event) => setSortBy(event.target.value)}
                                className="mb-4 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                            >
                                <option value="latest">Latest</option>
                                <option value="oldest">Oldest</option>
                                <option value="ratingHigh">Rating high to low</option>
                                <option value="ratingLow">Rating low to high</option>
                            </select>

                            <label className="mb-3 block text-xs font-semibold text-slate-500">Minimum Rating</label>
                            <select
                                value={minRating}
                                onChange={(event) => setMinRating(event.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                            >
                                <option value="all">All ratings</option>
                                <option value="4">4+ stars</option>
                                <option value="3">3+ stars</option>
                                <option value="2">2+ stars</option>
                                <option value="1">1+ stars</option>
                            </select>

                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                                    onClick={() => {
                                        clearReviewFilters();
                                        setShowFilterMenu(false);
                                    }}
                                >
                                    Reset
                                </button>
                                <button
                                    className="rounded-md bg-[#4EA674] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#409162]"
                                    onClick={() => setShowFilterMenu(false)}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:hover:bg-gray-900"
                        onClick={() => {
                            setShowMoreMenu((prev) => !prev);
                            setShowFilterMenu(false);
                        }}
                        aria-label="More actions"
                    >
                        <FiMoreVertical />
                    </button>

                    {showMoreMenu && (
                        <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg dark:border-slate-700 dark:bg-gray-950">
                            <button
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                                onClick={() => {
                                    reloadReviews();
                                    setShowMoreMenu(false);
                                }}
                            >
                                Refresh list
                            </button>
                            <button
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                                onClick={() => {
                                    setSearchText("");
                                    setShowMoreMenu(false);
                                }}
                            >
                                Clear search
                            </button>
                            <button
                                className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => {
                                    clearReviewFilters();
                                    setShowMoreMenu(false);
                                }}
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewFilters;
