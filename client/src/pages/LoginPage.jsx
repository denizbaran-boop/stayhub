import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

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
      const user = await login(form.email, form.password);
      navigate(user.role === 'host' ? '/dashboard/host' : '/dashboard/guest');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
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
        </form>

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
