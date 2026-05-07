import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FiFlag } from 'react-icons/fi';

const STATUS_OPTIONS = ['open', 'investigating', 'resolved', 'rejected'];
const STATUS_COLOR = {
  open: '#FF9500',
  investigating: '#0d6efd',
  resolved: '#28a745',
  rejected: '#6c757d',
};

const AdminDisputesPage = () => {
  const [disputes, setDisputes] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/disputes/admin?status=${statusFilter}` : '/disputes/admin';
      const res = await api.get(url);
      setDisputes(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  const startEdit = (d) => {
    setEditing(d.id);
    setEditStatus(d.status);
    setEditNotes(d.resolution_notes || '');
  };

  const save = async (id) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/disputes/admin/${id}`, {
        status: editStatus,
        resolution_notes: editNotes,
      });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page admin-disputes-page">
      <div className="page-content">
        <div className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Users</Link>
          <Link to="/admin/revenue" className="admin-nav-link">Revenue</Link>
          <Link to="/admin/disputes" className="admin-nav-link active">Disputes</Link>
        </div>
        <h1 className="section-title"><FiFlag /> Dispute Resolution</h1>
        <p className="page-desc">Review and resolve booking issues filed by guests and hosts.</p>

        <div className="filter-bar">
          <span>Filter:</span>
          <button onClick={() => setStatusFilter('')} className={`chip ${!statusFilter ? 'chip-active' : ''}`}>All</button>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`chip ${statusFilter === s ? 'chip-active' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? <div className="spinner" /> : disputes.length === 0 ? (
          <div className="empty-card">
            <h3>No disputes found</h3>
          </div>
        ) : (
          <div className="dispute-list">
            {disputes.map(d => (
              <div key={d.id} className="dispute-card">
                <div className="dispute-head">
                  <div>
                    <h3>{d.property_title}</h3>
                    <div className="dispute-meta">
                      Reported by <strong>{d.reporter_first} {d.reporter_last}</strong> ({d.reporter_email})
                    </div>
                    <div className="dispute-meta">
                      Booking: {new Date(d.check_in).toLocaleDateString()} – {new Date(d.check_out).toLocaleDateString()}
                      {' · '}Guest: {d.guest_first} {d.guest_last}
                      {' · '}Host: {d.host_first} {d.host_last}
                    </div>
                  </div>
                  <span className="dispute-status" style={{ background: STATUS_COLOR[d.status] }}>
                    {d.status}
                  </span>
                </div>
                <div className="dispute-meta" style={{ marginTop: 8 }}>
                  Reason: <strong>{d.reason.replace(/_/g, ' ')}</strong>
                  {' · '}Filed {new Date(d.created_at).toLocaleDateString()}
                </div>
                <p className="dispute-desc">{d.description}</p>

                {editing === d.id ? (
                  <div className="edit-block">
                    <label>Status:</label>
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="form-input">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <label>Resolution notes (visible to reporter):</label>
                    <textarea
                      rows={2}
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      className="form-input"
                      maxLength={1000}
                    />
                    <div className="edit-actions">
                      <button onClick={() => setEditing(null)} className="btn btn-secondary btn-sm">Cancel</button>
                      <button onClick={() => save(d.id)} className="btn btn-primary btn-sm" disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {d.resolution_notes && (
                      <div className="resolution">
                        <strong>Resolution notes:</strong>
                        <p>{d.resolution_notes}</p>
                      </div>
                    )}
                    <button onClick={() => startEdit(d)} className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
                      Update status
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        .admin-disputes-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .admin-disputes-page .page-content { max-width: 1000px; margin: 0 auto; padding: 32px 24px; }
        .admin-nav { display: flex; gap: 4px; border-bottom: 1px solid var(--border-light); margin-bottom: 20px; }
        .admin-nav-link {
          padding: 10px 16px; text-decoration: none; color: var(--text-medium);
          font-weight: 600; border-bottom: 2px solid transparent; margin-bottom: -1px; font-size: 14px;
        }
        .admin-nav-link.active { color: var(--text-dark); border-bottom-color: var(--text-dark); }
        .section-title { display: flex; align-items: center; gap: 10px; }
        .page-desc { color: var(--text-medium); margin-bottom: 18px; font-size: 14px; }
        .filter-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 18px; }
        .chip {
          padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid var(--border);
          background: white; cursor: pointer; font-size: 13px; text-transform: capitalize;
        }
        .chip-active { background: var(--text-dark); color: white; border-color: var(--text-dark); }
        .dispute-list { display: flex; flex-direction: column; gap: 12px; }
        .dispute-card { background: white; padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); }
        .dispute-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .dispute-head h3 { font-size: 16px; font-weight: 700; }
        .dispute-status { color: white; padding: 4px 10px; border-radius: var(--radius-full); font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.4px; flex-shrink: 0; }
        .dispute-meta { color: var(--text-medium); font-size: 13px; text-transform: capitalize; }
        .dispute-desc { white-space: pre-wrap; font-size: 14px; color: var(--text-dark); margin: 12px 0; }
        .resolution { padding: 10px; background: var(--bg-light); border-radius: var(--radius-sm); border-left: 3px solid var(--primary); font-size: 14px; margin-top: 8px; }
        .resolution p { margin-top: 4px; }
        .edit-block { margin-top: 12px; padding: 12px; background: var(--bg-light); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 8px; }
        .edit-block label { font-size: 13px; font-weight: 600; }
        .edit-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-sm { padding: 6px 12px; font-size: 13px; }
        .empty-card { background: white; padding: 32px; border-radius: var(--radius-md); border: 1px solid var(--border-light); text-align: center; }
      `}</style>
    </div>
  );
};

export default AdminDisputesPage;
