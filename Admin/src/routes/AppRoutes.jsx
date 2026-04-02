import { createBrowserRouter, Route, RouterProvider, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Header from "../Components/Header";
import Sidebar from "../Components/Sidebar";
import Dashbord from "../Pages/Dashboard";
import Login from "../features/auth/pages/LoginPage";
import ForgotPassword from "../Pages/ForgotPassword";
import VerifyAccount from "../Pages/VerifyAccount";
import ChangePassword from "../Pages/ChangePassword";


const AppRoutes = () => {

    const router = createBrowserRouter([
        {
            path: '/',
            exact: true,
            element: (
                <ProtectedRoute>
                    <section className='main font-lato w-full h-full pr-11 bg-gray-50 dark:bg-black'>
                        <Header />
                        <div className='conterntMain flex'>
                            <div className='sidebarWrapper w-65 fixed top-0 left-0 bg-white dark:bg-gray-950 dark:shadow-md shadow-md shadow-gray-300 dark:shadow-gray-700 overflow-y-auto h-screen'>
                                <Sidebar />
                            </div>
                            <div className='contentRight ml-auto h-full mt-1 w-[calc(100%-260px)] '>
                                <Dashbord />
                            </div>
                        </div>
                    </section>
                </ProtectedRoute>
            )
        },

        {
            path: '/login',
            exact: true,
            element: (
                <>
                    <Login />
                </>
            ),
        },

        {
            path: '/forgot-password',
            exact: true,
            element: (
                <>
                    <ForgotPassword />
                </>
            ),
        },

        {
            path: '/verify-account',
            exact: true,
            element: (
                <>
                    <VerifyAccount />
                </>
            ),
        },

        {
            path: '/change-password',
            exact: true,
            element: (
                <>
                    <ChangePassword />
                </>
            ),
        },

    ]);


    return (

        <RouterProvider router={router} />

    );
};

export default AppRoutes;