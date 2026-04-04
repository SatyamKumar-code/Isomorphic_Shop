

const categories = [
    {
        name: "Electronic",
        img: "https://img.icons8.com/ios-filled/50/000000/laptop.png",
    },
    {
        name: "Fashion",
        img: "https://img.icons8.com/ios-filled/50/000000/t-shirt.png",
    },
    {
        name: "Home",
        img: "https://img.icons8.com/ios-filled/50/000000/sofa.png",
    },
];

const products = [
    {
        name: "Smart Fitness Tracker",
        price: "$39.99",
        img: "https://img.icons8.com/ios-filled/50/000000/laptop.png",
    },
    {
        name: "Leather Wallet",
        price: "$19.99",
        img: "https://img.icons8.com/ios-filled/50/000000/wallet-app.png",
    },
    {
        name: "Electric Hair Trimmer",
        price: "$34.99",
        img: "https://img.icons8.com/ios-filled/50/000000/sofa.png",
    },
];

const AddProductSidebar = () => {
    return (
        <div className="add-product-card min-w-81 w-143 p-5 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg">
            <div className="sidebar-header flex items-center-safe justify-between">
                <span className="sidebar-title font-bold text-[14px] leading-6.5 text-[#23272E] dark:text-[#c1c6cf]">Add New Product</span>
                <button className="add-new-btn flex items-center gap-1 font-[14px] text-[#6467F2] tracking-[-0.02em]">
                    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="7.5" stroke="#6467F2" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                        <circle cx="10" cy="10" r="7.5" stroke="#6467F2" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M7.5 10H12.5" stroke="#6467F2" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M7.5 10H12.5" stroke="#6467F2" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M10 7.5V12.5" stroke="#6467F2" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M10 7.5V12.5" stroke="#6467F2" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span className="text-[14px]! ">Add New</span>

                </button>
            </div>
            <div className="sidebar-section">
                <div className="section-label text-[#6A717F] text-[14px] tracking-[-0.02em] mb-2">Categories</div>
                <div className="categories-list flex-col gap-3">
                    {categories.map((cat) => (
                        <div className="category-card flex items-center justify-between p-1.5 bg-[#FFFFFF] shadow-sm inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 dark:bg-gray-950 rounded-lg w-full h-[58px] mb-3" key={cat.name}>
                            <div className="category-info flex items-center gap-3">
                                <div className="w-[46px] flex items-center justify-center h-[46px] bg-[#f7f7fa] shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 dark:bg-gray-950  rounded-sm">
                                    <img src={cat.img} alt={cat.name} className="category-img w-[36px] h-[36px]" />
                                </div>
                                <span className="category-name text-[14px] text-[#23272E] dark:text-[#c1c6cf] tracking-[-0.02em]">{cat.name}</span>
                            </div>
                            <span className="category-arrow text-[26px] text-[#23272E] dark:text-[#c1c6cf] tracking-[-0.02em] mr-1">›</span>
                        </div>
                    ))}
                </div>
                <div className="see-more text-[#6467F2] text-[14px] flex justify-center mt-1.5 cursor-pointer tracking-[-0.02em]">See more</div>
            </div>
            <div className="sidebar-section">
                <div className="section-label text-[#6A717F] text-[14px] tracking-[-0.02em] mb-2 ">Product</div>
                <div className="products-list">
                    {products.map((prod) => (
                        <div className="product-card flex items-center justify-between p-1.5 bg-[#FFFFFF] shadow-sm inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 dark:bg-gray-950 rounded-lg w-full h-[58px] mb-3" key={prod.name}>
                            <div className="w-11.5 flex items-center justify-center h-[46px] bg-[#f7f7fa] shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 dark:bg-gray-950  rounded-sm mr-3">
                                <img src={prod.img} alt={prod.name} className="product-img" />
                            </div>
                            <div className="product-info flex-1">
                                <div className="product-name text-[14px] text-[#23272E] dark:text-[#c1c6cf] tracking-[-0.02em]">{prod.name}</div>
                                <div className="product-price text-[13px] tracking-[-0.02em] text-[#4EA674] font-bold">{prod.price}</div>
                            </div>
                            <button className="add-btn bg-[#4EA674] rounded-full min-w-[62px] min-h-[28px] flex items-center justify-center text-[12px] text-[#FFFFFF] pl-2 pr-3 gap-1 ">
                                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="10" cy="10" r="7.5" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                                    <circle cx="10" cy="10" r="7.5" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M7.5 10H12.5" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M7.5 10H12.5" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M10 7.5V12.5" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M10 7.5V12.5" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                Add
                            </button>
                        </div>
                    ))}
                </div>
                <div className="see-more text-[#6467F2] text-[14px] flex justify-center mt-1.5 cursor-pointer tracking-[-0.02em]">See more</div>
            </div>
        </div>
    );
};

export default AddProductSidebar;
