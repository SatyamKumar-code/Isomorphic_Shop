import { useContext } from "react";
import { ProductReviewsContext } from "./ProductReviewsContext";

export const useProductReviews = () => useContext(ProductReviewsContext);
