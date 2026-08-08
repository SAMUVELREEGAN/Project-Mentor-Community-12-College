import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { UserAuthProvider } from './context/UserAuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import {
  UserProtectedRoute,
  AdminProtectedRoute,
  GuestOnlyUser,
  GuestOnlyAdmin,
} from './components/common/ProtectedRoute';
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';

import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import AdminLogin from './pages/public/AdminLogin';
import { ProjectBrowser } from './pages/user/Projects';
import { ProjectDetailView } from './pages/user/ProjectDetail';
import { QuestionsList } from './pages/user/Questions';
import { QuestionDetailView } from './pages/user/QuestionDetail';

import UserDashboard from './pages/user/Dashboard';
import ProjectsPage from './pages/user/Projects';
import ProjectDetail from './pages/user/ProjectDetail';
import UploadProject from './pages/user/UploadProject';
import MyProjects from './pages/user/MyProjects';
import Questions from './pages/user/Questions';
import QuestionDetail from './pages/user/QuestionDetail';
import Bookmarks from './pages/user/Bookmarks';
import Profile from './pages/user/Profile';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminProjects from './pages/admin/Projects';
import AdminComments from './pages/admin/Comments';
import AdminQuestions from './pages/admin/Questions';
import AdminAdmins from './pages/admin/Admins';
import AdminActivities from './pages/admin/Activities';
import AdminReports from './pages/admin/Reports';

import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <UserAuthProvider>
        <AdminAuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<ProjectBrowser />} />
            <Route path="/projects/:id" element={<ProjectDetailView />} />
            <Route path="/questions" element={<QuestionsList />} />
            <Route path="/questions/:id" element={<QuestionDetailView />} />

            <Route
              path="/login"
              element={
                <GuestOnlyUser>
                  <Login />
                </GuestOnlyUser>
              }
            />
            <Route
              path="/register"
              element={
                <GuestOnlyUser>
                  <Register />
                </GuestOnlyUser>
              }
            />
            <Route
              path="/admin/login"
              element={
                <GuestOnlyAdmin>
                  <AdminLogin />
                </GuestOnlyAdmin>
              }
            />

            <Route
              path="/app"
              element={
                <UserProtectedRoute>
                  <UserLayout />
                </UserProtectedRoute>
              }
            >
              <Route index element={<UserDashboard />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="upload" element={<UploadProject />} />
              <Route path="my-projects" element={<MyProjects />} />
              <Route path="questions" element={<Questions />} />
              <Route path="questions/:id" element={<QuestionDetail />} />
              <Route path="bookmarks" element={<Bookmarks />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="comments" element={<AdminComments />} />
              <Route path="questions" element={<AdminQuestions />} />
              <Route path="admins" element={<AdminAdmins />} />
              <Route path="activities" element={<AdminActivities />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminAuthProvider>
      </UserAuthProvider>
    </BrowserRouter>
  );
}
