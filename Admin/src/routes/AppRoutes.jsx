import { createBrowserRouter, Route, RouterProvider, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Header from "../shared/components/Header";
import Sidebar from "../shared/components/Sidebar";
import Dashbord from "../features/Dashboard/pages/DashboardPage";
import Login from "../features/auth/pages/LoginPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import VerifyAccountPage from "../features/auth/pages/VerifyAccountPage";
import ChangePasswordPage from "../features/auth/pages/ChangePasswordPage";


const AppRoutes = () => {

    const router = createBrowserRouter([
        {
            path: '/',
            exact: true,
            element: (
                <ProtectedRoute>
                    <section className='main font-lato w-full h-full pr-11 bg-gray-50 dark:bg-black '>
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
                    <ForgotPasswordPage />
                </>
            ),
        },

        {
            path: '/verify-account',
            exact: true,
            element: (
                <>
                    <VerifyAccountPage />
                </>
            ),
        },

        {
            path: '/change-password',
            exact: true,
            element: (
                <>
                    <ChangePasswordPage />
                </>
            ),
        },

    ]);


    return (

        <RouterProvider router={router} />

    );
};

export default AppRoutes;