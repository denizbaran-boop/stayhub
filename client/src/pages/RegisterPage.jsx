import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'guest',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const SPECIAL_CHAR_RE = /[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]/;

  const validate = () => {
    const errors = {};
    if (!form.first_name.trim()) errors.first_name = 'First name is required';
    if (!form.last_name.trim()) errors.last_name = 'Last name is required';
    if (!form.email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email';
    if (!form.password) errors.password = 'Password is required';
    else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
    else if (!/\d/.test(form.password)) errors.password = 'Password must contain at least one number';
    else if (!SPECIAL_CHAR_RE.test(form.password)) errors.password = 'Password must contain at least one special character';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  // Live indicator for password requirements
  const pw = form.password;
  const pwChecks = {
    length: pw.length >= 8,
    number: /\d/.test(pw),
    special: SPECIAL_CHAR_RE.test(pw),
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
      const { confirmPassword, ...data } = form;
      const user = await register(data);
      navigate(user.role === 'host' ? '/dashboard/host' : '/dashboard/guest');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

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
          <h1>Create account</h1>
          <p>Join StayHub today</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Role selection */}
          <div className="role-selector">
            <button
              type="button"
              className={`role-btn ${form.role === 'guest' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, role: 'guest' })}
            >
              <span>🏖️</span>
              <strong>I'm a Guest</strong>
              <small>Looking to book stays</small>
            </button>
            <button
              type="button"
              className={`role-btn ${form.role === 'host' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, role: 'host' })}
            >
              <span>🏠</span>
              <strong>I'm a Host</strong>
              <small>I want to list my property</small>
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First name</label>
              <div className="input-icon-wrapper">
                <FiUser className="input-icon" size={15} />
                <input
                  type="text"
                  className={`form-input input-with-icon ${fieldErrors.first_name ? 'error' : ''}`}
                  placeholder="John"
                  value={form.first_name}
                  onChange={update('first_name')}
                />
              </div>
              {fieldErrors.first_name && <span className="form-error">{fieldErrors.first_name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Last name</label>
              <input
                type="text"
                className={`form-input ${fieldErrors.last_name ? 'error' : ''}`}
                placeholder="Smith"
                value={form.last_name}
                onChange={update('last_name')}
              />
              {fieldErrors.last_name && <span className="form-error">{fieldErrors.last_name}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="input-icon-wrapper">
              <FiMail className="input-icon" size={15} />
              <input
                type="email"
                className={`form-input input-with-icon ${fieldErrors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={update('email')}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Phone (optional)</label>
            <div className="input-icon-wrapper">
              <FiPhone className="input-icon" size={15} />
              <input
                type="tel"
                className="form-input input-with-icon"
                placeholder="+1-555-000-0000"
                value={form.phone}
                onChange={update('phone')}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <FiLock className="input-icon" size={15} />
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input input-with-icon input-with-right-icon ${fieldErrors.password ? 'error' : ''}`}
                placeholder="Min. 8 chars, 1 number, 1 special"
                value={form.password}
                onChange={update('password')}
                autoComplete="new-password"
              />
              <button type="button" className="input-right-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
            {form.password && (
              <ul className="pw-checklist">
                <li className={pwChecks.length ? 'ok' : ''}>
                  {pwChecks.length ? '✓' : '○'} At least 8 characters
                </li>
                <li className={pwChecks.number ? 'ok' : ''}>
                  {pwChecks.number ? '✓' : '○'} At least one number
                </li>
                <li className={pwChecks.special ? 'ok' : ''}>
                  {pwChecks.special ? '✓' : '○'} At least one special character
                </li>
              </ul>
            )}
            {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <div className="input-icon-wrapper">
              <FiLock className="input-icon" size={15} />
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input input-with-icon ${fieldErrors.confirmPassword ? 'error' : ''}`}
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
              />
            </div>
            {fieldErrors.confirmPassword && <span className="form-error">{fieldErrors.confirmPassword}</span>}
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg" style={{ marginTop: 8 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          padding: calc(var(--navbar-height) + 32px) 16px 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-light);
        }
        .auth-card {
          background: white;
          border-radius: var(--radius-lg);
          padding: 40px;
          width: 100%;
          max-width: 480px;
          box-shadow: var(--shadow-lg);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 28px;
        }
        .auth-logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 22px;
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
          margin-bottom: 16px;
        }
        .auth-header h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .auth-header p { color: var(--text-medium); font-size: 15px; }
        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }
        .role-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 12px;
          border: 2px solid var(--border);
          border-radius: var(--radius-md);
          background: white;
          cursor: pointer;
          transition: var(--transition);
          font-family: inherit;
        }
        .role-btn span { font-size: 24px; }
        .role-btn strong { font-size: 13px; }
        .role-btn small { font-size: 11px; color: var(--text-medium); }
        .role-btn:hover { border-color: var(--primary); }
        .role-btn.active {
          border-color: var(--primary);
          background: #FFF0F0;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
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
        .input-with-icon { padding-left: 42px !important; }
        .input-with-right-icon { padding-right: 42px !important; }
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
          margin-top: 20px;
          font-size: 14px;
          color: var(--text-medium);
        }
        .auth-link {
          color: var(--primary);
          font-weight: 600;
          text-decoration: none;
        }
        .auth-link:hover { text-decoration: underline; }
        .pw-checklist {
          list-style: none;
          padding: 6px 0 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pw-checklist li {
          font-size: 12px;
          color: var(--text-medium);
        }
        .pw-checklist li.ok {
          color: #28a745;
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
