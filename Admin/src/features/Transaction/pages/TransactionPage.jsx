import React from 'react';
import TransactionHeader from '../components/TransactionHeader';
import TransactionStats from '../components/TransactionStats';
import TransactionFilters from '../components/TransactionFilters';
import TransactionTable from '../components/TransactionTable';
import TransactionPagination from '../components/TransactionPagination';
import SellerWiseSummaryTable from '../components/SellerWiseSummaryTable';
import PayoutHistoryTable from '../components/PayoutHistoryTable';
import PeriodAnalyticsSection from '../components/PeriodAnalyticsSection';
import { useTransaction } from '../../../Context/transaction/useTransaction';

const TransactionPage = () => {
    const { selectedSellerId, isAdmin } = useTransaction();

    return (
        <div className="w-full overflow-x-auto px-5 pb-6 pt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <TransactionHeader />

            <TransactionStats />

            <PeriodAnalyticsSection selectedSellerId={selectedSellerId} isAdmin={isAdmin} />

            <div className="w-full mt-5 bg-white rounded-lg border border-gray-100 shadow-sm dark:bg-gray-950 dark:border-gray-800">
                <TransactionFilters />

                <TransactionTable />

                <TransactionPagination />

                
            </div>
            <PayoutHistoryTable />
        </div>
    );
};

export default TransactionPage;
