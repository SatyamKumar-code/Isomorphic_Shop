import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import Footer from '../components/footer';
import SerchBox from '../components/serchBox';
import { FaRegHeart } from 'react-icons/fa';
import { IoMdAddCircle } from 'react-icons/io';
import { fetchDataFromApi } from '../utils/api';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadProducts = async () => {
            setIsLoading(true);
            const response = await fetchDataFromApi('/api/product?paginate=true&page=1&limit=24&sortBy=latest');

            if (!isMounted) {
                return;
            }

            setProducts(response?.products || []);
            setIsLoading(false);
        };

        loadProducts();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div>
            <SerchBox />
            <div className='mt-4 flex items-center justify-between'>
                <h2 className='text-lg font-bold'>All Products</h2>
                <p className='text-sm font-semibold text-blue-500'>{products.length} items</p>
            </div>

            {isLoading ? (
                <div className='mt-4 text-sm text-gray-500'>Loading products...</div>
            ) : (
                <div className='grid grid-cols-2 gap-4 mt-4 mb-20 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
                    {products.length > 0 ? products.map((product) => {
                        const productId = product?._id || product?.id;
                        const image = product?.images?.[0] || 'https://via.placeholder.com/300x300?text=Product';

                        return (
                            <div key={productId} className='relative h-45.75 overflow-hidden rounded-lg bg-white'>
                                <Link to={`/product/${productId}`}>
                                    <img src={image} alt={product?.productName || 'Product'} className='h-34.75! w-full! rounded-t-lg object-cover' />
                                </Link>
                                <div className='flex h-11 w-full items-center justify-between overflow-hidden bg-gray-100 p-2 leading-tight'>
                                    <div className='w-full overflow-hidden leading-tight'>
                                        <h2 className='truncate text-[12px] font-bold'>{product?.productName || 'Product Name'}</h2>
                                        <p className='text-[12px] font-bold text-blue-500'>₹{Number(product?.price || 0).toLocaleString('en-IN')}</p>
                                    </div>
                                    <IoMdAddCircle className='cursor-pointer text-2xl text-blue-500' />
                                </div>
                                <div className='absolute right-2 top-2'>
                                    <FaRegHeart className='text-lg text-gray-500' />
                                </div>
                            </div>
                        );
                    }) : (
                        <div className='col-span-full rounded-lg bg-gray-100 p-4 text-sm text-gray-600'>No products available.</div>
                    )}
                </div>
            )}

            <Footer />
        </div>
    )
}

export default Products