import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { FiFlag } from 'react-icons/fi';

const STATUS_COLOR = {
  open: '#FF9500',
  investigating: '#0d6efd',
  resolved: '#28a745',
  rejected: '#6c757d',
};

const MyDisputesPage = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/disputes/mine');
        setDisputes(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="page disputes-page">
      <div className="page-content">
        <h1 className="section-title"><FiFlag /> My Disputes</h1>
        <p className="page-desc">All booking issues you have reported, with their current resolution status.</p>
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? <div className="spinner" /> : disputes.length === 0 ? (
          <div className="empty-card">
            <h3>No disputes filed</h3>
            <p>If something goes wrong with a booking, you can report it from your dashboard.</p>
          </div>
        ) : (
          <div className="dispute-list">
            {disputes.map(d => (
              <div key={d.id} className="dispute-card">
                <div className="dispute-head">
                  <h3>{d.property_title}</h3>
                  <span className="dispute-status" style={{ background: STATUS_COLOR[d.status] }}>
                    {d.status}
                  </span>
                </div>
                <div className="dispute-meta">
                  Reason: <strong>{d.reason.replace(/_/g, ' ')}</strong>
                  {' · '}Stay {new Date(d.check_in).toLocaleDateString()} – {new Date(d.check_out).toLocaleDateString()}
                  {' · '}Filed {new Date(d.created_at).toLocaleDateString()}
                </div>
                <p className="dispute-desc">{d.description}</p>
                {d.resolution_notes && (
                  <div className="resolution">
                    <strong>Admin response:</strong>
                    <p>{d.resolution_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        .disputes-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .disputes-page .page-content { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
        .section-title { display: flex; align-items: center; gap: 10px; }
        .page-desc { color: var(--text-medium); margin-bottom: 24px; font-size: 14px; }
        .dispute-list { display: flex; flex-direction: column; gap: 12px; }
        .dispute-card { background: white; padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); }
        .dispute-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .dispute-head h3 { font-size: 16px; font-weight: 700; }
        .dispute-status {
          color: white; padding: 4px 10px; border-radius: var(--radius-full);
          font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.4px;
        }
        .dispute-meta { color: var(--text-medium); font-size: 13px; margin: 6px 0 12px; text-transform: capitalize; }
        .dispute-desc { white-space: pre-wrap; font-size: 14px; color: var(--text-dark); }
        .resolution { margin-top: 12px; padding: 10px; background: var(--bg-light); border-radius: var(--radius-sm); border-left: 3px solid var(--primary); font-size: 14px; }
        .resolution p { margin-top: 4px; }
        .empty-card { background: white; padding: 32px; border-radius: var(--radius-md); border: 1px solid var(--border-light); text-align: center; }
      `}</style>
    </div>
  );
};

export default MyDisputesPage;
