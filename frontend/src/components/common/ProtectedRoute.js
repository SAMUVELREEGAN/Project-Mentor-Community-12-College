import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { LoadingScreen } from './UI';

export function UserProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useUserAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen message="Checking session..." />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export function AdminProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen message="Checking admin session..." />;
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export function GuestOnlyUser({ children }) {
  const { isAuthenticated, loading } = useUserAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return children;
}

export function GuestOnlyAdmin({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/admin" replace />;
  return children;
}
