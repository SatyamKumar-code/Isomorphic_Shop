import { createContext, useEffect, useState } from 'react'
import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './Components/ProtectedRoute'
import Header from './Components/Header'
import Sidebar from './Components/Sidebar'
import Dashboard from './Pages/Dashboard'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import VerifyAccount from './pages/VerifyAccount'
import ChangePassword from './pages/ChangePassword'
import toast from 'react-hot-toast';
import { fetchDataFromApi } from './utils/api'

const MyContext = createContext();

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token !== null && token !== undefined && token !== "") {
      setIsLoggedIn(true);

      fetchDataFromApi("/api/user/admin/userData").then((res) => {
        if (res?.error === false) {
          setUserData(res?.data);
        }
        if (res?.error === true) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setIsLoggedIn(false);
          toast.error(res?.message || "Session expired. Please login again.");
          setUserData(null);

          window.location.href = '/login';

        }
      })

    } else {
      setIsLoggedIn(false);
    }
  }, [isLoggedIn]);

  const alertBox = (type, msg) => {
    if (type === "Success") {
      toast.success(msg)
    }
    if (type === "error") {
      toast.error(msg);
    }
  }

  const router = createBrowserRouter([
    {
      path: '/',
      exact: true,
      element: (
        <ProtectedRoute>
          <section className='main w-full h-screen pr-11 bg-gray-50 dark:bg-black'>
            <Header />
            <div className='conterntMain flex'>
              <div className='sidebarWrapper w-65 fixed top-0 left-0 bg-white dark:bg-gray-950 dark:shadow-md shadow-md shadow-gray-300 dark:shadow-gray-700 overflow-y-auto h-screen'>
                <Sidebar />
              </div>
              <div className='contentRight ml-auto mt-6 dark:bg-gray-950 w-[calc(100%-260px)] '>
                <Dashboard />
              </div>
            </div>
          </section>
        </ProtectedRoute>
      )
    },

    {
      path: '/login',
      exaxt: true,
      element: (
        <>
          <Login />
        </>
      ),
    },

    {
      path: '/forgot-password',
      exaxt: true,
      element: (
        <>
          <ForgotPassword />
        </>
      ),
    },

    {
      path: '/verify-account',
      exaxt: true,
      element: (
        <>
          <VerifyAccount />
        </>
      ),
    },

    {
      path: '/change-password',
      exaxt: true,
      element: (
        <>
          <ChangePassword />
        </>
      ),
    },

  ])

  const value = {
    alertBox,
    isLoggedIn,
    setIsLoggedIn,
    userData,
    setUserData
  };

  return (
    <>
      <MyContext.Provider value={value}>
        <RouterProvider router={router} />

        <Toaster />
      </MyContext.Provider>
    </>
  )
}

export default App;
export { MyContext };
