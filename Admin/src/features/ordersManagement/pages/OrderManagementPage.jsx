import React from 'react';
import OrderFilters from '../components/OrderFilters';
import OrderHeader from '../components/OrderHeader';
import OrderPagination from '../components/OrderPagination';
import OrdersTable from '../components/OrdersTable';
import SummaryCards from '../components/SummaryCards';
import { useOrder } from '../../../Context/order/useOrder';

const OrderManagementPage = () => {
  const { activeTab, setActiveTab, currentPage, setCurrentPage } = useOrder();

  return (
    <div className="w-full overflow-x-auto scrollbarNone px-5 pb-6 pt-4">
      <OrderHeader />

      <SummaryCards />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-gray-950 dark:shadow-slate-800/70">
        <OrderFilters activeTab={activeTab} onTabChange={setActiveTab} />
        <OrdersTable />
        <OrderPagination currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default OrderManagementPage;