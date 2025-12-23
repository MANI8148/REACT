import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import SecurityService from '../services/SecurityService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [loading, setLoading] = useState(true);
    const [is2FARequired, setIs2FARequired] = useState(false);
    const logoutTimerRef = useRef(null);

    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

    const resetLogoutTimer = useCallback(() => {
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        if (user) {
            logoutTimerRef.current = setTimeout(() => {
                logout();
                alert("Session expired due to inactivity.");
            }, INACTIVITY_TIMEOUT);
        }
    }, [user]);

    useEffect(() => {
        setLoading(false);

        // Session protection: Listen for user activity
        window.addEventListener('mousemove', resetLogoutTimer);
        window.addEventListener('keypress', resetLogoutTimer);

        // Initialize timer if user already exists
        if (user) resetLogoutTimer();

        return () => {
            window.removeEventListener('mousemove', resetLogoutTimer);
            window.removeEventListener('keypress', resetLogoutTimer);
            if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        };
    }, [resetLogoutTimer, user]);

    const login = async (email, password) => {
        try {
            // Mocking local response for development
            const mockUser = { id: '1', username: email.split('@')[0], email };

            // SECURITY: Simulate 2FA requirement for demonstration
            setIs2FARequired(true);

            // Store temporarily until 2FA is cleared
            sessionStorage.setItem('pendingUser', JSON.stringify(mockUser));
            return { success: true, requires2FA: true };
        } catch (error) {
            console.error("Login error", error);
            return { success: false, message: "Login failed" };
        }
    };

    const verify2FA = (code) => {
        // Mock 2FA verification - accepted code is '123456'
        if (code === '123456') {
            const pendingUser = JSON.parse(sessionStorage.getItem('pendingUser'));
            if (pendingUser) {
                localStorage.setItem('user', JSON.stringify(pendingUser));
                setUser(pendingUser);
                sessionStorage.removeItem('pendingUser');
                setIs2FARequired(false);
                return { success: true };
            }
        }
        return { success: false, message: "Invalid 2FA code" };
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('pendingUser');
        setUser(null);
        setIs2FARequired(false);
    };

    const register = async (username, email, password) => {
        try {
            // SECURITY: Generate a new mnemonic for the user on registration
            const mnemonic = SecurityService.generateMnemonic();
            const encryptedMnemonic = SecurityService.encryptData(mnemonic, password);

            const mockUser = {
                id: '1',
                username,
                email,
                isSecure: true,
                walletSetup: true
            };

            // Store encrypted mnemonic locally
            localStorage.setItem('wallet_vault', encryptedMnemonic);
            localStorage.setItem('user', JSON.stringify(mockUser));

            setUser(mockUser);
            return { success: true, mnemonic }; // Return mnemonic once for user to backup
        } catch (error) {
            return { success: false, message: "Registration failed" };
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, register, verify2FA, loading, is2FARequired }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
