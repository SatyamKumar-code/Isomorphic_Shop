import React from 'react';
import AdminRevenueOverviewCards from '../components/AdminRevenueOverviewCards';
import SellerWiseSummaryTable from '../components/SellerWiseSummaryTable';

const RevenueOverviewPage = () => {
    return (
        <div className="w-full overflow-x-auto px-5 pb-6 pt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <AdminRevenueOverviewCards />
            <SellerWiseSummaryTable />
        </div>
    );
};

export default RevenueOverviewPage;
