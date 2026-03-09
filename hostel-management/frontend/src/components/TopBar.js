import React from 'react';
import AppLogo from './AppLogo';

export default function TopBar({ title, subtitle = 'Hostel Management System' }) {
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <AppLogo className="top-bar-logo" />
        <span className="top-bar-title">{title}</span>
      </div>
      <span className="top-bar-subtitle">{subtitle}</span>
    </div>
  );
}

