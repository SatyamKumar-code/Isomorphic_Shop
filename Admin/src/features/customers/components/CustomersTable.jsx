import React from "react";
import { FiMoreVertical } from "react-icons/fi";
import { FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useCustomers } from "../../../Context/customers/useCustomers";
import { useAuth } from "../../../Context/auth/useAuth";
import { forceCustomerLogout, sendCustomerResetPasswordLink, updateCustomerNote, updateCustomerStatus } from "../CustomersAPI";
import CsvExportDialog from "../../../shared/components/CsvExportDialog";
import { useCsvExportDialog } from "../../../shared/hooks/useCsvExportDialog";

const formatAmount = (value) => value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const QUICK_NOTE_MAX_LENGTH = 500;

const formatDateTime = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatAdminMeta = (meta) => {
    if (!meta || typeof meta !== "object") {
        return "System";
    }

    if (meta.adminName) {
        return meta.adminEmail ? `${meta.adminName} (${meta.adminEmail})` : meta.adminName;
    }

    if (meta.adminEmail) {
        return meta.adminEmail;
    }

    return "System";
};

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
    const { userData } = useAuth();
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
        joinDateFrom,
        setJoinDateFrom,
        joinDateTo,
        setJoinDateTo,
        productsCountMin,
        setProductsCountMin,
        productsCountMax,
        setProductsCountMax,
        totalSalesMin,
        setTotalSalesMin,
        totalSalesMax,
        setTotalSalesMax,
        pageSize,
        setPageSize,
        reloadCustomers,
        isSellerView,
        isLoading,
        errorMessage,
    } = useCustomers();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [activeRowActionId, setActiveRowActionId] = React.useState("");
    const [rowActionMenuPosition, setRowActionMenuPosition] = React.useState({ top: 0, left: 0 });
    const [updatingCustomerId, setUpdatingCustomerId] = React.useState("");
    const [activityModalCustomer, setActivityModalCustomer] = React.useState(null);
    const [quickNoteModalCustomer, setQuickNoteModalCustomer] = React.useState(null);
    const [quickNoteDraft, setQuickNoteDraft] = React.useState("");
    const [isSavingQuickNote, setIsSavingQuickNote] = React.useState(false);
    const canRunSensitiveCustomerActions = userData?.role !== "seller";
    const updateRowActionMenuPosition = React.useCallback((customerId) => {
        const trigger = document.querySelector(`[data-row-action-id="${customerId}"]`);
        if (!trigger) {
            return false;
        }

        const triggerRect = trigger.getBoundingClientRect();
        const menuWidth = 224;
        const menuMaxHeight = 208;
        const left = Math.max(8, Math.min(triggerRect.right - menuWidth, window.innerWidth - menuWidth - 8));
        const top = Math.max(8, Math.min(triggerRect.bottom + 6, window.innerHeight - menuMaxHeight - 8));

        setRowActionMenuPosition({ top, left });
        return true;
    }, []);
    const activeRowCustomer = React.useMemo(
        () => customers.find((item) => item.uid === activeRowActionId) || null,
        [customers, activeRowActionId],
    );

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

    React.useEffect(() => {
        if (!activeRowActionId) {
            return undefined;
        }

        const syncRowActionMenuPosition = () => {
            const isPositionUpdated = updateRowActionMenuPosition(activeRowActionId);
            if (!isPositionUpdated) {
                setActiveRowActionId("");
            }
        };

        syncRowActionMenuPosition();
        window.addEventListener("scroll", syncRowActionMenuPosition, true);
        window.addEventListener("resize", syncRowActionMenuPosition);
        return () => {
            window.removeEventListener("scroll", syncRowActionMenuPosition, true);
            window.removeEventListener("resize", syncRowActionMenuPosition);
        };
    }, [activeRowActionId, updateRowActionMenuPosition]);

    React.useEffect(() => {
        if (!activityModalCustomer && !quickNoteModalCustomer) {
            return undefined;
        }

        const handleEscapeClose = (event) => {
            if (event.key === "Escape") {
                setActivityModalCustomer(null);
                setQuickNoteModalCustomer(null);
            }
        };

        document.addEventListener("keydown", handleEscapeClose);
        return () => {
            document.removeEventListener("keydown", handleEscapeClose);
        };
    }, [activityModalCustomer, quickNoteModalCustomer]);

    const handleSendResetLink = async (customer) => {
        if (!canRunSensitiveCustomerActions) {
            toast.error("You are not allowed to perform this action");
            return;
        }

        try {
            await sendCustomerResetPasswordLink(customer.uid);
            toast.success("Reset password OTP sent");
            setActiveRowActionId("");
        } catch {
            toast.error("Failed to send reset link");
        }
    };

    const handleForceLogout = async (customer) => {
        if (!canRunSensitiveCustomerActions) {
            toast.error("You are not allowed to perform this action");
            return;
        }

        try {
            await forceCustomerLogout(customer.uid);
            toast.success("User sessions invalidated");
            setActiveRowActionId("");
        } catch {
            toast.error("Failed to force logout");
        }
    };

    const handleVipToggle = async (customer) => {
        if (!canRunSensitiveCustomerActions) {
            toast.error("You are not allowed to perform this action");
            return;
        }

        const nextStatus = customer.status === "VIP" ? "Active" : "VIP";
        await handleStatusChange(customer, nextStatus);
        setActiveRowActionId("");
    };

    const handleSoftBlockToggle = async (customer) => {
        if (!canRunSensitiveCustomerActions) {
            toast.error("You are not allowed to perform this action");
            return;
        }

        const nextStatus = customer.status === "Blocked" ? "Active" : "Blocked";
        await handleStatusChange(customer, nextStatus);
        setActiveRowActionId("");
    };

    const handleQuickNote = (customer) => {
        setQuickNoteModalCustomer(customer);
        setQuickNoteDraft((customer?.supportNote || "").slice(0, QUICK_NOTE_MAX_LENGTH));
        setActiveRowActionId("");
    };

    const handleQuickNoteSave = async () => {
        if (!quickNoteModalCustomer?.uid) {
            return;
        }

        try {
            setIsSavingQuickNote(true);
            await updateCustomerNote(quickNoteModalCustomer.uid, quickNoteDraft.trim());
            toast.success("Quick note saved");
            reloadCustomers();
            setQuickNoteModalCustomer(null);
        } catch {
            toast.error("Failed to save note");
        } finally {
            setIsSavingQuickNote(false);
        }
    };

    const handleLastActivityView = (customer) => {
        if (!canRunSensitiveCustomerActions) {
            toast.error("You are not allowed to perform this action");
            return;
        }

        setActivityModalCustomer(customer);
        setActiveRowActionId("");
    };

    const handleOrderHistoryShortcut = (customer) => {
        if (isSellerView) {
            return;
        }
        navigate(`/order-management?customerId=${customer.uid}`);
        setActiveRowActionId("");
    };

    const handleOrderHistoryFromActivity = () => {
        if (!activityModalCustomer?.uid) {
            return;
        }

        navigate(`/order-management?customerId=${activityModalCustomer.uid}`);
        setActivityModalCustomer(null);
    };

    const handleQuickNoteFromActivity = () => {
        if (!activityModalCustomer?.uid) {
            return;
        }

        const selectedCustomer = activityModalCustomer;
        setActivityModalCustomer(null);
        handleQuickNote(selectedCustomer);
    };

    const handleExportSingleCustomer = (customer) => {
        buildCsvAndDownload([customer], `customer-${customer.uid}.csv`);
        toast.success("Customer exported");
        setActiveRowActionId("");
    };

    const buildCsvAndDownload = React.useCallback((items, fileName) => {
        const headers = [
            isSellerView ? "Seller ID" : "Customer ID",
            "Name",
            "Email",
            isSellerView ? "Join Date" : "Phone",
            isSellerView ? "Products Count" : "Order Count",
            isSellerView ? "Total Sales" : "Total Spend",
            ...(isSellerView ? ["Net Payout", "Already Paid"] : []),
            "Status",
            "Registration Date",
            isSellerView ? "Last Order Date" : "Last Purchase Date",
        ];

        const rows = items.map((customer) => [
            customer.id,
            customer.name,
            customer.email,
            isSellerView ? customer.registrationDate : customer.phone,
            isSellerView ? Number(customer.productsCount || 0) : customer.orderCount,
            isSellerView ? Number(customer.totalSales || 0) : customer.totalSpend,
            ...(isSellerView
                ? [
                    Number(customer.payoutAmount || 0),
                    Number(customer.paidAmount || 0),
                ]
                : []),
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
            const base = isSellerView ? "sellers" : "customers";
            let fileName = `${base}-all-data.csv`;
            if (mode === "month") {
                fileName = `${base}-${selection.selectedYear}-${selection.selectedMonth}.csv`;
            }
            if (mode === "year") {
                fileName = `${base}-${selection.selectedYear}.csv`;
            }
            if (mode === "date") {
                fileName = `${base}-${selection.selectedFromDate}-to-${selection.selectedToDate}.csv`;
            }

            buildCsvAndDownload(items, fileName);
        },
        messages: {
            noData: isSellerView ? "No seller data available to export" : "No customer data available to export",
            prepareError: isSellerView ? "Failed to prepare seller export" : "Failed to prepare customer export",
            noMonthData: isSellerView ? "No sellers found for selected month" : "No customers found for selected month",
            noYearData: isSellerView ? "No sellers found for selected year" : "No customers found for selected year",
            noDateData: isSellerView ? "No sellers found in selected date range" : "No customers found in selected date range",
            successAll: isSellerView ? "All sellers exported successfully" : "All customers exported successfully",
            successMonth: "Month-wise export completed",
            successYear: "Year-wise export completed",
            successDate: "Date-to-date export completed",
            exportError: isSellerView ? "Failed to export sellers" : "Failed to export customers",
        },
    });

    const modeLabelMap = {
        all: `Export all available ${isSellerView ? "seller" : "customer"} data.`,
        month: `Select year and month from available ${isSellerView ? "seller" : "customer"} data.`,
        year: `Select year from available ${isSellerView ? "seller" : "customer"} data.`,
        date: `Select date range from available ${isSellerView ? "seller" : "customer"} dates only.`,
    };

    return (
        <>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-[16px] font-semibold text-slate-900 dark:text-slate-50">{isSellerView ? "Seller Details" : "Customer Details"}</div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={customerSearch}
                            onChange={(event) => setCustomerSearch(event.target.value)}
                            placeholder={isSellerView ? "Search seller name, email, phone..." : "Search name, email, phone..."}
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
                            <div className="customers-more-menu absolute right-0 z-20 mt-2 min-w-44 max-h-[30vh] overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950">
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
                                        {isSellerView ? null : <option value="vip">VIP</option>}
                                    </select>
                                </div>

                                <div className="px-4 pb-3">
                                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Join from</label>
                                    <input
                                        type="date"
                                        value={joinDateFrom}
                                        onChange={(event) => setJoinDateFrom(event.target.value)}
                                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                    />
                                </div>

                                <div className="px-4 pb-3">
                                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Join to</label>
                                    <input
                                        type="date"
                                        value={joinDateTo}
                                        onChange={(event) => setJoinDateTo(event.target.value)}
                                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                    />
                                </div>

                                {isSellerView ? (
                                    <>
                                        <div className="px-4 pb-3">
                                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Products count min</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={productsCountMin}
                                                onChange={(event) => setProductsCountMin(event.target.value)}
                                                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                            />
                                        </div>

                                        <div className="px-4 pb-3">
                                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Products count max</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={productsCountMax}
                                                onChange={(event) => setProductsCountMax(event.target.value)}
                                                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                            />
                                        </div>

                                        <div className="px-4 pb-3">
                                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Total sales min</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={totalSalesMin}
                                                onChange={(event) => setTotalSalesMin(event.target.value)}
                                                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                            />
                                        </div>

                                        <div className="px-4 pb-3">
                                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Total sales max</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={totalSalesMax}
                                                onChange={(event) => setTotalSalesMax(event.target.value)}
                                                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                            />
                                        </div>
                                    </>
                                ) : null}

                                <div className="px-4 pb-3">
                                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{isSellerView ? "Orders sort" : "Total orders sort"}</label>
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
                                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{isSellerView ? "Total sales sort" : "Total spend sort"}</label>
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

            <div className="overflow-x-auto overflow-y-visible">
                <table className="min-w-full border-collapse whitespace-nowrap text-left">
                    <thead>
                        <tr className="bg-[#EAF8E7] text-[12px] font-semibold text-slate-600">
                            <th className="rounded-l-lg px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">{isSellerView ? "Join Date" : "Phone"}</th>
                            <th className="px-4 py-3">{isSellerView ? "Products Count" : "Order Count"}</th>
                            <th className="px-4 py-3">{isSellerView ? "Total Sales" : "Total Spend"}</th>
                            {isSellerView ? <th className="px-4 py-3">Net Payout</th> : null}
                            {isSellerView ? <th className="px-4 py-3">Already Paid</th> : null}
                            <th className="px-4 py-3">Status</th>
                            <th className="rounded-r-lg px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && !customers.length ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <tr key={`skeleton-${index}`} className="border-b border-slate-200 dark:border-slate-800">
                                    <td className="px-4 py-4" colSpan={isSellerView ? 9 : 7}>
                                        <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                    </td>
                                </tr>
                            ))
                        ) : null}

                        {customers.map((customer) => {
                            const isSelected = customer.uid === selectedCustomerId;

                            return (
                                <tr
                                    key={customer.uid}
                                    className={`border-b border-slate-200 text-[13px] text-slate-700 transition dark:border-slate-800 dark:text-slate-200 ${isSelected ? "bg-emerald-50/70 dark:bg-emerald-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-900/40"}`}
                                >
                                    <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{customer.name}</td>
                                    <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{customer.email}</td>
                                    <td className="px-4 py-4">{isSellerView ? customer.registrationDate : customer.phone}</td>
                                    <td className="px-4 py-4">{isSellerView ? Number(customer.productsCount || 0) : customer.orderCount}</td>
                                    <td className="px-4 py-4">{formatAmount(isSellerView ? Number(customer.totalSales || 0) : customer.totalSpend)}</td>
                                    {isSellerView ? <td className="px-4 py-4">{formatAmount(Number(customer.payoutAmount || 0))}</td> : null}
                                    {isSellerView ? <td className="px-4 py-4">{formatAmount(Number(customer.paidAmount || 0))}</td> : null}
                                    <td className="px-4 py-4"><StatusPill status={customer.status} color={statusColors[customer.status]} /></td>
                                    <td className="px-4 py-4">
                                        <div className="relative">
                                            <button
                                                type="button"
                                                data-row-action-id={customer.uid}
                                                className="customer-row-action-trigger rounded border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    const triggerElement = event.currentTarget;
                                                    setActiveRowActionId((current) => {
                                                        if (current === customer.uid) {
                                                            return "";
                                                        }

                                                        const triggerRect = triggerElement.getBoundingClientRect();
                                                        const menuWidth = 224;
                                                        const menuMaxHeight = 208;
                                                        const left = Math.max(8, Math.min(triggerRect.right - menuWidth, window.innerWidth - menuWidth - 8));
                                                        const top = Math.max(8, Math.min(triggerRect.bottom + 6, window.innerHeight - menuMaxHeight - 8));
                                                        setRowActionMenuPosition({ top, left });

                                                        return customer.uid;
                                                    });
                                                }}
                                                title={isSellerView ? "Seller actions" : "Customer actions"}
                                            >
                                                <FiMoreVertical className="text-[14px]" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {!isLoading && !customers.length ? (
                            <tr>
                                <td colSpan={isSellerView ? 9 : 7} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                    {errorMessage || (isSellerView ? "No sellers found" : "No customers found for this search.")}
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>

            {activeRowCustomer ? (
                <div
                    className="customer-row-action-menu fixed z-70 min-w-56 max-h-52 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-950"
                    style={{ top: `${rowActionMenuPosition.top}px`, left: `${rowActionMenuPosition.left}px` }}
                    onClick={(event) => event.stopPropagation()}
                >
                    <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => setSelectedCustomerId(activeRowCustomer.uid)}>View Profile</button>
                    <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleQuickNote(activeRowCustomer)}>Quick Note</button>
                    {canRunSensitiveCustomerActions ? (
                        <>
                            <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleSendResetLink(activeRowCustomer)}>Send Reset Password Link</button>
                            {!isSellerView ? <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleForceLogout(activeRowCustomer)}>Force Logout User</button> : null}
                            {!isSellerView ? <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleVipToggle(activeRowCustomer)}>{activeRowCustomer.status === "VIP" ? "Remove VIP" : "Mark as VIP"}</button> : null}
                            <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleLastActivityView(activeRowCustomer)}>Last Activity View</button>
                            <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleSoftBlockToggle(activeRowCustomer)}>{activeRowCustomer.status === "Blocked" ? `Unblock ${isSellerView ? "Seller" : "User"}` : `Block ${isSellerView ? "Seller" : "User"}`}</button>
                        </>
                    ) : null}
                    {!isSellerView ? <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleOrderHistoryShortcut(activeRowCustomer)}>Order History Shortcut</button> : null}
                    <button type="button" className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900" onClick={() => handleExportSingleCustomer(activeRowCustomer)}>Export Single {isSellerView ? "Seller" : "Customer"}</button>
                </div>
            ) : null}

            <CsvExportDialog
                title={isSellerView ? "Export Sellers CSV" : "Export Customers CSV"}
                modeLabelMap={modeLabelMap}
                exportState={exportState}
            />

            {activityModalCustomer ? (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[1px]"
                    onClick={() => setActivityModalCustomer(null)}
                >
                    <div
                        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-gray-950"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Last Activity</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {activityModalCustomer.name || (isSellerView ? "Seller" : "Customer")} activity snapshot
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActivityModalCustomer(null)}
                                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-gray-900"
                            >
                                Close
                            </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-gray-900">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Last Login</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{activityModalCustomer.lastLoginDate || "N/A"}</p>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-gray-900">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Last Purchase</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{activityModalCustomer.lastPurchaseDate || "N/A"}</p>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-gray-900">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Orders</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{activityModalCustomer.orderCount || 0}</p>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-gray-900">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Spend</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatAmount(isSellerView ? Number(activityModalCustomer.totalSales || 0) : Number(activityModalCustomer.totalSpend || 0))}</p>
                            </div>
                        </div>

                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-gray-900">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Quick Note</p>
                            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{activityModalCustomer.supportNote || "No note available"}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-gray-900"
                                onClick={handleQuickNoteFromActivity}
                            >
                                Edit Quick Note
                            </button>
                            {!isSellerView ? (
                                <button
                                    type="button"
                                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
                                    onClick={handleOrderHistoryFromActivity}
                                >
                                    Open Order History
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}

            {quickNoteModalCustomer ? (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[1px]"
                    onClick={() => {
                        if (!isSavingQuickNote) {
                            setQuickNoteModalCustomer(null);
                        }
                    }}
                >
                    <div
                        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-gray-950"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Quick Note</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {quickNoteModalCustomer.name || (isSellerView ? "Seller" : "Customer")} support note
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setQuickNoteModalCustomer(null)}
                                disabled={isSavingQuickNote}
                                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-gray-900"
                            >
                                Close
                            </button>
                        </div>

                        <textarea
                            value={quickNoteDraft}
                            onChange={(event) => setQuickNoteDraft(event.target.value.slice(0, QUICK_NOTE_MAX_LENGTH))}
                            placeholder={`Add support note for this ${isSellerView ? "seller" : "customer"}...`}
                            rows={5}
                            maxLength={QUICK_NOTE_MAX_LENGTH}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200 dark:focus:border-emerald-600 dark:focus:ring-emerald-900/40"
                        />

                        <div className="mt-2 flex items-center justify-between text-xs">
                            <div className="text-slate-500 dark:text-slate-400">
                                <p>Last updated: {formatDateTime(quickNoteModalCustomer.supportNoteUpdatedAt || quickNoteModalCustomer.updatedAt || quickNoteModalCustomer.createdAt)}</p>
                                <p className="mt-0.5">Edited by: {formatAdminMeta(quickNoteModalCustomer.supportNoteUpdatedBy)}</p>
                            </div>
                            <p className={`font-medium ${quickNoteDraft.length >= QUICK_NOTE_MAX_LENGTH ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>
                                {quickNoteDraft.length}/{QUICK_NOTE_MAX_LENGTH}
                            </p>
                        </div>

                        {Array.isArray(quickNoteModalCustomer.supportNoteHistory) && quickNoteModalCustomer.supportNoteHistory.length ? (
                            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-gray-900">
                                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Recent Note History</p>
                                <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                                    {quickNoteModalCustomer.supportNoteHistory.map((entry, index) => (
                                        <div key={`${entry?.updatedAt || "note"}-${index}`} className="rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-gray-950">
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{formatDateTime(entry?.updatedAt)}</p>
                                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Edited by: {formatAdminMeta(entry?.updatedBy)}</p>
                                            <p className="mt-1 text-xs text-slate-700 dark:text-slate-200">{entry?.note || "-"}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setQuickNoteModalCustomer(null)}
                                disabled={isSavingQuickNote}
                                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleQuickNoteSave}
                                disabled={isSavingQuickNote}
                                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSavingQuickNote ? "Saving..." : "Save Note"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
};

export default CustomersTable;