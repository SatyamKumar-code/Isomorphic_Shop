import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/auth/useAuth";



const ProtectedRoute = ({ children, allowedRoles = ["admin", "seller"] }) => {
    const { isLoggedIn, isLoading, userData } = useAuth();

    if (isLoading) {
        // You can return a loader/spinner here if you want
        return null;
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length && !allowedRoles.includes(userData?.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
