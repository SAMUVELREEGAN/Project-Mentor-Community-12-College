import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminApi, publicApi } from '../api/client';
import {
  ADMIN_TOKEN_KEY,
  ADMIN_DATA_KEY,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from '../api/config';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const savedToken = getStorageItem(ADMIN_TOKEN_KEY);
      const savedAdmin = getStorageItem(ADMIN_DATA_KEY);

      if (!savedToken) {
        if (!cancelled) {
          setAdmin(null);
          setToken(null);
          setLoading(false);
        }
        return;
      }

      if (savedAdmin) {
        try {
          if (!cancelled) {
            setAdmin(JSON.parse(savedAdmin));
            setToken(savedToken);
          }
        } catch {
          /* ignore */
        }
      }

      try {
        const { data } = await adminApi.get('/auth/admin/me');
        if (!cancelled && data.success) {
          setAdmin(data.admin);
          setToken(savedToken);
          setStorageItem(ADMIN_DATA_KEY, JSON.stringify(data.admin));
        }
      } catch {
        if (!cancelled) {
          removeStorageItem(ADMIN_TOKEN_KEY);
          removeStorageItem(ADMIN_DATA_KEY);
          setAdmin(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((nextToken, nextAdmin) => {
    setStorageItem(ADMIN_TOKEN_KEY, nextToken);
    setStorageItem(ADMIN_DATA_KEY, JSON.stringify(nextAdmin));
    setToken(nextToken);
    setAdmin(nextAdmin);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await publicApi.post('/auth/admin/login', { email, password });
      persist(data.token, data.admin);
      return data;
    },
    [persist]
  );

  const logout = useCallback(() => {
    removeStorageItem(ADMIN_TOKEN_KEY);
    removeStorageItem(ADMIN_DATA_KEY);
    setToken(null);
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({
      admin,
      token,
      loading,
      isAuthenticated: !!token && !!admin,
      login,
      logout,
    }),
    [admin, token, loading, login, logout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
