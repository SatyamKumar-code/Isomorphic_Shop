import React from "react";
import "./TransactionTable.css";
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
        <div className="transaction-card">
            <div className="transaction-header">
                <span>Transaction</span>
                <FilterButton />
            </div>
            <table className="transaction-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Id Customer</th>
                        <th>Order Date</th>
                        <th>Status</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((t) => (
                        <tr key={t.no}>
                            <td>{t.no}.</td>
                            <td>{t.id}</td>
                            <td>{t.date}</td>
                            <td>
                                <span
                                    className="status-dot"
                                    style={{ background: statusColor[t.status] }}
                                ></span>
                                {t.status}
                            </td>
                            <td>{t.amount}</td>
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
