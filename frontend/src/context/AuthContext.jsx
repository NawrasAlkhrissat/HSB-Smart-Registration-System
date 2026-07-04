/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import api from '../utils/axiosInstance'; 

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); 
    

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data.user);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false); 
            }
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        setUser(response.data.user);
        return response.data;
    };

    const logout = async () => {
        console.log('User logged out');
        await api.post('/auth/logout');
        setUser(null);
        return true;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {!loading && children} 
        </AuthContext.Provider>
    );
};