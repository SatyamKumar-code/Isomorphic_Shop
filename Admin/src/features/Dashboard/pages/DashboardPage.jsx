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
const Dashbord = () => {
  const { weeklyReportProps } = useDashboard();

  return (
    <div className="w-full overflow-hidden overflow-x-scroll  scrollbarNone">
      <div className='flex w-full'>
        <TotalSalesCard />
        <TotalOrdersCard />
        <PendingAndCanceledCard />
      </div>

      <div className="flex w-full mb-5 gap-5">
        {weeklyReportProps ? <WeeklyReportCard {...weeklyReportProps} /> : null}
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
    </div>
  )
}

export default Dashbord