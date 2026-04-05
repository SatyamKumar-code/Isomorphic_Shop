import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import Dashbord from "../features/Dashboard/pages/DashboardPage";
import OrderManagementPage from "../features/ordersManagement/pages/OrderManagementPage";
import CustomersPage from "../features/customers/pages/CustomersPage";
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
                    <MainLayout title="Dashboard">
                        <Dashbord />
                    </MainLayout>
                </ProtectedRoute>
            )
        },

        {
            path: '/order-management',
            exact: true,
            element: (
                <ProtectedRoute>
                    <MainLayout title="Order Management">
                        <OrderManagementPage />
                    </MainLayout>
                </ProtectedRoute>
            )
        },

        {
            path: '/customers',
            exact: true,
            element: (
                <ProtectedRoute>
                    <MainLayout title="Customers">
                        <CustomersPage />
                    </MainLayout>
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