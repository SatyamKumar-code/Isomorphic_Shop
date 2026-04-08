import React from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { useProductReviews } from "../../../Context/productReviews/useProductReviews";

const getInitials = (product) => {
    return product
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();
};

const ProductThumb = ({ product, index, thumbnailColors, image }) => {
    const palette = thumbnailColors[index % thumbnailColors.length];

    return (
        <div
            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-[10px] font-bold shadow-sm"
            style={{ backgroundColor: palette.background, color: palette.color }}
            aria-hidden="true"
        >
            {image ? (
                <img src={image} alt={product} className="h-full w-full rounded-md object-cover" loading="lazy" />
            ) : (
                getInitials(product)
            )}
        </div>
    );
};

const RatingStars = ({ rating }) => {
    return (
        <div className="flex items-center gap-1 text-[14px]">
            {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={star <= rating ? "text-amber-400" : "text-slate-300"}>
                    ★
                </span>
            ))}
            <span className="ml-1 text-xs text-slate-500">({rating}.0)</span>
        </div>
    );
};

const StatusPill = ({ status, color }) => (
    <span className="inline-flex items-center gap-2 text-[12px] font-medium" style={{ color }}>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {status}
    </span>
);

const ReviewsTable = () => {
    const { reviews, statusColor, currentPage, pageSize, isLoading, thumbnailColors, updateReviewStatus, isUpdatingReviewId } = useProductReviews();

    if (isLoading) {
        return <div className="mt-6 text-sm text-slate-500">Loading records...</div>;
    }

    return (
        <div className="mt-6 overflow-x-auto scrollbarNone">
            <table className="min-w-full border-collapse whitespace-nowrap text-left">
                <thead>
                    <tr className="rounded-lg bg-[#EAF8E7] text-[12px] font-semibold text-slate-600">
                        <th className="rounded-l-lg px-4 py-3">No.</th>
                        <th className="px-4 py-3">Review Id</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Rating</th>
                        <th className="px-4 py-3">Comment</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="rounded-r-lg px-4 py-3">Action</th>
                    </tr>
                </thead>

                <tbody>
                    {!reviews.length ? (
                        <tr>
                            <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={9}>
                                No reviews found.
                            </td>
                        </tr>
                    ) : (
                        reviews.map((review, index) => (
                            <tr key={review.id} className="border-b border-slate-200 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200">
                                <td className="px-4 py-4">{(currentPage - 1) * pageSize + index + 1}</td>
                                <td className="px-4 py-4 font-medium text-slate-500">{review.id}</td>
                                <td className="px-4 py-4">
                                    <div className="flex max-w-60 items-center gap-3">
                                        <ProductThumb
                                            product={review.product}
                                            index={index}
                                            thumbnailColors={thumbnailColors}
                                            image={review.image}
                                        />
                                        <span className="whitespace-normal leading-5 text-slate-700 dark:text-slate-200">{review.product}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">{review.customer}</td>
                                <td className="px-4 py-4"><RatingStars rating={review.rating} /></td>
                                <td className="max-w-72 px-4 py-4 whitespace-normal">{review.comment}</td>
                                <td className="px-4 py-4">{review.date}</td>
                                <td className="px-4 py-4"><StatusPill status={review.status} color={statusColor[review.status]} /></td>
                                <td className="px-4 py-4">
                                    <div className="inline-flex items-center gap-2">
                                        <button
                                            className="inline-flex h-7 w-7 items-center justify-center rounded border border-emerald-300 text-emerald-600 transition hover:bg-emerald-50"
                                            onClick={() => updateReviewStatus(review.id, "Approved")}
                                            disabled={isUpdatingReviewId === review.id}
                                            aria-label="Approve review"
                                        >
                                            <FiCheck />
                                        </button>
                                        <button
                                            className="inline-flex h-7 w-7 items-center justify-center rounded border border-red-300 text-red-500 transition hover:bg-red-50"
                                            onClick={() => updateReviewStatus(review.id, "Rejected")}
                                            disabled={isUpdatingReviewId === review.id}
                                            aria-label="Reject review"
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ReviewsTable;
