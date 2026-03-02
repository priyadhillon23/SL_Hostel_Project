import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import WardenDashboard from './pages/WardenDashboard';
import MessAdminDashboard from './pages/MessAdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import './styles/global.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  
  const getDashboard = (role) => {
    switch (role) {
      case 'student': return '/student';
      case 'warden': return '/warden';
      case 'mess_admin': return '/mess-admin';
      case 'worker': return '/worker';
      case 'super_admin': return '/super-admin';
      default: return '/login';
    }
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getDashboard(user.role)} replace /> : <LoginPage />} />
      <Route path="/student/*" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/warden/*" element={<ProtectedRoute allowedRoles={['warden']}><WardenDashboard /></ProtectedRoute>} />
      <Route path="/mess-admin/*" element={<ProtectedRoute allowedRoles={['mess_admin']}><MessAdminDashboard /></ProtectedRoute>} />
      <Route path="/worker/*" element={<ProtectedRoute allowedRoles={['worker']}><WorkerDashboard /></ProtectedRoute>} />
      <Route path="/super-admin/*" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
      <Route path="*" element={user ? <Navigate to={getDashboard(user.role)} replace /> : <Navigate to="/login" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
