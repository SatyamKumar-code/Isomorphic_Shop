import { createContext, useMemo, useState, useEffect } from "react";
import { loginUser, logoutUser, getProfile } from "../../features/auth/authAPI";
import { alertBox } from "../../shared/utils/alert";

export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for token and fetch user profile on mount
    useEffect(() => {
        const checkUser = async () => {
            const token = cookieStore.get("accessToken")
            if (token) {
                try {
                    setIsLoading(true);
                    const res = await getProfile();
                    if (res?.data?.data && ["admin", "seller"].includes(res?.data?.data?.role)) {
                        setUserData(res?.data?.data);
                        setIsLoggedIn(true);
                    } else {
                        setUserData(null);
                        setIsLoggedIn(false);
                    }
                } catch (err) {
                    setUserData(null);
                    setIsLoggedIn(false);
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
                if (!["admin", "seller"].includes(res?.data?.data?.role)) {
                    alertBox("error", "You are not authorized to access this page");
                    return false;
                }

                setUserData(res?.data?.data);
                setIsLoggedIn(true);

                // localStorage.setItem("accessToken", res?.data?.data?.accessToken);
                // localStorage.setItem("refreshToken", res?.data?.data?.refreshToken);

                alertBox("Success", res?.data?.message);
            }
        } catch (error) {
            alertBox("Error", "Failed to login");
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
        } catch (error) {
            console.error("Error occurred while logging out:", error);
        } finally {
            setUserData(null);
            setIsLoggedIn(false);
            alertBox("Success", "LogOut successfully");
        }
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