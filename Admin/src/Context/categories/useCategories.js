import { useContext } from 'react';
import { CategoriesContext } from './CategoriesContext';

export const useCategories = () => useContext(CategoriesContext);
