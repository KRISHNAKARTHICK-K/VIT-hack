// src/components/layout/Navbar.jsx - Master Navigation with Real-Time Notifications & Connection Status
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const Navbar = () => {
  const { user, logout, demoLogin } = useAuth();
  const { isConnected, connectionStatus, notifications, unreadCount, markAllAsRead, clearNotifications } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleRoleSwitch = async (role) => {
    setRoleMenuOpen(false);
    await demoLogin(role);
    if (role === 'STUDENT') navigate('/student/dashboard');
    else if (role === 'ADMIN') navigate('/admin/dashboard');
    else if (role === 'DEPARTMENT') navigate('/department/dashboard');
  };

  const handleNavClick = async (targetPath, requiredRole) => {
    if (user.role !== requiredRole) {
      await demoLogin(requiredRole);
    }
    navigate(targetPath);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (user.role === 'ADMIN') {
        navigate(`/admin/issues?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate(`/admin/issues?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const handleNotifClick = (item) => {
    setNotifMenuOpen(false);
    if (item.issueId) {
      navigate(`/student/issues/${item.issueId}`);
    }
  };

  const isStudentView = location.pathname.startsWith('/student');
  const isAdminView = location.pathname.startsWith('/admin');
  const isDeptView = location.pathname.startsWith('/department');

  // Initials for avatar
  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'CT';

  return (
    <header className="stitch-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Brand & Insignia */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary-container)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#ffffff' }}>
              account_balance
            </span>
          </div>
          <div>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.01em' }}>
              CampusTrack
            </span>
            <span
              className="hidden md:inline-block font-mono"
              style={{
                marginLeft: 8,
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--surface-high)',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              VIT Ops
            </span>
          </div>
        </Link>

        {/* Real-Time Live Connection Indicator */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-medium border"
          style={{
            backgroundColor: isConnected ? '#ecfdf5' : connectionStatus === 'connecting' ? '#fffbeb' : '#fef2f2',
            color: isConnected ? '#059669' : connectionStatus === 'connecting' ? '#d97706' : '#dc2626',
            borderColor: isConnected ? '#a7f3d0' : connectionStatus === 'connecting' ? '#fde68a' : '#fecaca',
            fontSize: '11px'
          }}
          title={isConnected ? 'Real-Time WebSocket Sync Connected' : 'Reconnecting to real-time server...'}
        >
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : connectionStatus === 'connecting' ? 'bg-amber-500 animate-ping' : 'bg-rose-500'}`}
          />
          <span>{isConnected ? 'LIVE SYNC' : connectionStatus === 'connecting' ? 'CONNECTING...' : 'OFFLINE'}</span>
        </div>

        {/* Live Search Bar */}
        <div className="relative hidden lg:block" style={{ width: 260, position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: 8,
              fontSize: 18,
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}
          >
            search
          </span>
          <input
            type="text"
            className="input-field"
            style={{
              height: 34,
              paddingLeft: 34,
              paddingRight: 38,
              fontSize: '12px',
              backgroundColor: '#f1f5f9',
              borderColor: '#cbd5e1'
            }}
            placeholder="Search issues, buildings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <span
            className="font-mono"
            style={{
              position: 'absolute',
              right: 8,
              top: 7,
              padding: '2px 6px',
              fontSize: '10px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-xs)',
              color: '#64748b'
            }}
          >
            ↵
          </span>
        </div>
      </div>

      {/* Interactive Role Switcher Navigation Links */}
      <nav className="header-nav-tabs">
        <button
          type="button"
          onClick={() => handleNavClick('/student/dashboard', 'STUDENT')}
          className={`header-nav-tab ${isStudentView ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            school
          </span>
          <span>Student View</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('/admin/dashboard', 'ADMIN')}
          className={`header-nav-tab ${isAdminView ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            admin_panel_settings
          </span>
          <span>Admin Ops</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('/department/dashboard', 'DEPARTMENT')}
          className={`header-nav-tab ${isDeptView ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            construction
          </span>
          <span>Department</span>
        </button>
      </nav>

      {/* Trailing Actions, Notifications & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Quick Action: New Dispatch */}
        <Link to="/student/report" style={{ textDecoration: 'none' }}>
          <button
            className="btn btn-primary btn-sm hidden xl:flex"
            style={{ padding: '6px 12px', fontSize: '12px', gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              add_circle
            </span>
            <span>Report Issue</span>
          </button>
        </Link>

        {/* Real-Time Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => {
              setNotifMenuOpen(!notifMenuOpen);
              if (!notifMenuOpen && unreadCount > 0) {
                markAllAsRead();
              }
            }}
            style={{
              position: 'relative',
              padding: 6,
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)'
            }}
            title="Real-Time Notifications"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              notifications
            </span>
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  minWidth: 16,
                  height: 16,
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '50%',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  boxShadow: '0 0 0 2px #ffffff'
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notifMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                width: 320,
                maxHeight: 400,
                overflowY: 'auto',
                zIndex: 110,
                padding: '8px 0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  borderBottom: '1px solid var(--border-color)'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                  Live Notifications
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    style={{ fontSize: '11px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  No notifications yet. Live updates will appear here.
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotifClick(item)}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: item.issueId ? 'pointer' : 'default',
                      backgroundColor: item.read ? '#ffffff' : '#f8fafc',
                      transition: 'background-color 0.15s'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{item.title}</span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>{item.message}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Identity Badge & Persona Switcher */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <div
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingLeft: 10,
              borderLeft: '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
            title="Click to switch persona or sign out"
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'var(--cobalt)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '12px',
                border: '1px solid #ffffff',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              {initials}
            </div>
            <div className="hidden lg:flex" style={{ flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
                {user.name}
              </span>
              <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {user.rollNumber ? `ID: ${user.rollNumber} · Student` : user.role === 'ADMIN' ? 'Chief Facilities Admin' : `${user.departmentName || 'Technician Lead'}`}
              </span>
            </div>
          </div>

          {/* Quick Persona & Mobile Navigation Dropdown */}
          {roleMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: 6,
                zIndex: 100,
                minWidth: 230,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Session & Personas
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', border: 'none', width: '100%', padding: '6px 10px' }}
                onClick={() => handleRoleSwitch('STUDENT')}
              >
                Student (Aarav Sharma)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', border: 'none', width: '100%', padding: '6px 10px' }}
                onClick={() => handleRoleSwitch('ADMIN')}
              >
                Estate Admin (Dr. Ramanathan)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', border: 'none', width: '100%', padding: '6px 10px' }}
                onClick={() => handleRoleSwitch('DEPARTMENT')}
              >
                Electrical Tech (M. Venkatesh)
              </button>
              <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
              <button
                type="button"
                className="btn btn-danger btn-sm"
                style={{ justifyContent: 'flex-start', width: '100%', padding: '6px 10px' }}
                onClick={logout}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
