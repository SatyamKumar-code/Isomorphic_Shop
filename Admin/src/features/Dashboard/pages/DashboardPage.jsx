import React from 'react'


import TotalSalesCard from '../components/TotalSales';
import TotalOrdersCard from '../components/TotalOrders';
import PendingAndCanceledCard from '../components/PendingAndCanceled';
import WeeklyReportCard from '../components/WeeklyReport';
import UserReport from '../components/UserReport';
import TransactionTable from '../components/TransactionTable';


const Dashbord = () => {
  return (
    <div className="w-full overflow-hidden overflow-x-scroll  scrollbarNone">
      <div className='flex w-full'>
        <TotalSalesCard />
        <TotalOrdersCard />
        <PendingAndCanceledCard />
      </div>

      <div className="flex w-full mb-5">
        <WeeklyReportCard />
        <UserReport />
      </div>


      <div className="flex w-full justify-center mt-6">
        <TransactionTable />
      </div>
    </div>
  )
}

export default Dashbord