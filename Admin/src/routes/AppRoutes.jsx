import { lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import Dashbord from "../features/Dashboard/pages/DashboardPage";
import Login from "../features/auth/pages/LoginPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import VerifyAccountPage from "../features/auth/pages/VerifyAccountPage";
import ChangePasswordPage from "../features/auth/pages/ChangePasswordPage";

const OrderManagementPage = lazy(() => import("../features/ordersManagement/pages/OrderManagementPage"));
const CustomersPage = lazy(() => import("../features/customers/pages/CustomersPage"));
const CategoriesPage = lazy(() => import("../features/categories/pages/CategoriesPage"));
const AddProductPage = lazy(() => import("../features/addProducts/pages/AddProductPage"));
const ProductListPage = lazy(() => import("../features/productList/pages/ProductListPage"));
const ProductReviewsPage = lazy(() => import("../features/productReviews/pages/ProductReviewsPage"));
const TransactionPage = lazy(() => import("../features/Transaction/pages/TransactionPage"));
const RevenueOverviewPage = lazy(() => import("../features/Transaction/pages/RevenueOverviewPage"));
const ProfileSettings = lazy(() => import("../features/profile/pages/ProfileSettings"));



const AppRoutes = () => {

    const router = createBrowserRouter([
        {
            path: '/',
            exact: true,
            element: (
                <ProtectedRoute allowedRoles={["admin", "seller"]}>
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
                <ProtectedRoute allowedRoles={["admin", "seller"]}>
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
                <ProtectedRoute allowedRoles={["admin", "seller"]}>
                    <MainLayout title="Customers">
                        <CustomersPage />
                    </MainLayout>
                </ProtectedRoute>
            )
        },

        {
            path: '/seller',
            exact: true,
            element: (
                <ProtectedRoute allowedRoles={["admin"]}>
                    <MainLayout title="Seller">
                        <CustomersPage />
                    </MainLayout>
                </ProtectedRoute>
            )
        },

        {
            path: '/categories',
            exact: true,
            element: (
                <ProtectedRoute allowedRoles={["admin"]}>
                    <MainLayout title="Categories">
                        <CategoriesPage />
                    </MainLayout>
                </ProtectedRoute>
            )
        },

        {
            path: '/add-products',
            exact: true,
            element: (
                <ProtectedRoute allowedRoles={["seller"]}>
                    <MainLayout title="Add Product">
                        <AddProductPage />
                    </MainLayout>
                </ProtectedRoute>
            )
        },

        {
            path: '/product-list',
            exact: true,
            element: (
                <ProtectedRoute allowedRoles={["admin", "seller"]}>
                    <MainLayout title="Product List">
                        <ProductListPage />
                    </MainLayout>
                </ProtectedRoute>
            )
        },

        {
            path: '/product-reviews',
            exact: true,
            element: (
                <ProtectedRoute allowedRoles={["seller"]}>
                    <MainLayout title="Product Reviews">
                        <ProductReviewsPage />
                    </MainLayout>
                </ProtectedRoute>
            )
        },

        {
            path: '/transaction',
            exact: true,
            element: (
                <ProtectedRoute allowedRoles={["admin", "seller"]}>
                    <MainLayout title="Transaction">
                        <TransactionPage />
                    </MainLayout>
                </ProtectedRoute>
            )
        },

        {
            path: '/revenue-overview',
            exact: true,
            element: (
                <ProtectedRoute allowedRoles={["admin"]}>
                    <MainLayout title="Revenue Overview">
                        <RevenueOverviewPage />
                    </MainLayout>
                </ProtectedRoute>
            )
        },
        {
            path: '/profile-settings',
            exact: true,
            element: (
                <ProtectedRoute allowedRoles={["admin", "seller"]}>
                    <MainLayout title="Profile Settings">
                        <ProfileSettings />
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