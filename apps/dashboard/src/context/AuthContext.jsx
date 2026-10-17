import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, storage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storage.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = storage.getToken();
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (err) {
          console.warn('Auth check failed:', err);
          storage.clear();
          setUser(null);
        }
      }
      setLoading(false);
    }

    checkAuth();

    const handleLogoutEvent = () => setUser(null);
    window.addEventListener('wm_auth_logout', handleLogoutEvent);
    return () => window.removeEventListener('wm_auth_logout', handleLogoutEvent);
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (email, password) => {
    const data = await api.register(email, password);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
