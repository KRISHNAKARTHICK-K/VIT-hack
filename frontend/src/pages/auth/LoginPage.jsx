// src/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage = () => {
  const { login, register, demoLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('student@vit.ac.in');
  const [password, setPassword] = useState('student123');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');

  const handleRedirect = (userObj) => {
    const from = location.state?.from?.pathname;
    if (from && from !== '/login') {
      navigate(from, { replace: true });
      return;
    }

    if (userObj.role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else if (userObj.role === 'DEPARTMENT') {
      navigate('/department/dashboard', { replace: true });
    } else {
      navigate('/student/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        const userObj = await register({
          name,
          email,
          password,
          role: 'STUDENT',
          rollNumber,
          department
        });
        showToast(`Registered successfully. Welcome, ${userObj.name}!`, 'success');
        handleRedirect(userObj);
      } else {
        const userObj = await login(email, password);
        showToast(`Authenticated as ${userObj.name}`, 'success');
        handleRedirect(userObj);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setLoading(true);
    try {
      const userObj = await demoLogin(role);
      showToast(`Switched persona to ${role} session: ${userObj.name}`, 'success');
      handleRedirect(userObj);
    } catch (err) {
      showToast('Demo login failed: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '24px 16px'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Header / Insignia */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              backgroundColor: 'var(--primary-container)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              margin: '0 auto 14px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#ffffff' }}>
              account_balance
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
              CampusTrack
            </h1>
            <span
              className="font-mono"
              style={{
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--surface-high)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}
            >
              Access Portal
            </span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 6 }}>
            VIT Institutional Facilities &amp; Operations Registry
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            borderRadius: 'var(--radius-md)',
            padding: 4,
            marginBottom: 24,
            border: '1px solid var(--border-color)'
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              background: !isRegister ? '#ffffff' : 'transparent',
              color: !isRegister ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: !isRegister ? 700 : 500,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '13px',
              boxShadow: !isRegister ? 'var(--shadow-xs)' : 'none'
            }}
            onClick={() => {
              setIsRegister(false);
              setEmail('student@vit.ac.in');
              setPassword('student123');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              background: isRegister ? '#ffffff' : 'transparent',
              color: isRegister ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: isRegister ? 700 : 500,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '13px',
              boxShadow: isRegister ? 'var(--shadow-xs)' : 'none'
            }}
            onClick={() => {
              setIsRegister(true);
              setEmail('');
              setPassword('');
            }}
          >
            Register Student
          </button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isRegister && (
            <>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Marcus Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Student Registration ID *</label>
                <input
                  type="text"
                  className="input-field font-mono"
                  placeholder="e.g. 2024-8841"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Electrical Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Institutional Email *</label>
            <input
              type="email"
              className="input-field font-mono"
              placeholder="username@vit.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password *</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : isRegister ? 'Register & Enter Platform' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Evaluation & Quick Demo Personas */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center'
          }}
        >
          <div
            className="font-mono"
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 10
            }}
          >
            Quick Evaluation Personas (1-Click)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: 'column', gap: 2, padding: '8px 4px' }}
              onClick={() => handleQuickDemo('STUDENT')}
              disabled={loading}
            >
              <strong style={{ color: 'var(--primary)' }}>Student</strong>
              <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Marcus / Aarav
              </span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: 'column', gap: 2, padding: '8px 4px' }}
              onClick={() => handleQuickDemo('ADMIN')}
              disabled={loading}
            >
              <strong style={{ color: 'var(--primary)' }}>Estate Admin</strong>
              <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Dean Thorne
              </span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: 'column', gap: 2, padding: '8px 4px' }}
              onClick={() => handleQuickDemo('DEPARTMENT')}
              disabled={loading}
            >
              <strong style={{ color: 'var(--primary)' }}>Lead Tech</strong>
              <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                R. Morales
              </span>
            </button>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 14, lineHeight: 1.4 }}>
            Authorized university personnel only. Sessions authenticated via institutional SSO.
          </p>
        </div>
      </div>
    </div>
  );
};
