import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { userApi, publicApi } from '../api/client';
import {
  USER_TOKEN_KEY,
  USER_DATA_KEY,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from '../api/config';

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const savedToken = getStorageItem(USER_TOKEN_KEY);
      const savedUser = getStorageItem(USER_DATA_KEY);

      if (!savedToken) {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
        return;
      }

      if (savedUser) {
        try {
          if (!cancelled) {
            setUser(JSON.parse(savedUser));
            setToken(savedToken);
          }
        } catch {
          /* ignore parse errors */
        }
      }

      try {
        const { data } = await userApi.get('/auth/me');
        if (!cancelled && data.success) {
          setUser(data.user);
          setToken(savedToken);
          setStorageItem(USER_DATA_KEY, JSON.stringify(data.user));
        }
      } catch {
        if (!cancelled) {
          removeStorageItem(USER_TOKEN_KEY);
          removeStorageItem(USER_DATA_KEY);
          setUser(null);
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

  const persist = useCallback((nextToken, nextUser) => {
    setStorageItem(USER_TOKEN_KEY, nextToken);
    setStorageItem(USER_DATA_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await publicApi.post('/auth/login', { email, password });
      persist(data.token, data.user);
      return data;
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await publicApi.post('/auth/register', payload);
      persist(data.token, data.user);
      return data;
    },
    [persist]
  );

  const logout = useCallback(() => {
    removeStorageItem(USER_TOKEN_KEY);
    removeStorageItem(USER_DATA_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
    setStorageItem(USER_DATA_KEY, JSON.stringify(nextUser));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, token, loading, login, register, logout, updateUser]
  );

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useUserAuth must be used within UserAuthProvider');
  return ctx;
}
