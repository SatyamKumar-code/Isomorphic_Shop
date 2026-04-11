import React from 'react';
import { useSearchParams } from 'react-router-dom';
import OrderFilters from '../components/OrderFilters';
import OrderHeader from '../components/OrderHeader';
import OrderPagination from '../components/OrderPagination';
import SummaryCards from '../components/SummaryCards';
import { useOrder } from '../../../Context/order/useOrder';
import OrdersTable from '../../../shared/components/OrdersTable';
import { useAuth } from '../../../Context/auth/useAuth';

const OrderManagementPage = () => {
  const { userData } = useAuth();
  const {
    activeTab,
    setActiveTab,
    currentPage,
    setCurrentPage,
    orders,
    paymentColor,
    thumbnailColors,
    isLoading,
    pageSize,
    setCustomerIdFilter,
    setSearchText,
    handleStatusChange,
    isStatusUpdatingId,
    handleRefundStatusChange,
    isRefundUpdatingId,
  } = useOrder();
  const [searchParams] = useSearchParams();
  const focusedOrderId = searchParams.get("focusOrder") || "";
  const canManageOrderActions = userData?.role === 'seller';
  const canViewSellerName = userData?.role === 'admin';

  React.useEffect(() => {
    const customerId = searchParams.get("customerId") || "";
    const search = searchParams.get("search") || "";
    setCustomerIdFilter(customerId);
    setSearchText(search);
  }, [searchParams, setCustomerIdFilter, setSearchText]);

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
          thumbnailColors={thumbnailColors}
          focusedOrderId={focusedOrderId}
          showSellerColumn={canViewSellerName}
          showOrderActions={canManageOrderActions}
          onOrderStatusChange={handleStatusChange}
          isStatusUpdatingId={isStatusUpdatingId}
          onOrderRefundStatusChange={handleRefundStatusChange}
          isRefundUpdatingId={isRefundUpdatingId}
        />
        <OrderPagination currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default OrderManagementPage;