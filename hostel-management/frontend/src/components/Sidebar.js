import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AppLogo from './AppLogo';

export default function Sidebar({ navItems, basePath }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U';
  
  const roleLabels = {
    student: 'Student', warden: 'Warden', mess_admin: 'Mess Admin',
    worker: 'Worker', super_admin: 'Super Admin'
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <AppLogo className="sidebar-logo-img" />
          </div>
          <div>
            <div className="sidebar-title">Hostel HMS</div>
            <div className="sidebar-subtitle">Management System</div>
          </div>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div>
          <div className="sidebar-username">{user?.name}</div>
          <div className="sidebar-role">{roleLabels[user?.role] || user?.role}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {navItems.map(item => {
          const path = `${basePath}${item.path}`;
          const isActive = location.pathname === path || (item.path === '' && location.pathname === basePath);
          return (
            <div
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
