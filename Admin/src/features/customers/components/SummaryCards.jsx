import React from "react";
import { FiMoreVertical } from "react-icons/fi";
import { useCustomers } from "../../../Context/customers/useCustomers";

const SummaryCards = () => {
    const { summaryCards } = useCustomers();

    return (
        <div className="space-y-4 xl:w-[28%]">
            {summaryCards.map((card) => (
                <div key={card.title} className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-gray-950 dark:shadow-slate-800/70">
                    <button className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label={`${card.title} actions`}>
                        <FiMoreVertical />
                    </button>
                    <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-50">{card.title}</div>
                    <div className="mt-4 flex items-end gap-3">
                        <div className="text-[28px] font-semibold leading-none text-slate-950 dark:text-slate-50">{card.value}</div>
                        <div className="mb-1 text-[12px] font-semibold text-emerald-500">↑ {card.change}</div>
                    </div>
                    <div className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">Last 7 days</div>
                </div>
            ))}
        </div>
    );
};

export default SummaryCards;