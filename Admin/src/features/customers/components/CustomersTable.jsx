import React from "react";
import { FiMoreVertical } from "react-icons/fi";
import { FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useCustomers } from "../../../Context/customers/useCustomers";
import { forceCustomerLogout, sendCustomerResetPasswordLink, updateCustomerNote, updateCustomerStatus } from "../CustomersAPI";
import CsvExportDialog from "../../../shared/components/CsvExportDialog";
import { useCsvExportDialog } from "../../../shared/hooks/useCsvExportDialog";

const formatAmount = (value) => value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const StatusPill = ({ status, color }) => (
    <span className="inline-flex items-center gap-2 text-[12px] font-medium" style={{ color }}>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {status}
    </span>
);

const parseRegistrationDate = (value) => {
    if (!value) return null;

    const parts = String(value).split(".");
    if (parts.length !== 3) return null;

    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
};

const CustomersTable = () => {
    const {
        customers,
        allCustomers,
        selectedCustomerId,
        setSelectedCustomerId,
        statusColors,
        customerSearch,
        setCustomerSearch,
        customerStatusFilter,
        setCustomerStatusFilter,
        customerOrderSort,
        setCustomerOrderSort,
        customerSpendSort,
        setCustomerSpendSort,
        pageSize,
        setPageSize,
        reloadCustomers,
    } = useCustomers();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [activeRowActionId, setActiveRowActionId] = React.useState("");
    const [updatingCustomerId, setUpdatingCustomerId] = React.useState("");

    const handleOrderSortChange = (value) => {
        setCustomerOrderSort(value);
        if (value !== "none" && customerSpendSort !== "none") {
            setCustomerSpendSort("none");
        }
    };

    const handleSpendSortChange = (value) => {
        setCustomerSpendSort(value);
        if (value !== "none" && customerOrderSort !== "none") {
            setCustomerOrderSort("none");
        }
    };

    const handleStatusChange = async (customer, nextStatus) => {
        if (!customer?.uid || !nextStatus || nextStatus === customer.status) {
            return;
        }

        try {
            setUpdatingCustomerId(customer.uid);
            await updateCustomerStatus(customer.uid, nextStatus);
            toast.success("Customer status updated");
            reloadCustomers();
        } catch {
            toast.error("Failed to update customer status");
        } finally {
            setUpdatingCustomerId("");
        }
    };

    React.useEffect(() => {
        if (!isMenuOpen && !activeRowActionId) {
            return undefined;
        }

        const handleOutsideClick = (event) => {
            const clickedMenu = event.target.closest(".customers-more-menu");
            const clickedTrigger = event.target.closest(".customers-more-menu-trigger");
            const clickedRowMenu = event.target.closest(".customer-row-action-menu");
            const clickedRowTrigger = event.target.closest(".customer-row-action-trigger");

            if (!clickedMenu && !clickedTrigger) {
                setIsMenuOpen(false);
            }

            if (!clickedRowMenu && !clickedRowTrigger) {
                setActiveRowActionId("");
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isMenuOpen, activeRowActionId]);

    const handleSendResetLink = async (customer) => {
        try {
            await sendCustomerResetPasswordLink(customer.uid);
            toast.success("Reset password OTP sent");
            setActiveRowActionId("");
        } catch {
            toast.error("Failed to send reset link");
        }
    };

    const handleForceLogout = async (customer) => {
        try {
            await forceCustomerLogout(customer.uid);
            toast.success("User sessions invalidated");
            setActiveRowActionId("");
        } catch {
            toast.error("Failed to force logout");
        }
    };

    const handleVipToggle = async (customer) => {
        const nextStatus = customer.status === "VIP" ? "Active" : "VIP";
        await handleStatusChange(customer, nextStatus);
        setActiveRowActionId("");
    };

    const handleSoftBlockToggle = async (customer) => {
        const nextStatus = customer.status === "Blocked" ? "Active" : "Blocked";
        await handleStatusChange(customer, nextStatus);
        setActiveRowActionId("");
    };

    const handleQuickNote = async (customer) => {
        const currentNote = customer.supportNote || "";
        const nextNote = window.prompt("Add quick note", currentNote);
        if (nextNote === null) {
            return;
        }

        try {
            await updateCustomerNote(customer.uid, nextNote);
            toast.success("Quick note saved");
            reloadCustomers();
            setActiveRowActionId("");
        } catch {
            toast.error("Failed to save note");
        }
    };

    const handleLastActivityView = (customer) => {
        const notePreview = customer.supportNote ? customer.supportNote : "No note";
        const activityText = [
            `Last login: ${customer.lastLoginDate || "N/A"}`,
            `Last purchase: ${customer.lastPurchaseDate || "N/A"}`,
            `Total orders: ${customer.orderCount || 0}`,
            `Quick note: ${notePreview}`,
        ].join("\n");

        window.alert(activityText);
        setActiveRowActionId("");
    };

    const handleOrderHistoryShortcut = (customer) => {
        navigate(`/order-management?customerId=${customer.uid}`);
        setActiveRowActionId("");
    };

    const handleExportSingleCustomer = (customer) => {
        buildCsvAndDownload([customer], `customer-${customer.uid}.csv`);
        toast.success("Customer exported");
        setActiveRowActionId("");
    };

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
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-[16px] font-semibold text-slate-900 dark:text-slate-50">Customer Details</div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={customerSearch}
                            onChange={(event) => setCustomerSearch(event.target.value)}
                            placeholder="Search name, email, phone..."
                            className="h-9 min-w-64 rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200 dark:focus:border-emerald-600 dark:focus:ring-emerald-900/40"
                        />
                    </div>

                    <div className="relative">
                        <button
                            type="button"
                            className="customers-more-menu-trigger inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200 dark:hover:bg-gray-900"
                            onClick={() => setIsMenuOpen((prev) => !prev)}
                        >
                            More Action
                            <FiMoreVertical />
                        </button>

                        {isMenuOpen ? (
                            <div className="customers-more-menu absolute right-0 z-20 mt-2 min-w-44 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950">
                                <div className="px-4 py-3">
                                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Rows per page</label>
                                    <select
                                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                        value={pageSize}
                                        onChange={(event) => setPageSize(Number(event.target.value))}
                                    >
                                        {[5, 10, 20, 50].map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="px-4 pb-3">
                                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Status filter</label>
                                    <select
                                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                        value={customerStatusFilter}
                                        onChange={(event) => setCustomerStatusFilter(event.target.value)}
                                    >
                                        <option value="all">All</option>
                                        <option value="active">Active</option>
                                        <option value="blocked">Blocked</option>
                                        <option value="vip">VIP</option>
                                    </select>
                                </div>

                                <div className="px-4 pb-3">
                                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Total orders sort</label>
                                    <select
                                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                        value={customerOrderSort}
                                        onChange={(event) => handleOrderSortChange(event.target.value)}
                                    >
                                        <option value="none">Default</option>
                                        <option value="asc">Low to High</option>
                                        <option value="desc">High to Low</option>
                                    </select>
                                </div>

                                <div className="px-4 pb-3">
                                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Total spend sort</label>
                                    <select
                                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                        value={customerSpendSort}
                                        onChange={(event) => handleSpendSortChange(event.target.value)}
                                    >
                                        <option value="none">Default</option>
                                        <option value="asc">Low to High</option>
                                        <option value="desc">High to Low</option>
                                    </select>
                                </div>

                                <div className="h-px bg-slate-200 dark:bg-slate-700" />

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
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse whitespace-nowrap text-left">
                    <thead>
                        <tr className="bg-[#EAF8E7] text-[12px] font-semibold text-slate-600">
                            <th className="rounded-l-lg px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
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
                                >
                                    <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{customer.name}</td>
                                    <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{customer.email}</td>
                                    <td className="px-4 py-4">{customer.phone}</td>
                                    <td className="px-4 py-4">{customer.orderCount}</td>
                                    <td className="px-4 py-4">{formatAmount(customer.totalSpend)}</td>
                                    <td className="px-4 py-4"><StatusPill status={customer.status} color={statusColors[customer.status]} /></td>
                                    <td className="px-4 py-4">
                                        <div className="relative">
                                            <button
                                                type="button"
                                                className="customer-row-action-trigger rounded border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setActiveRowActionId((current) => (current === customer.uid ? "" : customer.uid));
                                                }}
                                                title="Customer actions"
                                            >
                                                <FiMoreVertical className="text-[14px]" />
                                            </button>

                                            {activeRowActionId === customer.uid ? (
                                                <div
                                                    className="customer-row-action-menu absolute right-0 top-9 z-20 min-w-56 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950"
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => setSelectedCustomerId(customer.uid)}>View Profile</button>
                                                    <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleSendResetLink(customer)}>Send Reset Password Link</button>
                                                    <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleForceLogout(customer)}>Force Logout User</button>
                                                    <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleVipToggle(customer)}>{customer.status === "VIP" ? "Remove VIP" : "Mark as VIP"}</button>
                                                    <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleQuickNote(customer)}>Quick Note</button>
                                                    <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleLastActivityView(customer)}>Last Activity View</button>
                                                    <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleSoftBlockToggle(customer)}>{customer.status === "Blocked" ? "Unblock User" : "Soft Block User"}</button>
                                                    <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleOrderHistoryShortcut(customer)}>Order History Shortcut</button>
                                                    <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleExportSingleCustomer(customer)}>Export Single Customer</button>
                                                </div>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {!customers.length ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                    No customers found for this search.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>

            <CsvExportDialog
                title="Export Customers CSV"
                modeLabelMap={modeLabelMap}
                exportState={exportState}
            />
        </>
    );
};

export default CustomersTable;