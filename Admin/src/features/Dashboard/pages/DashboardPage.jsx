import React from 'react'
import TotalSalesCard from '../components/TotalSales';
import TotalOrdersCard from '../components/TotalOrders';
import PendingAndCanceledCard from '../components/PendingAndCanceled';
import WeeklyReportCard from '../components/WeeklyReport';
import UserReport from '../components/UserReport';
import TransactionTable from '../components/TransactionTable';
import TopProduct from '../components/TopProduct';
import BestSelingProductTable from '../components/BestSelingProductTable';
import AddProductSidebar from '../components/AddProductSidebar';
import { useDashboard } from '../../../Context/dashboard/useDashboard';
import { useOrder } from '../../../Context/order/useOrder';


const Dashbord = () => {
  const { weeklyReportProps } = useDashboard();
  const { summaryCards, dashboardSalesCard, tabs, summaryPeriod } = useOrder();

  const totalSalesCard = dashboardSalesCard || {};
  const totalOrdersCard = summaryCards.find((card) => card.title === "Total Orders") || summaryCards[1] || {};
  const pendingCount = tabs.find((tab) => tab.label === "Pending")?.count ?? 0;
  const canceledCount = tabs.find((tab) => tab.label === "Cancelled")?.count ?? 0;

  const periodLabel = summaryPeriod === "month"
    ? "Year-wise"
    : summaryPeriod === "daywise"
      ? "Month-wise"
      : "Last 7 days";

  return (
    <div className="w-full overflow-hidden overflow-x-scroll  scrollbarNone">
      <div className='flex w-full'>
        <TotalSalesCard
          title={totalSalesCard.title || "Total Sales"}
          periodLabel={periodLabel}
          value={totalSalesCard.value || "0"}
          metricLabel="Sales"
          change={totalSalesCard.change || "0.0%"}
          changeColor={totalSalesCard.changeColor || "#21C45D"}
          previousLabel="Previous period"
          previousValue={totalSalesCard.change || "0.0%"}
        />
        <TotalOrdersCard
          title={totalOrdersCard.title || "Total Orders"}
          periodLabel={periodLabel}
          value={totalOrdersCard.value || "0"}
          metricLabel="Orders"
          change={totalOrdersCard.change || "0.0%"}
          changeColor={totalOrdersCard.changeColor || "#21C45D"}
          previousLabel="Previous period"
          previousValue={totalOrdersCard.change || "0.0%"}
        />
        <PendingAndCanceledCard
          periodLabel={periodLabel}
          pendingValue={String(pendingCount)}
          pendingChange="Current scope"
          pendingChangeColor="#21C45D"
          canceledValue={String(canceledCount)}
          canceledChange="Current scope"
          canceledChangeColor="#F87272"
        />
      </div>

      <div className="flex w-full mb-5 gap-5">
        <WeeklyReportCard {...weeklyReportProps} />
        <UserReport />
      </div>


      <div className="flex w-full mb-5 gap-5">
        <TransactionTable />
        <TopProduct />
      </div>

      <div className="flex w-full mb-5 gap-5">
        <BestSelingProductTable />
        <AddProductSidebar />
      </div>

      {/* <div className="flex w-full mb-5 gap-5">
        <PayoutSettingsPanel />
      </div> */}
    </div>
  )
}

export default Dashbord