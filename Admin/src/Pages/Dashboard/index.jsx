import React from 'react'

import TotalSalesCard from '../../Components/Dashboard/Card/TotalSales';
import TotalOrdersCard from '../../Components/Dashboard/Card/TotalOrders';
import PendingAndCanceledCard from '../../Components/Dashboard/Card/PendingAndCanceled';
import WeeklyReportCard from '../../Components/Dashboard/WeeklyReportCard';


const Dashbord = () => {
  return (
    <>
      <div className='flex overflow-hidden overflow-x-scroll w-full scrollbarNone'>
        <TotalSalesCard />
        <TotalOrdersCard />
        <PendingAndCanceledCard />
      </div>

      <div className="mb-6">
        <WeeklyReportCard />
      </div>
    </>
  )
}

export default Dashbord