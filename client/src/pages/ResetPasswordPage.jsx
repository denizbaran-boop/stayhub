import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FiLock } from 'react-icons/fi';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (!/\d/.test(password)) return setError('Password must contain at least one number');
    if (!/[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]/.test(password)) return setError('Password must contain at least one special character');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: password });
      alert('Password reset! Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset your password</h1>
          <p>Enter a new password for your account.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Reset token</label>
            <input
              type="text"
              className="form-input"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your reset token"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">New password</label>
            <div className="input-icon-wrapper">
              <FiLock className="input-icon" size={16} />
              <input
                type="password"
                className="form-input input-with-icon"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <div className="input-icon-wrapper">
              <FiLock className="input-icon" size={16} />
              <input
                type="password"
                className="form-input input-with-icon"
                placeholder="Re-enter new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg" style={{ marginTop: 8 }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/login" className="auth-link">Back to Sign in</Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-page { min-height: 100vh; padding-top: var(--navbar-height); display: flex; align-items: center; justify-content: center; background: var(--bg-light); padding: calc(var(--navbar-height) + 32px) 16px 32px; }
        .auth-card { background: white; border-radius: var(--radius-lg); padding: 40px; width: 100%; max-width: 440px; box-shadow: var(--shadow-lg); }
        .auth-header { text-align: center; margin-bottom: 32px; }
        .auth-header h1 { font-size: 24px; font-weight: 700; color: var(--text-dark); margin-bottom: 6px; }
        .auth-header p { color: var(--text-medium); font-size: 15px; }
        .input-icon-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 14px; color: var(--text-medium); pointer-events: none; }
        .input-with-icon { padding-left: 42px !important; }
        .auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: var(--text-medium); }
        .auth-link { color: var(--primary); font-weight: 600; text-decoration: none; }
        .auth-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
};

export default ResetPasswordPage;
