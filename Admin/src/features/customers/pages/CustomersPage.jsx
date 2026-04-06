import React from "react";
import SummaryCards from "../components/SummaryCards";
import OverviewChart from "../components/OverviewChart";
import CustomersTable from "../components/CustomersTable";
import CustomerDetailsCard from "../components/CustomerDetailsCard";
import CustomersPagination from "../components/CustomersPagination";
import { useCustomers } from "../../../Context/customers/useCustomers";

const CustomersPage = () => {
    const { overviewStats, weekSeries, activeRange, setActiveRange, activeStat, setActiveStat, selectedCustomerId } = useCustomers();

    const overviewChartProps = {
        title: "Customer Overview",
        stats: overviewStats,
        ranges: [
            { label: "This week", value: "This week" },
            { label: "Last week", value: "Last week" },
        ],
        activeRange,
        onRangeChange: setActiveRange,
        activeStat,
        onStatChange: setActiveStat,
        chartSeries: weekSeries,
    };

    return (
        <div className="w-full overflow-x-auto px-5 pb-6 pt-4 scrollbarNone">
            <div className="flex flex-col gap-4 xl:flex-row">
                <SummaryCards />
                <OverviewChart {...overviewChartProps} />
            </div>

            <div className="mt-5 flex flex-col gap-5 xl:flex-row">
                <div className={selectedCustomerId ? "xl:w-[75%]" : "xl:w-full"}>
                    <div className="p-4 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg">
                        <div className="mb-4 text-[16px] font-semibold text-slate-900 dark:text-slate-50">Customer Details</div>
                        <CustomersTable />
                        <CustomersPagination />
                    </div>
                </div>

                {selectedCustomerId && <CustomerDetailsCard />}
            </div>
        </div>
    );
};

export default CustomersPage;