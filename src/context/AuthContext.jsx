import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('shazusoft_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('shazusoft_token'));
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('shazusoft_theme') || 'light');

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data.user);
          localStorage.setItem('shazusoft_user', JSON.stringify(res.data.user));
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: jwtToken, user: userData } = res.data;
    localStorage.setItem('shazusoft_token', jwtToken);
    localStorage.setItem('shazusoft_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const loginWithOTP = async (email, otp) => {
    const res = await authAPI.verifyOTP({ email, otp });
    const { token: jwtToken, user: userData } = res.data;
    localStorage.setItem('shazusoft_token', jwtToken);
    localStorage.setItem('shazusoft_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('shazusoft_token');
    localStorage.removeItem('shazusoft_user');
    setToken(null);
    setUser(null);
  };

  const toggleThemeMode = () => {
    setThemeMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('shazusoft_theme', next);
      return next;
    });
  };

  const value = {
    user,
    token,
    loading,
    themeMode,
    toggleThemeMode,
    login,
    loginWithOTP,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
