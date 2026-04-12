import React, { useState } from "react";
import { HiDotsVertical } from "react-icons/hi";
import PayoutSettingsPanel from "../../Dashboard/components/PayoutSettingsPanel";

const TransactionHeaderMenu = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                className="p-2 rounded-full text-black dark:text-[#ffffff] hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setOpen((v) => !v)}
                aria-label="More options"
            >
                <HiDotsVertical size={20} />
            </button>
            {open && (
                <>
                    {/* Overlay with blur */}
                    <div
                        className="fixed inset-0 z-40 bg-transparent backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    {/* Modal */}
                    <div className="fixed z-50 inset-0 flex items-center justify-center">
                        <div className="w-96 max-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 relative">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-800 dark:text-white">Payout Settings</span>
                                <button
                                    className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                    onClick={() => setOpen(false)}
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                            </div>
                            <PayoutSettingsPanel />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TransactionHeaderMenu;
