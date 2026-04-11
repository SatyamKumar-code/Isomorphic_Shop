import React from 'react';
import { useTransaction } from '../../../Context/transaction/useTransaction';

const SellerWiseSummaryTable = () => {
    const { isAdmin, sellerWiseSummaries } = useTransaction();

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="mt-6 rounded-lg border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white">Seller-wise Transaction Summary</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-190 border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900/50">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Seller</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Gross Sales</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Commission</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Net Revenue</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Paid</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Pending Payout</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sellerWiseSummaries.length ? (
                            sellerWiseSummaries.map((seller) => (
                                <tr key={seller.sellerId} className="border-t border-gray-100 dark:border-gray-800">
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{seller.sellerName || '-'}</td>
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">Rs {Number(seller.grossSales || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">Rs {Number(seller.commissionAmount || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">Rs {Number(seller.netRevenue || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-xs text-green-600">Rs {Number(seller.paidAmount || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-xs text-amber-600">Rs {Number(seller.payoutDue || 0).toLocaleString('en-IN')}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No seller summary available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SellerWiseSummaryTable;
