// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, demoLogin } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleSidebarClick = async (targetPath, requiredRole) => {
    if (user.role !== requiredRole) {
      await demoLogin(requiredRole);
    }
    navigate(targetPath);
  };

  return (
    <aside className="stitch-sidebar hidden md:flex">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Seal Area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-color)'
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#0f2942',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              verified_user
            </span>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', lineHeight: 1.2 }}>
              North Sector Ops
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Central Campus Registry
            </div>
          </div>
        </div>

        {/* Direct CTA: Log Incident */}
        <Link to="/student/report" style={{ textDecoration: 'none' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', gap: 8, padding: '9px 12px', fontSize: '13px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              campaign
            </span>
            <span>Log Incident</span>
          </button>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            type="button"
            onClick={() => handleSidebarClick('/student/dashboard', 'STUDENT')}
            className="header-nav-tab"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isActive('/student/dashboard') ? 'var(--surface-highest)' : 'transparent',
              color: isActive('/student/dashboard') ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: isActive('/student/dashboard') ? 600 : 500,
              border: 'none',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              font: 'inherit'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              dashboard
            </span>
            <span>Operations Hub</span>
          </button>

          <button
            type="button"
            onClick={() => handleSidebarClick('/admin/dashboard', 'ADMIN')}
            className="header-nav-tab"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isActive('/admin/dashboard') ? 'var(--surface-highest)' : 'transparent',
              color: isActive('/admin/dashboard') ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: isActive('/admin/dashboard') ? 600 : 500,
              border: 'none',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              font: 'inherit'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              map
            </span>
            <span>Facilities Hotspots</span>
          </button>

          <button
            type="button"
            onClick={() => handleSidebarClick('/admin/issues', 'ADMIN')}
            className="header-nav-tab"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isActive('/admin/issues') ? 'var(--surface-highest)' : 'transparent',
              color: isActive('/admin/issues') ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: isActive('/admin/issues') ? 600 : 500,
              border: 'none',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              font: 'inherit'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              assignment
            </span>
            <span>Master Dispatches</span>
          </button>

          <button
            type="button"
            onClick={() => handleSidebarClick('/department/dashboard', 'DEPARTMENT')}
            className="header-nav-tab"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isActive('/department/dashboard') ? 'var(--surface-highest)' : 'transparent',
              color: isActive('/department/dashboard') ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: isActive('/department/dashboard') ? 600 : 500,
              border: 'none',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              font: 'inherit'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              construction
            </span>
            <span>Field Terminal</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: 12,
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}
      >
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>VIT Estate Operations</div>
        <div style={{ marginTop: 2, fontFamily: 'var(--font-mono)' }}>System v2.4 · Online</div>
      </div>
    </aside>
  );
};
