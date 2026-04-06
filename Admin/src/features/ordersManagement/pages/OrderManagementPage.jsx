import React from 'react';
import OrderFilters from '../components/OrderFilters';
import OrderHeader from '../components/OrderHeader';
import OrderPagination from '../components/OrderPagination';
import SummaryCards from '../components/SummaryCards';
import { useOrder } from '../../../Context/order/useOrder';
import OrdersTable from '../../../shared/components/OrdersTable';

const OrderManagementPage = () => {
  const {
    activeTab,
    setActiveTab,
    currentPage,
    setCurrentPage,
    orders,
    paymentColor,
    statusColor,
    thumbnailColors,
    isLoading,
    pageSize,
  } = useOrder();

  return (
    <div className="w-full overflow-x-auto scrollbarNone px-5 pb-6 pt-4">
      <OrderHeader />

      <SummaryCards />

      <div className="p-4 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg">
        <OrderFilters activeTab={activeTab} onTabChange={setActiveTab} />
        <OrdersTable
          variant="orders"
          rows={orders}
          isLoading={isLoading}
          currentPage={currentPage}
          pageSize={pageSize}
          paymentColor={paymentColor}
          statusColor={statusColor}
          thumbnailColors={thumbnailColors}
        />
        <OrderPagination currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default OrderManagementPage;