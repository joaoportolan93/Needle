import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const data = await getMe();
                    setUser(data);
                    applyTheme(data.theme_preference);
                } catch (error) {
                    console.error("Failed to load user", error);
                    localStorage.removeItem('token');
                }
            } else {
                // Default theme if not logged in
                document.documentElement.classList.add('dark');
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const applyTheme = (theme) => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme === 'light' ? 'light' : 'dark');
    };

    const login = async (email, password) => {
        // loginUser returns { access_token, token_type, theme_preference, user }
        const data = await loginUser(email, password);
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        applyTheme(data.theme_preference);
    };

    const register = async (userData) => {
        await registerUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    };

    const updateUser = (updatedData) => {
        setUser(prev => ({ ...prev, ...updatedData }));
        if (updatedData.theme_preference) {
            applyTheme(updatedData.theme_preference);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
