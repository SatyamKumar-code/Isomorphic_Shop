import React from "react";
import "./styles/TransactionTable.css";
import FilterButton from "../../../shared/components/FilterButon";

const transactions = [
    { no: 1, id: "#6545", date: "01 Oct | 11:29 am", status: "Paid", amount: "$64" },
    { no: 2, id: "#5412", date: "01 Oct | 11:29 am", status: "Pending", amount: "$557" },
    { no: 3, id: "#6622", date: "01 Oct | 11:29 am", status: "Paid", amount: "$156" },
    { no: 4, id: "#6462", date: "01 Oct | 11:29 am", status: "Paid", amount: "$265" },
    { no: 5, id: "#6462", date: "01 Oct | 11:29 am", status: "Paid", amount: "$265" },
];

const statusColor = {
    Paid: "#22C55E",
    Pending: "#EAB308",
};

export default function TransactionTable() {
    return (
        <div className="transaction-card w-full min-w-125 ml-5 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg overflow-x-auto scrollbarNone">
            <div className="transaction-header W-full relative!">
                <span className="text-[18px] text-[#23272E] dark:text-[#c1c6cf] font-bold leading-4.5">Transaction</span>
                <FilterButton />
            </div>
            <table className="transaction-table whitespace-nowrap">
                <thead>
                    <tr className="text-[#7C7C7C]">
                        <th className="min-w-15 max-w-25 text-xs">No</th>
                        <th className="min-w-15 max-w-20 text-xs">Id Customer</th>
                        <th className="min-w-25 max-w-30 text-xs">Order Date</th>
                        <th className="min-w-15 max-w-20 text-xs">Status</th>
                        <th className="min-w-15 max-w-25 text-xs">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((t) => (
                        <tr 
                            className="text-[#000000] dark:text-[#c1c6cf]"
                            key={t.no}>
                            <td className="min-w-15 max-w-25 text-xs">{t.no}.</td>
                            <td className="min-w-15 max-w-20 text-xs">{t.id}</td>
                            <td className="min-w-25 max-w-30 text-xs">{t.date}</td>
                            <td className="min-w-15 max-w-20 text-xs" style={{ color: statusColor[t.status] }}>
                                <span
                                    className="status-dot"
                                    style={{ background: statusColor[t.status] }}
                                ></span>
                                {t.status}
                            </td>
                            <td className="min-w-15 max-w-25 text-xs">{t.amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="transaction-footer">
                <button className="details-btn">Details</button>
            </div>
        </div>
    );
}
