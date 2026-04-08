import { createContext } from 'react'
import './App.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './Context/auth/AuthContext'
import { CategoriesProvider } from './Context/categories/CategoriesContext'
import { OrderProvider } from './Context/order/OrderContext'
import { CustomersProvider } from './Context/customers/CustomersContext'
import { DashboardProvider } from './Context/dashboard/DashboardContext'
import { AddProductProvider } from './Context/addProduct/AddProductContext'
import { ProductListProvider } from './Context/productList/ProductListContext'
import AppRoutes from './routes/AppRoutes'

const MyContext = createContext();

function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <CategoriesProvider>
          <CustomersProvider>
            <DashboardProvider>
              <AddProductProvider>
                <ProductListProvider>
                  <AppRoutes />
                  <Toaster />
                </ProductListProvider>
              </AddProductProvider>
            </DashboardProvider>
          </CustomersProvider>
        </CategoriesProvider>
      </OrderProvider>
    </AuthProvider>
  )
}

export default App;
export { MyContext };
