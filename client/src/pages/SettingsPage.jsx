import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { FiShield, FiCheck, FiMonitor, FiLogOut } from 'react-icons/fi';

const SettingsPage = () => {
  const { user } = useAuth();
  const [twoFA, setTwoFA] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [sessionMsg, setSessionMsg] = useState('');

  const loadSessions = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    (async () => {
      const res = await api.get('/auth/profile');
      setTwoFA(!!res.data.two_factor_enabled);
      await loadSessions();
    })();
  }, []);

  const revoke = async (id) => {
    if (!window.confirm('Sign out this device?')) return;
    setSessionMsg('');
    try {
      await api.delete(`/sessions/${id}`);
      setSessionMsg('Device signed out.');
      loadSessions();
    } catch (err) {
      setSessionMsg(err.response?.data?.error || 'Failed');
    }
  };

  const revokeOthers = async () => {
    if (!window.confirm('Sign out from all other devices?')) return;
    setSessionMsg('');
    try {
      const res = await api.delete('/sessions/others');
      setSessionMsg(`Signed out ${res.data.revoked_count} other device${res.data.revoked_count === 1 ? '' : 's'}.`);
      loadSessions();
    } catch (err) {
      setSessionMsg(err.response?.data?.error || 'Failed');
    }
  };

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
          <h3><FiMonitor size={16} /> Active Sessions</h3>
          <p className="settings-desc">
            These are the devices currently signed in to your account. Sign out any session you don't recognize.
          </p>
          {sessionMsg && <div className="alert alert-info">{sessionMsg}</div>}
          {sessions.length === 0 ? (
            <p className="settings-desc">No sessions found.</p>
          ) : (
            <ul className="session-list">
              {sessions.map(s => (
                <li key={s.id} className={`session-row ${s.revoked ? 'session-revoked' : ''}`}>
                  <div>
                    <div className="session-label">
                      {s.device_label || 'Unknown device'}
                      {s.is_current && <span className="session-tag">This device</span>}
                      {s.revoked && <span className="session-tag session-tag-rev">Revoked</span>}
                    </div>
                    <div className="session-meta">
                      {s.ip_address ? `${s.ip_address} · ` : ''}Last active {new Date(s.last_active_at).toLocaleString()}
                    </div>
                  </div>
                  {!s.is_current && !s.revoked && (
                    <button className="btn btn-secondary btn-sm" onClick={() => revoke(s.id)}>
                      <FiLogOut size={13} /> Sign out
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {sessions.filter(s => !s.is_current && !s.revoked).length > 0 && (
            <button className="btn btn-danger" onClick={revokeOthers} style={{ marginTop: 12 }}>
              Sign out everywhere else
            </button>
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
        .session-list { list-style: none; padding: 0; margin: 0 0 14px; display: flex; flex-direction: column; gap: 8px; }
        .session-row {
          display: flex; justify-content: space-between; align-items: center; gap: 10px;
          padding: 12px; border: 1px solid var(--border-light); border-radius: var(--radius-sm);
        }
        .session-revoked { opacity: 0.55; }
        .session-label { font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; }
        .session-tag {
          font-size: 11px; background: #28a745; color: white;
          padding: 2px 8px; border-radius: var(--radius-full); font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.4px;
        }
        .session-tag-rev { background: #6c757d; }
        .session-meta { font-size: 12px; color: var(--text-medium); margin-top: 2px; }
        .btn-sm { padding: 6px 12px; font-size: 13px; }
      `}</style>
    </div>
  );
};

export default SettingsPage;
