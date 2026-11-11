import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute } from '../components/common/AdminRoute';
import { AuthProvider } from '../context/AuthContext';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminAuditPage } from '../pages/admin/AdminAuditPage';
import { AdminBookingsPage } from '../pages/admin/AdminBookingsPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminListingsPage } from '../pages/admin/AdminListingsPage';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';

export const AdminRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin Authentication */}
          <Route path="/login" element={<AdminLoginPage />} />

          {/* Protected Central Admin Operations */}
          <Route
            path="/"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="listings" element={<AdminListingsPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Legacy /admin aliases redirecting cleanly to root */}
          <Route path="/admin" element={<Navigate to="/" replace />} />
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/admin/*" element={<Navigate to="/" replace />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
