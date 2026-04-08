import React from "react";
import { FiMoreVertical } from "react-icons/fi";
import CsvExportDialog from "../../../shared/components/CsvExportDialog";
import { useCsvExportDialog } from "../../../shared/hooks/useCsvExportDialog";
import { useCustomers } from "../../../Context/customers/useCustomers";

const parseRegistrationDate = (value) => {
    if (!value) return null;

    const parts = String(value).split(".");
    if (parts.length !== 3) return null;

    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
};

const CustomersHeader = () => {
    const { allCustomers } = useCustomers();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const buildCsvAndDownload = React.useCallback((items, fileName) => {
        const headers = [
            "Customer ID",
            "Name",
            "Email",
            "Phone",
            "Order Count",
            "Total Spend",
            "Status",
            "Registration Date",
            "Last Purchase Date",
        ];

        const rows = items.map((customer) => [
            customer.id,
            customer.name,
            customer.email,
            customer.phone,
            customer.orderCount,
            customer.totalSpend,
            customer.status,
            customer.registrationDate,
            customer.lastPurchaseDate,
        ]);

        const csvText = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, []);

    const exportState = useCsvExportDialog({
        fetchAllItems: async () => allCustomers,
        getItemCreatedAt: (item) => parseRegistrationDate(item?.registrationDate),
        onDownload: async (items, mode, selection) => {
            let fileName = "customers-all-data.csv";
            if (mode === "month") {
                fileName = `customers-${selection.selectedYear}-${selection.selectedMonth}.csv`;
            }
            if (mode === "year") {
                fileName = `customers-${selection.selectedYear}.csv`;
            }
            if (mode === "date") {
                fileName = `customers-${selection.selectedFromDate}-to-${selection.selectedToDate}.csv`;
            }

            buildCsvAndDownload(items, fileName);
        },
        messages: {
            noData: "No customer data available to export",
            prepareError: "Failed to prepare customer export",
            noMonthData: "No customers found for selected month",
            noYearData: "No customers found for selected year",
            noDateData: "No customers found in selected date range",
            successAll: "All customers exported successfully",
            successMonth: "Month-wise export completed",
            successYear: "Year-wise export completed",
            successDate: "Date-to-date export completed",
            exportError: "Failed to export customers",
        },
    });

    const modeLabelMap = {
        all: "Export all available customer data.",
        month: "Select year and month from available customer data.",
        year: "Select year from available customer data.",
        date: "Select date range from available customer dates only.",
    };

    return (
        <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-[22px] font-semibold text-slate-900 dark:text-slate-100">Customers</h3>

                <div className="relative">
                    <button
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200 dark:hover:bg-gray-900"
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                    >
                        More Action
                        <FiMoreVertical />
                    </button>

                    {isMenuOpen ? (
                        <div className="absolute right-0 top-12 z-20 min-w-52 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950">
                            <button
                                className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                                onClick={() => {
                                    exportState.openDialog();
                                    setIsMenuOpen(false);
                                }}
                            >
                                Export CSV
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            <CsvExportDialog
                title="Export Customers CSV"
                modeLabelMap={modeLabelMap}
                exportState={exportState}
            />
        </>
    );
};

export default CustomersHeader;
