import FilterButton from "../../../shared/components/FilterButon";

const bestSelingProduct = [
    { product: "Apple iphone 13", img: "data:image/jpeg;base64,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", totalOrder: "120", status: "Stock", price: "$64" },
    { product: "Samsung Galaxy S21", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTm5hHANz6aT-5NcugwT6goIfCECJFzLUW4pQ&s", totalOrder: "95", status: "Stock out", price: "$557" },
    { product: "Google Pixel 6", img: "https://5.imimg.com/data5/SELLER/Default/2023/8/337487291/EC/WR/UP/189620676/oneplus-nord-ce-3-5g.jpg", totalOrder: "150", status: "Stock", price: "$156" },
    { product: "OnePlus 9 Pro", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLOx2Gu4qEIcCkYw7GyRu2oHHPjx7E2Lrqww&s", totalOrder: "80", status: "Stock", price: "$265" },
    { product: " Xiaomi Mi 11", img: "https://png.pngtree.com/png-clipart/20210309/original/pngtree-android-realistic-mobile-phone-mockup-png-image_5840261.jpg", totalOrder: "110", status: "Stock", price: "$265" },
];

const statusColor = {
    "Stock": "#22C55E",
    "Stock out": "#EF4444"
};

export default function BestSelingProductTable() {
    return (
        <div className="transaction-card w-full min-w-120 h-full ml-5 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg ">
            <div className="transaction-header W-full relative!">
                <span className="text-[18px] text-[#23272E] dark:text-[#c1c6cf] font-bold leading-4.5">Best selling product</span>
                <FilterButton />
            </div>
            <div className="px-5 overflow-x-auto scrollbarNone">
                <table className="transaction-table whitespace-nowrap">
                    <thead className=" bg-[#EAF8E7] dark:bg-transparent rounded-t-lg overflow-hidden">
                        <tr className="text-[#7C7C7C]">
                            <th className="rounded-l-lg px-2 py-1 min-w-25 max-w-35 text-xs">PRODUCT</th>
                            <th className="px-2 py-1 min-w-10 max-w-11 text-xs">ORDER</th>
                            <th className="px-2 py-1 min-w-15 max-w-20 text-xs">STATUS</th>
                            <th className="rounded-r-lg px-2 py-1 min-w-15 max-w-20 text-xs">PRICE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bestSelingProduct.map((t, idx) => (
                            <tr
                                className="text-[#000000] dark:text-[#c1c6cf]"
                                key={idx}>
                                <td className="px-2 flex items-center py-1 min-w-25 max-w-35 text-xs">
                                    <div className="min-w-9 flex items-center justify-center min-h-9 p-1">
                                        <img src={t.img} alt={t.name} className="w-9 h-9 mr-1" />
                                    </div>
                                    {t.product}
                                </td>
                                <td className="px-2 py-1 min-w-10 max-w-11 text-xs">{t.totalOrder}</td>
                                <td className="px-2 py-1 min-w-15 max-w-20 text-xs" style={{ color: statusColor[t.status] }}>
                                    <span
                                        className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                                        style={{ background: statusColor[t.status] }}
                                    ></span>
                                    {t.status}
                                </td>
                                <td className="px-2 py-1 min-w-15 max-w-20 text-xs">{t.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="transaction-footer">
                <button className="details-btn">Details</button>
            </div>
        </div>
    );
}
