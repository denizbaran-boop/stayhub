import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FiMail } from 'react-icons/fi';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [demoToken, setDemoToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setDemoToken('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.demo_token) setDemoToken(res.data.demo_token);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Forgot your password?</h1>
          <p>Enter your email and we'll send you a reset link.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        {demoToken && (
          <div className="alert alert-info">
            <p style={{ marginBottom: 8 }}>Demo mode: use this reset link.</p>
            <Link to={`/reset-password?token=${demoToken}`} className="auth-link" style={{ wordBreak: 'break-all' }}>
              Reset now →
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-icon-wrapper">
              <FiMail className="input-icon" size={16} />
              <input
                type="email"
                className="form-input input-with-icon"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg" style={{ marginTop: 8 }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Remembered your password? <Link to="/login" className="auth-link">Sign in</Link>
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

export default ForgotPasswordPage;
