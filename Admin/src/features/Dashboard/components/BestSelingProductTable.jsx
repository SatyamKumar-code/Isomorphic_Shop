import { useMemo, useState } from "react";
import productFallbackImage from "../../../assets/product.png";
import { useAuth } from "../../../Context/auth/useAuth";
import { useDashboard } from "../../../Context/dashboard/useDashboard";
import FilterButton from "../../../shared/components/FilterButon";

const statusColor = {
    "Stock": "#22C55E",
    "Stock out": "#EF4444",
};

const salesColor = "#0EA5E9";

const formatCurrency = (value) => {
    if (typeof value === "string" && value.trim()) {
        return value;
    }

    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

export default function BestSelingProductTable() {
    const { bestSellingProducts, isBestSellingProductsLoading, reloadBestSellingProducts, sellerOptions } = useDashboard();
    const { userData } = useAuth();
    const isAdmin = userData?.role === "admin";
    const [sellerId, setSellerId] = useState("");
    const [sellerSearchTerm, setSellerSearchTerm] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const tableData = useMemo(() => (Array.isArray(bestSellingProducts) ? bestSellingProducts : []), [bestSellingProducts]);
    const sellerList = useMemo(() => {
        const normalizedSearch = sellerSearchTerm.trim().toLowerCase();

        if (!normalizedSearch) {
            return sellerOptions;
        }

        return sellerOptions.filter((seller) => seller.name.toLowerCase().includes(normalizedSearch));
    }, [sellerOptions, sellerSearchTerm]);

    const selectedSellerLabel = useMemo(() => {
        if (!sellerId) {
            return "All sellers";
        }

        return sellerOptions.find((seller) => seller.id === sellerId)?.name || "Selected seller";
    }, [sellerId, sellerOptions]);

    const handleApplyFilter = async () => {
        await reloadBestSellingProducts(sellerId.trim());
        setIsFilterOpen(false);
    };

    const handleClearFilter = async () => {
        setSellerId("");
        setSellerSearchTerm("");
        await reloadBestSellingProducts("");
        setIsFilterOpen(false);
    };

    return (
        <div className="transaction-card flex h-150 w-full min-w-120 flex-col ml-5 overflow-hidden shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg">
            <div className="transaction-header W-full relative!">
                <span className="text-[18px] text-[#23272E] dark:text-[#c1c6cf] font-bold leading-4.5">Best selling product</span>
                {isAdmin ? (
                    <div className="flex items-center gap-2">
                        <FilterButton onClick={() => setIsFilterOpen((value) => !value)}>
                            {isFilterOpen ? "Close" : "Filter"}
                        </FilterButton>
                    </div>
                ) : null}
            </div>
            {isAdmin && isFilterOpen ? (
                <div className="px-5 pt-3 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            value={sellerSearchTerm}
                            onChange={(event) => setSellerSearchTerm(event.target.value)}
                            placeholder="Search seller name"
                            className="min-w-52 flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#4EA674] focus:ring-2 focus:ring-[#4EA674]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                        <select
                            value={sellerId}
                            onChange={(event) => setSellerId(event.target.value)}
                            className="min-w-52 flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#4EA674] focus:ring-2 focus:ring-[#4EA674]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        >
                            <option value="">All sellers</option>
                            {sellerList.map((seller) => (
                                <option key={seller.id} value={seller.id}>
                                    {seller.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="text-[12px] text-[#6A717F] dark:text-[#9CA3AF]">
                        Showing: {selectedSellerLabel}
                    </div>
                    <button
                        type="button"
                        onClick={handleApplyFilter}
                        className="rounded-md bg-[#4EA674] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3f8b62]"
                    >
                        Apply
                    </button>
                    <button
                        type="button"
                        onClick={handleClearFilter}
                        className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-[#23272E] transition hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-900"
                    >
                        Reset
                    </button>
                </div>
            ) : null}
            <div className="flex-1 px-5 overflow-auto scrollbarNone">
                <table className="transaction-table table-fixed w-full whitespace-nowrap">
                    <colgroup>
                        <col style={{ width: "40%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "15%" }} />
                    </colgroup>
                    <thead className=" bg-[#EAF8E7] dark:bg-transparent rounded-t-lg overflow-hidden">
                        <tr className="text-[#7C7C7C]">
                            <th className="rounded-l-lg px-2 py-1 min-w-25 max-w-35 text-xs">PRODUCT</th>
                            <th className="px-2 py-1 min-w-10 max-w-11 text-xs" style={{ color: salesColor }}>TOTAL SALES</th>
                            <th className="px-2 py-1 min-w-10 max-w-11 text-xs">ORDER</th>
                            <th className="px-2 py-1 min-w-15 max-w-20 text-xs">STATUS</th>
                            <th className="rounded-r-lg px-2 py-1 min-w-15 max-w-20 text-xs">PRICE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isBestSellingProductsLoading ? (
                            <tr>
                                <td colSpan={5} className="px-2 py-6 text-center text-gray-500">
                                    Loading best selling products...
                                </td>
                            </tr>
                        ) : tableData.length > 0 ? tableData.map((t) => (
                            <tr
                                className="text-[#000000] dark:text-[#c1c6cf]"
                                key={t.id || t.product}>
                                <td className="px-2 py-1 min-w-25 max-w-35 text-xs overflow-hidden">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="min-w-9 flex items-center justify-center min-h-9 p-1">
                                            <img src={t.img || productFallbackImage} alt={t.product} className="w-9 h-9 mr-1 rounded object-cover" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-xs font-medium">{t.product}</div>
                                            <div className="truncate text-[11px] text-[#6A717F] dark:text-[#9CA3AF]">{t.sellerName || "Unknown Seller"}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-2 py-1 min-w-10 max-w-11 text-xs" style={{ color: salesColor }}>
                                    {t.totalSales}
                                </td>
                                <td className="px-2 py-1 min-w-10 max-w-11 text-xs">{t.totalOrder}</td>
                                <td className="px-2 py-1 min-w-15 max-w-20 text-xs" style={{ color: statusColor[t.status] }}>
                                    <span
                                        className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                                        style={{ background: statusColor[t.status] }}
                                    ></span>
                                    {t.status}
                                </td>
                                <td className="px-2 py-1 min-w-15 max-w-20 text-xs">{formatCurrency(t.price)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-2 py-6 text-center text-gray-500">
                                    No best selling products found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
