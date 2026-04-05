import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/auth/useAuth";



const ProtectedRoute = ({ children }) => {
    const { isLoggedIn, isLoading } = useAuth();

    if (isLoading) {
        // You can return a loader/spinner here if you want
        return null;
    }

    return isLoggedIn ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
