import { Link } from 'react-router-dom';

const TopProduct = () => {
    return (
        <div className='w-112.5 min-w-75 h-105 px-4 py-5 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg '>
            <div className='flex items-center justify-between'>
                <h2 className='text-[#23272E] dark:text-[#c1c6cf] font-bold text-[18px]'>Top Products</h2>
                <Link className='text-[#6467F2] text-[12px] font-Regular'>All product</Link>
            </div>
            <div className='mt-3 h-9 flex items-center gap-1.5 p-2 rounded-lg bg-[#6a717f03] border border-[#EAF8E7] dark:border-[#3D424A] text-[#6A717F] text-[14px] font-Regular'>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.3269 14.44L18.8 17.8M17.68 8.84C17.68 13.1699 14.1699 16.68 9.84 16.68C5.51009 16.68 2 13.1699 2 8.84C2 4.51009 5.51009 1 9.84 1C14.1699 1 17.68 4.51009 17.68 8.84Z" stroke-width="2" stroke-linecap="round" className='stroke-[#6A717F]' />
                </svg>
                <input type="text" placeholder='Search' className='border-none outline-none' />
            </div>
            <div className='mt-4 overflow-y-auto h-73 scrollbarNone'>
                <div className='flex justify-between p-2 border-b-2 border-[#D1D1D1] dark:border-[#3D424A]'>
                    <div className='w-14 h-14 '>
                        <img src="./src/assets/product.png" alt="Product" className='w-full h-full object-cover' />
                    </div>
                    <div className='flex-col gap-1'>
                        <h3 className='text-[#23272E] dark:text-[#c1c6cf] font-medium text-[15px] tracking-[-0.01em]'>Apple Iphone 13</h3>
                        <p className='text-[#8B909A] text-[12px] font-Regular'>Smart Phone</p>
                    </div>
                    <div className='flex items-center-safe' >
                        <h3 className='text-[#23272E] dark:text-[#c1c6cf] font-bold text-[15px]'>$999.00</h3>
                    </div>
                </div>

                <div className='flex justify-between p-2 border-b-2 border-[#D1D1D1] dark:border-[#3D424A]'>
                    <div className='w-14 h-14 '>
                        <img src="./src/assets/product.png" alt="Product" className='w-full h-full object-cover' />
                    </div>
                    <div className='flex-col gap-1'>
                        <h3 className='text-[#23272E] dark:text-[#c1c6cf] font-medium text-[15px] tracking-[-0.01em]'>Apple Iphone 13</h3>
                        <p className='text-[#8B909A] text-[12px] font-Regular'>Smart Phone</p>
                    </div>
                    <div className='flex items-center-safe' >
                        <h3 className='text-[#23272E] dark:text-[#c1c6cf] font-bold text-[15px]'>$999.00</h3>
                    </div>
                </div>

                <div className='flex justify-between p-2 border-b-2 border-[#D1D1D1] dark:border-[#3D424A]'>
                    <div className='w-14 h-14 '>
                        <img src="./src/assets/product.png" alt="Product" className='w-full h-full object-cover' />
                    </div>
                    <div className='flex-col gap-1'>
                        <h3 className='text-[#23272E] dark:text-[#c1c6cf] font-medium text-[15px] tracking-[-0.01em]'>Apple Iphone 13</h3>
                        <p className='text-[#8B909A] text-[12px] font-Regular'>Smart Phone</p>
                    </div>
                    <div className='flex items-center-safe' >
                        <h3 className='text-[#23272E] dark:text-[#c1c6cf] font-bold text-[15px]'>$999.00</h3>
                    </div>
                </div>

                <div className='flex justify-between p-2 border-b-2 border-[#D1D1D1] dark:border-[#3D424A]'>
                    <div className='w-14 h-14 '>
                        <img src="./src/assets/product.png" alt="Product" className='w-full h-full object-cover' />
                    </div>
                    <div className='flex-col gap-1'>
                        <h3 className='text-[#23272E] dark:text-[#c1c6cf] font-medium text-[15px] tracking-[-0.01em]'>Apple Iphone 13</h3>
                        <p className='text-[#8B909A] text-[12px] font-Regular'>Smart Phone</p>
                    </div>
                    <div className='flex items-center-safe' >
                        <h3 className='text-[#23272E] dark:text-[#c1c6cf] font-bold text-[15px]'>$999.00</h3>
                    </div>
                </div>

                <div className='flex justify-between p-2 border-b-2 border-[#D1D1D1] dark:border-[#3D424A]'>
                    <div className='w-14 h-14 '>
                        <img src="./src/assets/product.png" alt="Product" className='w-full h-full object-cover' />
                    </div>
                    <div className='flex-col gap-1'>
                        <h3 className='text-[#23272E] dark:text-[#c1c6cf] font-medium text-[15px] tracking-[-0.01em]'>Apple Iphone 13</h3>
                        <p className='text-[#8B909A] text-[12px] font-Regular'>Smart Phone</p>
                    </div>
                    <div className='flex items-center-safe' >
                        <h3 className='text-[#23272E] dark:text-[#c1c6cf] font-bold text-[15px]'>$999.00</h3>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TopProduct;