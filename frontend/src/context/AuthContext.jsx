// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('campustrack_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('campustrack_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const profile = await authApi.getProfile();
          setUser(profile);
          localStorage.setItem('campustrack_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Session expired or invalid, clearing:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('campustrack_token', res.token);
    localStorage.setItem('campustrack_user', JSON.stringify(res.user));
    return res.user;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('campustrack_token', res.token);
    localStorage.setItem('campustrack_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('campustrack_token');
    localStorage.removeItem('campustrack_user');
  };

  // Demo role switchers for instantaneous testing
  const demoLogin = async (role) => {
    let email = 'student@vit.ac.in';
    let pass = 'student123';

    if (role === 'ADMIN') {
      email = 'admin@vit.ac.in';
      pass = 'admin123';
    } else if (role === 'DEPARTMENT') {
      email = 'electrical@vit.ac.in';
      pass = 'dept123';
    }

    return await login(email, pass);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
