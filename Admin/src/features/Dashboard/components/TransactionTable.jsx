import React from "react";
import "./styles/TransactionTable.css";
import FilterButton from "../../../shared/components/FilterButon";
import { useDashboard } from "../../../Context/dashboard/useDashboard";
import { useAuth } from "../../../Context/auth/useAuth";

export default function TransactionTable() {
    const { transactions, isTransactionsLoading } = useDashboard();
    const { userData } = useAuth();

    const isAdmin = userData?.role === "admin";

    // Use fetched transactions or empty array
    const tableData = transactions || [];

    const statusColor = {
        "paid": "#22C55E",
        "Paid": "#22C55E",
        "pending": "#EAB308",
        "Pending": "#EAB308",
        "completed": "#22C55E",
        "failed": "#EF4444",
        "Failed": "#EF4444",
    };

    const formatStatus = (status) => {
        if (!status) return "N/A";
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    return (
        <div className="transaction-card relative w-full min-w-125 ml-5 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg overflow-x-auto scrollbarNone">
            <div className="transaction-header W-full relative!">
                <span className="text-[18px] text-[#23272E] dark:text-[#c1c6cf] font-bold leading-4.5">Transaction</span>
                {/* <FilterButton /> */}
            </div>
            {isTransactionsLoading ? (
                <div className="p-4 text-center text-gray-500">Loading transactions...</div>
            ) : (
                <table className="transaction-table whitespace-nowrap">
                    <thead>
                        <tr className="text-[#7C7C7C]">
                            <th className="min-w-12 text-xs">No</th>
                            <th className="min-w-20 text-xs">Order ID</th>
                            <th className="min-w-20 text-xs">Customer ID</th>
                            {isAdmin && (
                                <th className="min-w-20 text-xs">Seller ID</th>
                            )}
                            <th className="min-w-32 text-xs">Order Date</th>
                            <th className="min-w-20 text-xs">Status</th>
                            <th className="min-w-20 text-xs">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.length > 0 ? (
                            tableData.map((t) => (
                                <tr
                                    className="text-[#000000] dark:text-[#c1c6cf]"
                                    key={t.id}>
                                    <td className="min-w-12 text-xs">{t.no}.</td>
                                    <td className="min-w-20 text-xs">#{t.orderId}</td>
                                    <td className="min-w-20 text-xs">#{t.customerId}</td>
                                    {isAdmin && (
                                        <td className="min-w-20 text-xs">#{t.sellerId || "N/A"}</td>
                                    )}
                                    <td className="min-w-32 text-xs">{t.date}</td>
                                    <td className="min-w-20 text-xs" style={{ color: statusColor[t.status] || "#7C7C7C" }}>
                                        <span
                                            className="status-dot"
                                            style={{ background: statusColor[t.status] || "#7C7C7C" }}
                                        ></span>
                                        {formatStatus(t.status)}
                                    </td>
                                    <td className="min-w-20 text-xs">{t.amount}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={isAdmin ? 6 : 5} className="p-4 text-center text-gray-500">
                                    No transactions available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
            {/* <div className="transaction-footer">
                <button className="details-btn">Details</button>
            </div> */}
        </div>
    );
}
