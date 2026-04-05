import { createContext } from 'react'
import './App.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './Context/auth/AuthContext'
import { OrderProvider } from './Context/order/OrderContext'
import { CustomersProvider } from './Context/customers/CustomersContext'
import { DashboardProvider } from './Context/dashboard/DashboardContext'
import AppRoutes from './routes/AppRoutes'

const MyContext = createContext();

function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <CustomersProvider>
          <DashboardProvider>
            <AppRoutes />
            <Toaster />
          </DashboardProvider>
        </CustomersProvider>
      </OrderProvider>
    </AuthProvider>
  )
}

export default App;
export { MyContext };
