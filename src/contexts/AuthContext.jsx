import React, { createContext, useContext, useState, useEffect } from 'react';
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // We'll create a /me endpoint or just try to fetch profile
                // The backend auth/me endpoint we created returns profile data if token is valid
                const { data } = await api.get('/auth/me');
                if (data) {
                    setUser(data);
                }
            } catch (error) {
                // Not logged in
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (userId, password) => {
        try {
            const { data } = await api.post('/auth/login', { userId, password });
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (error) {
            console.error('FRONTEND LOGIN ERROR:', error);
            if (error.response) {
                console.error('Data:', error.response.data);
                console.error('Status:', error.status);
            }
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
            setUser(null);
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
