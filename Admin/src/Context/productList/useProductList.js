import { useContext } from 'react';
import { ProductListContext } from './ProductListContext';

export const useProductList = () => useContext(ProductListContext);
