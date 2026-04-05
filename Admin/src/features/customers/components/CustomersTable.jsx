import React from "react";
import { FiMessageSquare, FiTrash2 } from "react-icons/fi";
import { useCustomers } from "../../../Context/customers/useCustomers";

const formatAmount = (value) => value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const StatusPill = ({ status, color }) => (
    <span className="inline-flex items-center gap-2 text-[12px] font-medium" style={{ color }}>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {status}
    </span>
);

const ActionButtons = () => (
    <div className="flex items-center gap-3 text-slate-500">
        <FiMessageSquare className="text-[16px]" />
        <FiTrash2 className="text-[16px]" />
    </div>
);

const CustomersTable = () => {
    const { customers, selectedCustomerId, setSelectedCustomerId, statusColors } = useCustomers();

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border-collapse whitespace-nowrap text-left">
                <thead>
                    <tr className="bg-[#EAF8E7] text-[12px] font-semibold text-slate-600">
                        <th className="rounded-l-lg px-4 py-3">Customer Id</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Order Count</th>
                        <th className="px-4 py-3">Total Spend</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="rounded-r-lg px-4 py-3">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((customer) => {
                        const isSelected = customer.uid === selectedCustomerId;

                        return (
                            <tr
                                key={customer.uid}
                                className={`border-b border-slate-200 text-[13px] text-slate-700 transition dark:border-slate-800 dark:text-slate-200 ${isSelected ? "bg-emerald-50/70 dark:bg-emerald-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-900/40"}`}
                                onClick={() => setSelectedCustomerId(isSelected ? null : customer.uid)}
                            >
                                <td className="px-4 py-4 font-medium text-slate-500">{customer.id}</td>
                                <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{customer.name}</td>
                                <td className="px-4 py-4">{customer.phone}</td>
                                <td className="px-4 py-4">{customer.orderCount}</td>
                                <td className="px-4 py-4">{formatAmount(customer.totalSpend)}</td>
                                <td className="px-4 py-4"><StatusPill status={customer.status} color={statusColors[customer.status]} /></td>
                                <td className="px-4 py-4"><ActionButtons /></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default CustomersTable;