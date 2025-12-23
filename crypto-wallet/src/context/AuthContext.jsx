import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored token
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            // For now, assume localhost:5000 if running locally
            // In a real app, use an env var for API_URL
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setUser(res.data.user);
            return { success: true };
        } catch (error) {
            console.error("Login error", error);
            return { success: false, message: error.response?.data?.message || "Login failed" };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const register = async (username, email, password) => {
        try {
            await axios.post('http://localhost:5000/api/auth/register', { username, email, password });
            return await login(email, password);
        } catch (error) {
            return { success: false, message: error.response?.data?.message || "Registration failed" };
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
