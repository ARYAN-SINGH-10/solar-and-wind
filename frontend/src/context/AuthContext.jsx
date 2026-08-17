import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('solar_wind_token') || null);
  const [loading, setLoading] = useState(true);

  // Map numerical role_id to canonical role_name string
  const getRoleName = (roleId) => {
    switch (Number(roleId)) {
      case 1: return 'ENERGY_PLANNER';
      case 2: return 'GIS_ANALYST';
      case 3: return 'PROJECT_MANAGER';
      case 4: return 'ADMINISTRATOR';
      default: return 'ENERGY_PLANNER';
    }
  };

  // Helper to get default redirect route according to user role
  const getDashboardRoute = (roleName) => {
    switch (roleName) {
      case 'ENERGY_PLANNER': return '/dashboard/planner';
      case 'GIS_ANALYST': return '/dashboard/gis';
      case 'PROJECT_MANAGER': return '/dashboard/manager';
      case 'ADMINISTRATOR': return '/dashboard/admin';
      default: return '/';
    }
  };

  // Check auth session on initial load
  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await apiClient.get('/auth/me');
          const userData = {
            ...res.data,
            role_name: res.data.role_name || getRoleName(res.data.role_id)
          };
          setUser(userData);
        } catch (error) {
          console.warn('Session verification failed, logging out:', error);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    // FastAPI OAuth2PasswordRequestForm expects form-urlencoded username/password
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, user: rawUser } = response.data;
    const userData = {
      ...rawUser,
      role_name: getRoleName(rawUser.role_id)
    };

    localStorage.setItem('solar_wind_token', access_token);
    setToken(access_token);
    setUser(userData);

    return { token: access_token, user: userData, targetRoute: getDashboardRoute(userData.role_name) };
  };

  const register = async (registerData) => {
    const response = await apiClient.post('/auth/register', registerData);
    const { access_token, user: rawUser } = response.data;
    const userData = {
      ...rawUser,
      role_name: getRoleName(rawUser.role_id)
    };

    localStorage.setItem('solar_wind_token', access_token);
    setToken(access_token);
    setUser(userData);

    return { token: access_token, user: userData, targetRoute: getDashboardRoute(userData.role_name) };
  };

  const logout = async () => {
    try {
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch (err) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('solar_wind_token');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    getDashboardRoute,
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
