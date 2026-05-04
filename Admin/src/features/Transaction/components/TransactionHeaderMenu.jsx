import React, { useState, useCallback } from "react";
import { HiDotsVertical } from "react-icons/hi";
import PayoutSettingsPanel from "./PayoutSettingsPanel";
import CsvExportDialog from "../../../shared/components/CsvExportDialog";
import { useCsvExportDialog } from "../../../shared/hooks/useCsvExportDialog";
import { useTransaction } from "../../../Context/transaction/useTransaction";
import { getSellerOrderPayoutRows } from "../TransactionAPI";

const TransactionHeaderMenu = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showPayoutSettings, setShowPayoutSettings] = useState(false);


    const {
        isAdmin,
        selectedSellerId,
    } = useTransaction();

    // Format date for CSV
    const formatDate = useCallback((value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        const day = `${date.getDate()}`.padStart(2, "0");
        const month = `${date.getMonth() + 1}`.padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }, []);

    // Build CSV and download
    const buildCsvAndDownload = useCallback((items, fileName) => {
        const headers = [
            "Order ID", "Customer", "Email", "Date", "Payment", "Status", "Refund Status", "Payout", "Gross", "Commission", "Return Charge", "Seller Net"
        ];
        const csvRows = items.map((item) => {
            // Return charge logic
            const returnCharge = Number(item.returnChargeAmount || 0);
            let sellerNet = "";
            if (returnCharge > 0) {
                sellerNet = `-Rs ${returnCharge.toLocaleString('en-IN')}`;
            } else {
                sellerNet = `Rs ${Number(item.netAfterRefund || 0).toLocaleString('en-IN')}`;
            }
            return [
                item?.orderId || item?.id || "",
                item?.customerName || "-",
                item?.customerEmail || "-",
                item?.date || formatDate(item?.createdAt),
                item?.method || "-",
                item?.status || "-",
                item?.refundStatus || "-",
                item?.payoutMarked ? "Paid" : (item?.payoutEligible ? "Pending Payout" : "Not Eligible"),
                item?.grossSales ?? "-",
                item?.commissionAmount ?? "-",
                returnCharge > 0 ? `Rs ${returnCharge.toLocaleString('en-IN')}` : "",
                sellerNet,
            ];
        });
        const csvText = [headers, ...csvRows]
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
    }, [formatDate]);

    // Export dialog state
    const exportState = useCsvExportDialog({
        fetchAllItems: async () => {
            // Always fetch fresh data from backend like order page
            let params = { page: 1, limit: 100 };
            if (isAdmin && selectedSellerId) params.sellerId = selectedSellerId;
            let allRows = [];
            let page = 1;
            let totalPages = 1;
            do {
                params.page = page;
                const res = await getSellerOrderPayoutRows(params);
                const payload = res?.data?.data || {};
                const chunk = Array.isArray(payload.rows) ? payload.rows : [];
                allRows.push(...chunk);
                totalPages = Number(payload?.pagination?.totalPages || 1);
                page += 1;
            } while (page <= totalPages);
            // Map to UI format (same as payoutSourceRows)
            const mapped = allRows.map((row) => {
                const paymentMethod = String(row?.paymentMethod || 'COD');
                const paymentStatus = String(row?.paymentStatus || 'pending').toLowerCase();
                const rawOrderStatus = String(row?.rawOrderStatus || 'pending').toLowerCase();
                return {
                    id: String(row?.id || ''),
                    orderId: String(row?.orderId || ''),
                    customerName: String(row?.customer?.name || 'Unknown Customer'),
                    customerEmail: String(row?.customer?.email || ''),
                    date: row?.date || formatDate(row?.createdAt),
                    method: paymentMethod,
                    paymentStatus,
                    paymentId: String(row?.paymentId || ''),
                    refundStatus: String(row?.refundStatus || 'none'),
                    rawOrderStatus,
                    createdAt: row?.createdAt,
                    status: (rawOrderStatus === 'cancelled') ? 'Cancelled' : (row?.isRefunded ? 'Refunded' : (row?.userPaymentDone ? 'User Paid' : 'Payment Pending')),
                    userPaymentDone: Boolean(row?.userPaymentDone),
                    isRefunded: Boolean(row?.isRefunded),
                    grossSales: Number(row?.grossSales || 0),
                    commissionAmount: Number(row?.commissionAmount || 0),
                    netAfterRefund: Number(row?.netAfterRefund || 0),
                    commissionRate: Number(row?.commissionRate || 0),
                    returnChargeAmount: Number(row?.returnChargeAmount || 0),
                    returnChargeRate: Number(row?.returnChargeRate || 0),
                    payoutUnlocked: Boolean(row?.payoutUnlocked),
                    payoutHoldDaysRemaining: Number(row?.payoutHoldDaysRemaining || 0),
                    payoutBlockedReason: String(row?.payoutBlockedReason || ''),
                    payoutAvailableAt: row?.payoutAvailableAt || null,
                    deliveredAt: row?.deliveredAt || null,
                    payoutEligible: Boolean(row?.userPaymentDone) && !Boolean(row?.isRefunded) && rawOrderStatus !== 'cancelled' && Boolean(row?.payoutUnlocked),
                    payoutMarked: Boolean(row?.payoutMarked),
                };
            });
            return mapped;
        },
        getItemCreatedAt: (item) => item?.createdAt,
        onDownload: async (items, mode, selection) => {
            let fileName = "transaction-list-all-data.csv";
            if (mode === "month") {
                fileName = `transaction-list-${selection.selectedYear}-${selection.selectedMonth}.csv`;
            }
            if (mode === "year") {
                fileName = `transaction-list-${selection.selectedYear}.csv`;
            }
            if (mode === "date") {
                fileName = `transaction-list-${selection.selectedFromDate}-to-${selection.selectedToDate}.csv`;
            }
            buildCsvAndDownload(items, fileName);
        },
        messages: {
            noData: "No transaction data available to export",
            prepareError: "Failed to prepare transaction export data",
            noMonthData: "No transactions found for selected month",
            noYearData: "No transactions found for selected year",
            noDateData: "No transactions found in selected date range",
            successAll: "All transactions exported successfully",
            successMonth: "Month-wise transaction export completed",
            successYear: "Year-wise transaction export completed",
            successDate: "Date-to-date transaction export completed",
            exportError: "Failed to export transaction list",
        },
    });

    // Mode label map for dialog
    const modeLabelMap = {
        all: "Export all available transaction data.",
        month: "Select year and month from available data.",
        year: "Select year from available data.",
        date: "Select date range from available dates only.",
    };

    // Handle outside click to close menu
    React.useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!event.target.closest('.transaction-header-menu') && !event.target.closest('.transaction-header-menu-trigger')) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
        }
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isMenuOpen]);

    return (
        <>
            <button
                type="button"
                className="transaction-header-menu-trigger p-2 rounded-full text-black dark:text-[#ffffff] hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsMenuOpen((v) => !v)}
                aria-label="More options"
            >
                <HiDotsVertical size={20} />
            </button>
            {isMenuOpen && (
                <div className="transaction-header-menu absolute right-5 top-40 z-20 min-w-35 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-gray-950">

                    <button
                        type="button"
                        className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                        onClick={() => {
                            if (isAdmin && !selectedSellerId) {
                                window.alert("Please select a seller to export transactions.");
                                setIsMenuOpen(false);
                                return;
                            }
                            exportState.openDialog();
                            setIsMenuOpen(false);
                        }}
                    >
                        Export transaction
                    </button>
                    {isAdmin &&
                        <button
                            type="button"
                            className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-gray-900"
                            onClick={() => {
                                setShowPayoutSettings(true);
                                setIsMenuOpen(false);
                            }}
                        >
                            Set Commission
                        </button>
                    }
                </div>
            )}

            {/* Dialog for payout settings */}
            {showPayoutSettings && (
                <div className="fixed z-50 inset-0 flex items-center justify-center">
                    <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setShowPayoutSettings(false)} />
                    <div className="w-96 max-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 relative z-50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-gray-800 dark:text-white">Payout Settings</span>
                            <button
                                className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                onClick={() => setShowPayoutSettings(false)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <PayoutSettingsPanel />
                    </div>
                </div>
            )}

            {/* CSV Export Dialog */}
            <CsvExportDialog
                title="Export Transaction CSV"
                modeLabelMap={modeLabelMap}
                exportState={exportState}
            />
        </>
    );
};

export default TransactionHeaderMenu;
