import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import productFallbackImage from '../../../assets/product.png';
import { useDashboard } from '../../../Context/dashboard/useDashboard';

const TopProduct = () => {
    const { topProducts, isTopProductsLoading, reloadTopProducts } = useDashboard();
    const [searchText, setSearchText] = useState('');
    const hasMountedRef = useRef(false);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        const debounceId = setTimeout(() => {
            reloadTopProducts(searchText.trim());
        }, 300);

        return () => clearTimeout(debounceId);
    }, [reloadTopProducts, searchText]);

    const visibleProducts = Array.isArray(topProducts) ? topProducts : [];

    return (
        <div className='w-112.5 min-w-75 h-105 px-4 py-5 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg '>
            <div className='flex items-center justify-between'>
                <h2 className='text-[#23272E] dark:text-[#c1c6cf] font-bold text-[18px]'>Top Products</h2>
                <Link to='/product-list' className='text-[#6467F2] text-[12px] font-Regular'>All product</Link>
            </div>
            <div className='mt-3 h-9 flex items-center gap-1.5 p-2 rounded-lg bg-[#6a717f03] border border-[#EAF8E7] dark:border-[#3D424A] text-[#6A717F] text-[14px] font-Regular'>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.3269 14.44L18.8 17.8M17.68 8.84C17.68 13.1699 14.1699 16.68 9.84 16.68C5.51009 16.68 2 13.1699 2 8.84C2 4.51009 5.51009 1 9.84 1C14.1699 1 17.68 4.51009 17.68 8.84Z" strokeWidth="2" strokeLinecap="round" className='stroke-[#6A717F]' />
                </svg>
                <input
                    type="text"
                    placeholder='Search'
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    className='border-none outline-none bg-transparent flex-1'
                />
            </div>
            <div className='mt-4 overflow-y-auto h-73 scrollbarNone'>
                {isTopProductsLoading ? (
                    <div className='py-10 text-center text-[#8B909A] text-[13px]'>Loading top products...</div>
                ) : visibleProducts.length > 0 ? (
                    visibleProducts.map((product) => (
                        <div key={product.id || product._id} className='flex gap-3 items-center p-2 border-b-2 border-[#D1D1D1] dark:border-[#3D424A]'>
                            <div className='w-14 h-14 shrink-0 overflow-hidden rounded-md bg-[#F3F4F6] dark:bg-[#1F2937]'>
                                <img
                                    src={product.image || productFallbackImage}
                                    alt={product.productName || 'Product'}
                                    className='w-full h-full object-cover'
                                />
                            </div>
                            <div className='min-w-0 flex-1'>
                                <h3 className='truncate text-[#23272E] dark:text-[#c1c6cf] font-medium text-[15px] tracking-[-0.01em]'>
                                    {product.productName || 'Untitled product'}
                                </h3>
                                <p className='truncate text-[#8B909A] text-[12px] font-Regular'>
                                    {product.categoryName || 'Uncategorized'}
                                </p>
                            </div>
                            <div className='shrink-0 text-right'>
                                <h3 className='text-[#23272E] dark:text-[#c1c6cf] font-bold text-[15px]'>
                                    ₹{Number(product.price || 0).toFixed(2)}
                                </h3>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className='py-10 text-center text-[#8B909A] text-[13px]'>No top products found.</div>
                )}
            </div>
        </div>
    )
}

export default TopProduct;