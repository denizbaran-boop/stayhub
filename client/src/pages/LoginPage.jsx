import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const LoginPage = () => {
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Two-factor state
  const [twoFAStep, setTwoFAStep] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [demoCode, setDemoCode] = useState('');

  const validate = () => {
    const errors = {};
    if (!form.email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email';
    if (!form.password) errors.password = 'Password is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setError('');
    setFieldErrors({});
    try {
      const result = await login(form.email, form.password);
      if (result.twoFactorRequired) {
        setTwoFAStep(true);
        setChallengeToken(result.challengeToken);
        setDemoCode(result.demoCode || '');
        return;
      }
      const user = result.user;
      navigate(
        user.role === 'admin' ? '/admin'
        : user.role === 'host' ? '/dashboard/host'
        : '/dashboard/guest'
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await verifyTwoFactor(challengeToken, twoFACode.trim());
      navigate(
        user.role === 'admin' ? '/admin'
        : user.role === 'host' ? '/dashboard/host'
        : '/dashboard/guest'
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2C10.477 2 6 6.477 6 12c0 7 10 18 10 18s10-11 10-18c0-5.523-4.477-10-10-10zm0 13.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" fill="#FF5A5F"/>
            </svg>
            StayHub
          </Link>
          <h1>Welcome back</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {twoFAStep ? (
          <form onSubmit={handleVerify2FA} noValidate>
            <p style={{ marginBottom: 16, color: 'var(--text-medium)', fontSize: 14 }}>
              A 6-digit verification code has been sent to your email. Check
              <code> server/logs/emails.log </code>
              or the server console.
            </p>
            {demoCode && (
              <div className="alert alert-info" style={{ fontSize: 13 }}>
                Demo mode: your code is <strong>{demoCode}</strong>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="123456"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
                autoFocus
                inputMode="numeric"
                maxLength={6}
              />
            </div>
            <button type="submit" disabled={loading || !twoFACode} className="btn btn-primary btn-full btn-lg" style={{ marginTop: 8 }}>
              {loading ? 'Verifying...' : 'Verify and Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setTwoFAStep(false); setTwoFACode(''); setChallengeToken(''); setDemoCode(''); }}
              className="btn btn-secondary btn-full"
              style={{ marginTop: 10 }}
            >
              Back
            </button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="input-icon-wrapper">
              <FiMail className="input-icon" size={16} />
              <input
                type="email"
                className={`form-input input-with-icon ${fieldErrors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <FiLock className="input-icon" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input input-with-icon input-with-right-icon ${fieldErrors.password ? 'error' : ''}`}
                placeholder="Your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-right-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg" style={{ marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/forgot-password" className="auth-link" style={{ fontSize: 14 }}>
              Forgot password?
            </Link>
          </div>
        </form>
        )}

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Sign up</Link>
          </p>
        </div>

        <div className="auth-demo">
          <p className="auth-demo-title">Demo accounts:</p>
          <div className="auth-demo-accounts">
            <button
              type="button"
              className="demo-btn"
              onClick={() => setForm({ email: 'sarah@example.com', password: 'password123' })}
            >
              Host: sarah@example.com
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => setForm({ email: 'john@example.com', password: 'password123' })}
            >
              Guest: john@example.com
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => setForm({ email: 'admin@example.com', password: 'password123' })}
            >
              Admin: admin@example.com
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          padding-top: var(--navbar-height);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-light);
          padding: calc(var(--navbar-height) + 32px) 16px 32px;
        }
        .auth-card {
          background: white;
          border-radius: var(--radius-lg);
          padding: 40px;
          width: 100%;
          max-width: 440px;
          box-shadow: var(--shadow-lg);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .auth-logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 22px;
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
          margin-bottom: 20px;
        }
        .auth-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 6px;
        }
        .auth-header p {
          color: var(--text-medium);
          font-size: 15px;
        }
        .input-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-medium);
          pointer-events: none;
        }
        .input-with-icon {
          padding-left: 42px !important;
        }
        .input-with-right-icon {
          padding-right: 42px !important;
        }
        .input-right-icon {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: var(--text-medium);
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .auth-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 14px;
          color: var(--text-medium);
        }
        .auth-link {
          color: var(--primary);
          font-weight: 600;
          text-decoration: none;
        }
        .auth-link:hover { text-decoration: underline; }
        .auth-demo {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--border-light);
        }
        .auth-demo-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-medium);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
          text-align: center;
        }
        .auth-demo-accounts {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .demo-btn {
          padding: 8px 14px;
          background: var(--bg-light);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 12px;
          color: var(--text-medium);
          cursor: pointer;
          text-align: left;
          transition: var(--transition);
          font-family: inherit;
        }
        .demo-btn:hover {
          background: var(--border-light);
          color: var(--text-dark);
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
