import React, { useState } from "react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter, FaWhatsapp } from "react-icons/fa";
import { FiCopy, FiMapPin, FiPhone } from "react-icons/fi";
import { useCustomers } from "../../../Context/customers/useCustomers";

const getInitials = (name) => name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const CustomerDetailsCard = () => {
    const { selectedCustomer, isSellerView } = useCustomers();
    const [copyMessage, setCopyMessage] = useState("");

    if (!selectedCustomer) {
        return null;
    }

    const showCopyMessage = (message) => {
        setCopyMessage(message);
        setTimeout(() => {
            setCopyMessage("");
        }, 1800);
    };

    const handleCopyEmail = async () => {
        const email = selectedCustomer?.email;

        if (!email) {
            return;
        }

        try {
            await navigator.clipboard.writeText(email);
            showCopyMessage("Email copied");
        } catch {
            try {
                const textarea = document.createElement("textarea");
                textarea.value = email;
                textarea.setAttribute("readonly", "");
                textarea.style.position = "absolute";
                textarea.style.left = "-9999px";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
                showCopyMessage("Email copied");
            } catch {
                showCopyMessage("Copy failed");
            }
        }
    };

    return (
        <div className="xl:w-[25%]">
            <div className="p-4 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-emerald-200 to-emerald-400 text-lg font-bold text-white">{getInitials(selectedCustomer.name)}</div>
                    <div>
                        <h4 className="text-[16px] font-semibold text-slate-900 dark:text-slate-50">{selectedCustomer.name}</h4>
                        <div className="flex items-center gap-2">
                            <p className="text-[12px] text-slate-500 dark:text-slate-400">{selectedCustomer.email}</p>
                            <div className="relative">
                                <button type="button" onClick={handleCopyEmail} className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200" aria-label="Copy customer email" title="Copy email">
                                    <FiCopy />
                                </button>
                                {copyMessage && (
                                    <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-600 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-300">
                                        {copyMessage}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 space-y-4">
                    <div>
                        <p className="mb-2 text-[12px] font-medium text-slate-500 dark:text-slate-400">{isSellerView ? "Seller Info" : "Customer Info"}</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-700 dark:border-slate-800 dark:text-slate-200"><FiPhone className="text-slate-500" />{selectedCustomer.phone}</div>
                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-700 dark:border-slate-800 dark:text-slate-200"><FiMapPin className="text-slate-500" />{selectedCustomer.address}</div>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-[12px] font-medium text-slate-500 dark:text-slate-400">Social Media</p>
                        <div className="flex gap-2 text-[12px]">
                            <a className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1877F2] text-white" href="https://facebook.com" target="_blank" rel="noreferrer"><FaFacebookF /></a>
                            <a className="flex h-7 w-7 items-center justify-center rounded-md bg-[#25D366] text-white" href="https://wa.me" target="_blank" rel="noreferrer"><FaWhatsapp /></a>
                            <a className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1DA1F2] text-white" href="https://twitter.com" target="_blank" rel="noreferrer"><FaTwitter /></a>
                            <a className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0A66C2] text-white" href="https://linkedin.com" target="_blank" rel="noreferrer"><FaLinkedinIn /></a>
                            <a className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E1306C] text-white" href="https://instagram.com" target="_blank" rel="noreferrer"><FaInstagram /></a>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-[12px] font-medium text-slate-500 dark:text-slate-400">Activity</p>
                        <div className="space-y-1 text-[12px] text-slate-600 dark:text-slate-300">
                            <p>Registration: {selectedCustomer.registrationDate}</p>
                            <p>{isSellerView ? "Last order" : "Last purchase"}: {selectedCustomer.lastPurchaseDate}</p>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-[12px] font-medium text-slate-500 dark:text-slate-400">{isSellerView ? "Seller Performance" : "Order Overview"}</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                isSellerView
                                    ? { label: "Total Sales", value: selectedCustomer.totalSales || 0, color: "#2563EB" }
                                    : { label: "Total order", value: selectedCustomer.totalOrders, color: "#2563EB" },
                                isSellerView
                                    ? { label: "Products", value: selectedCustomer.productsCount || 0, color: "#16A34A" }
                                    : { label: "Completed", value: selectedCustomer.completedOrders, color: "#16A34A" },
                                isSellerView
                                    ? { label: "Orders", value: selectedCustomer.orderCount || 0, color: "#EF4444" }
                                    : { label: "Canceled", value: selectedCustomer.canceledOrders, color: "#EF4444" },
                            ].map((item) => (
                                <div key={item.label} className="rounded-lg border border-slate-200 p-2 text-center dark:border-slate-800">
                                    <div className="text-[18px] font-semibold text-slate-900 dark:text-slate-50">{item.value}</div>
                                    <div className="text-[11px]" style={{ color: item.color }}>{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailsCard;