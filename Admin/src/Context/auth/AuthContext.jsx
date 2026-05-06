import { createContext, useCallback, useMemo, useState, useEffect } from "react";
import { loginUser, logoutUser, getProfile, forgotPasswordRequest } from "../../features/auth/authAPI.js";
import { alertBox } from "../../shared/utils/alert";

export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadProfile = useCallback(async () => {
        const token = cookieStore.get("accessToken");
        if (!token) {
            setIsLoading(false);
            return null;
        }

        try {
            setIsLoading(true);
            const res = await getProfile();
            if (res?.data?.data && ["admin", "seller"].includes(res?.data?.data?.role)) {
                setUserData(res?.data?.data);
                setIsLoggedIn(true);
                return res?.data?.data;
            }

            setUserData(null);
            setIsLoggedIn(false);
            return null;
        } catch (err) {
            setUserData(null);
            setIsLoggedIn(false);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check for token and fetch user profile on mount
    useEffect(() => {
        loadProfile();
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
                return true;
            }

            // If server returned an error message (e.g. "Invalid Password"), show it
            if (res?.data?.error === true) {
                // If server asks to verify email, trigger sending OTP and redirect to verify page
                const msg = res?.data?.message || '';
                if (msg && msg.toString().toLowerCase().includes('please verify your email')) {
                    try {
                        const email = data?.email || '';
                        if (email) {
                            localStorage.setItem('userEmail', email);
                            localStorage.setItem('actionType', 'verify-email');
                            // Request a fresh OTP (reuse forgot-password endpoint which issues an OTP)
                            await forgotPasswordRequest({ email });
                        }
                    } catch (e) {
                        // ignore resend failures, still redirect so user can request resend from UI
                    }
                    // Redirect user to verify page to enter OTP
                    window.location.assign('/verify-account');
                    return false;
                }

                alertBox('error', msg || 'Failed to login');
                return false;
            }
        } catch (error) {
            const serverMsg = error?.response?.data?.message || error?.message || '';
            if (serverMsg && serverMsg.toString().toLowerCase().includes('please verify your email')) {
                try {
                    const email = data?.email || '';
                    if (email) {
                        localStorage.setItem('userEmail', email);
                        localStorage.setItem('actionType', 'verify-email');
                        await forgotPasswordRequest({ email });
                    }
                } catch (e) {
                    // ignore
                }
                window.location.assign('/verify-account');
                return false;
            }

            alertBox('error', serverMsg || 'Failed to login');
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
        isLoading,
        refreshUserProfile: loadProfile,
    }), [userData, isLoading, isLoggedIn, loadProfile]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );

}