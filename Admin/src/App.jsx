import { createContext } from 'react'
import './App.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './Context/auth/AuthContext'
import AppRoutes from './routes/AppRoutes'

const MyContext = createContext();

function App() {
  return (
    
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
  )
}

export default App;
export { MyContext };
