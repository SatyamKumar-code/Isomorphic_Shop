import { useContext } from 'react';
import { AddProductContext } from './AddProductContext';

export const useAddProduct = () => useContext(AddProductContext);
