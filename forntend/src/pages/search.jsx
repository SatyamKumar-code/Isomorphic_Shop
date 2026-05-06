import React, { useEffect, useState, useContext } from 'react'
import SerchBox from '../components/serchBox'
import { FaRegHeart } from 'react-icons/fa'
import { IoMdAddCircle } from "react-icons/io";
import { Link, useSearchParams } from 'react-router-dom';
import Footer from '../components/footer';
import { fetchDataFromApi, postData } from '../utils/api';
import { MyContext } from '../App';

const Search = () => {
    const context = useContext(MyContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [addingProductId, setAddingProductId] = useState(null);

    useEffect(() => {
        setSearchTerm(searchParams.get('q') || '');
    }, [searchParams]);

    useEffect(() => {
        let isMounted = true;

        const loadProducts = async () => {
            setIsLoading(true);

            const query = searchTerm.trim();
            const endpoint = query
                ? `/api/product/search?q=${encodeURIComponent(query)}`
                : '/api/product/latest';

            const response = await fetchDataFromApi(endpoint);

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
    }, [searchTerm]);

    const handleSearch = (value) => {
        const nextQuery = value.trim();
        setSearchParams(nextQuery ? { q: nextQuery } : {});
    };

    const handleAddToCart = async (productId) => {
        if (!productId || addingProductId) {
            return;
        }

        setAddingProductId(productId);
        const response = await postData('/api/cart/add', {
            productId,
            quantity: 1,
        });
        setAddingProductId(null);

        if (response?.error === false) {
            context.alertBox('Success', 'Added to cart');
            window.location.href = '/cart';
            return;
        }

        context.alertBox('error', response?.message || 'Unable to add product to cart.');
    };

    return (
        <div>
            <SerchBox value={searchTerm} onSearch={handleSearch} />
            <div className='flex items-center justify-between mt-4'>
                <h2 className='font-bold text-[14px] text-gray-500 '>Results for <span className='text-black text-[16px]'>"{searchTerm || 'latest products'}"</span></h2>
                <p className='text-blue-500 text-[14px] font-bold'>{products.length} Results Found</p>
            </div>

            {isLoading ? (
                <div className='mt-4 text-sm text-gray-500'>Loading products...</div>
            ) : (
                <div className='grid grid-cols-2 gap-4 mt-4 mb-20 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7'>
                    {products.length > 0 ? products.map((product) => {
                        const productId = product?._id || product?.id;
                        const image = product?.images?.[0] || 'https://via.placeholder.com/300x300?text=Product';

                        return (
                            <div key={productId} className='relative h-45.75 overflow-hidden rounded-lg bg-white'>
                                <Link to={`/product/${productId}`}>
                                    <img src={image} alt={product?.productName || 'Product'} className='w-full! h-34.75! rounded-t-lg object-cover' />
                                </Link>
                                <div className='flex items-center justify-between p-2 w-full h-11 overflow-hidden leading-tight bg-gray-100'>
                                    <div className='w-full overflow-hidden leading-tight'>
                                        <h2 className='truncate text-[12px] font-bold'>{product?.productName || 'Product Name'}</h2>
                                        <p className='text-[12px] font-bold text-blue-500'>₹{Number(product?.price || 0).toLocaleString('en-IN')}</p>
                                    </div>
                                    <button type='button' onClick={() => handleAddToCart(productId)} className='text-blue-500 text-2xl cursor-pointer disabled:opacity-60' disabled={addingProductId === productId}>
                                        <IoMdAddCircle />
                                    </button>
                                </div>
                                <div className='absolute top-2 right-2'>
                                    <FaRegHeart className='text-gray-500 text-lg' />
                                </div>
                            </div>
                        );
                    }) : (
                        <div className='col-span-full rounded-lg bg-gray-100 p-4 text-sm text-gray-600'>No products found.</div>
                    )}
                </div>
            )}

            <Footer />
        </div>
    )
}

export default Search