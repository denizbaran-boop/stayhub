import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { FiShield, FiCheck } from 'react-icons/fi';

const SettingsPage = () => {
  const { user } = useAuth();
  const [twoFA, setTwoFA] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await api.get('/auth/profile');
      setTwoFA(!!res.data.two_factor_enabled);
    })();
  }, []);

  const toggle2FA = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put('/auth/toggle-2fa', { enabled: !twoFA });
      setTwoFA(res.data.two_factor_enabled);
      setMessage(res.data.two_factor_enabled
        ? 'Two-factor auth enabled. Next login will require a code.'
        : 'Two-factor auth disabled.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMessage('');
    setPwError('');
    if (passwordForm.new_password !== passwordForm.confirm) {
      return setPwError('New passwords do not match');
    }
    try {
      await api.put('/auth/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPwMessage('Password updated.');
      setPasswordForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="settings-page page">
      <div className="page-content">
        <h1 className="section-title">Account & Security</h1>

        <div className="settings-card">
          <h3><FiShield size={16} /> Two-Factor Authentication</h3>
          <p className="settings-desc">
            When enabled, login requires a 6-digit code sent to your email (mock mailer in this demo).
          </p>
          {message && <div className="alert alert-info">{message}</div>}
          <button onClick={toggle2FA} disabled={saving} className={`btn ${twoFA ? 'btn-danger' : 'btn-primary'}`}>
            {saving ? '...' : twoFA ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
          {twoFA && (
            <p style={{ marginTop: 10, color: '#28a745', fontSize: 13 }}>
              <FiCheck size={13} /> 2FA is active on this account
            </p>
          )}
        </div>

        <div className="settings-card">
          <h3>Change Password</h3>
          {pwMessage && <div className="alert alert-success">{pwMessage}</div>}
          {pwError && <div className="alert alert-error">{pwError}</div>}
          <form onSubmit={changePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Update Password</button>
          </form>
        </div>
      </div>

      <style>{`
        .settings-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .settings-card {
          background: white; border-radius: var(--radius-md); padding: 24px;
          border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);
          margin-bottom: 20px; max-width: 640px;
        }
        .settings-card h3 { font-size: 17px; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
        .settings-desc { font-size: 14px; color: var(--text-medium); margin-bottom: 14px; }
      `}</style>
    </div>
  );
};

export default SettingsPage;
