
import { createContext, useMemo, useState, useEffect } from "react";
import { loginUser, getProfile } from "../../features/auth/authAPI";
import { alertBox } from "../../shared/utils/alert";

export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for token and fetch user profile on mount
    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem("accessToken");
            if (token) {
                try {
                    setIsLoading(true);
                    const res = await getProfile();
                    if (res?.data?.data && res?.data?.data?.role === "admin") {
                        setUserData(res?.data?.data);
                        setIsLoggedIn(true);
                    } else {
                        setUserData(null);
                        setIsLoggedIn(false);
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");
                    }
                } catch (err) {
                    setUserData(null);
                    setIsLoggedIn(false);
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };
        checkUser();
    }, []);

    const login = async (data) => {
        try {
            setIsLoading(true);
            const res = await loginUser(data);

            if (res?.data?.error === false) {
                if (res?.data?.data?.role !== "admin") {
                    alertBox("error", "You are not authorized to access this page");
                    return false;
                }

                setUserData(res?.data?.data);
                setIsLoggedIn(true);

                localStorage.setItem("accessToken", res?.data?.data?.accessToken);
                localStorage.setItem("refreshToken", res?.data?.data?.refreshToken);

                alertBox("Success", res?.data?.message);
            }
        } catch (error) {
            alertBox("Error", "Failed to login");
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUserData(null);
        setIsLoggedIn(false);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        alertBox("Success", "LogOut successfully");
    };


    const value = useMemo(() => ({
        userData,
        isLoggedIn,
        login,
        logout,
        isLoading
    }), [userData, isLoading, isLoggedIn]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );

}