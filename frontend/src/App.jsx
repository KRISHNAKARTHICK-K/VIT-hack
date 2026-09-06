import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ReportIssuePage } from './pages/student/ReportIssuePage';
import { IssueDetailPage } from './pages/student/IssueDetailPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminIssuesPage } from './pages/admin/AdminIssuesPage';
import { DepartmentDashboard } from './pages/department/DepartmentDashboard';

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'DEPARTMENT') return <Navigate to="/department/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SocketProvider>
          <BrowserRouter>

          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<HomeRedirect />} />

            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/report"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <ReportIssuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/issues/:id"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'DEPARTMENT']}>
                  <IssueDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/issues"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminIssuesPage />
                </ProtectedRoute>
              }
            />

            {/* Department Routes */}
            <Route
              path="/department/dashboard"
              element={
                <ProtectedRoute allowedRoles={['DEPARTMENT']}>
                  <DepartmentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </BrowserRouter>
        </SocketProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

