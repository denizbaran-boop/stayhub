import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import api from '../api/axios';
import { FiLock, FiUnlock, FiCheck, FiHome } from 'react-icons/fi';

const toDateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const ManageAvailabilityPage = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [blocked, setBlocked] = useState(new Set());
  const [booked, setBooked] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const refresh = async () => {
    const [propRes, blockedRes, availRes] = await Promise.all([
      api.get(`/properties/${propertyId}`),
      api.get(`/availability/${propertyId}/blocked`),
      api.get(`/availability/${propertyId}`),
    ]);
    setProperty(propRes.data);
    const manual = new Set();
    Object.entries(availRes.data.availability || {}).forEach(([k, v]) => {
      if (v === false) manual.add(k);
    });
    setBlocked(manual);
    setBooked(new Set((availRes.data.booked_dates || [])));
    setSelected(new Set());
  };

  useEffect(() => {
    refresh().catch(err => setError(err.response?.data?.error || 'Failed to load property'));
  }, [propertyId]);

  const toggleDate = (d) => {
    const key = toDateKey(d);
    if (booked.has(key)) return; // can't modify booked dates
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const applyAction = async (is_available) => {
    if (selected.size === 0) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.post(`/availability/${propertyId}`, {
        dates: Array.from(selected),
        is_available,
      });
      setSuccessMsg(is_available ? 'Dates unblocked' : 'Dates blocked');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    const key = toDateKey(date);
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return 'cal-past';
    if (booked.has(key)) return 'cal-booked';
    if (blocked.has(key)) return 'cal-blocked';
    if (selected.has(key)) return 'cal-selected';
    return 'cal-free';
  };

  return (
    <div className="avail-page page">
      <div className="page-content">
        <div className="host-nav">
          <Link to="/dashboard/host" className="host-nav-link">Dashboard</Link>
          <Link to="/dashboard/host/payouts" className="host-nav-link">Payouts</Link>
          <Link to="/dashboard/host/earnings" className="host-nav-link">Earnings</Link>
        </div>

        <h1 className="section-title">
          Manage Availability
          {property && <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--text-medium)', marginLeft: 12 }}>— {property.title}</span>}
        </h1>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <div className="avail-grid">
          <div className="avail-calendar-wrap">
            <Calendar
              onClickDay={toggleDate}
              tileClassName={tileClassName}
              tileDisabled={({ date, view }) => view === 'month' && booked.has(toDateKey(date))}
              minDetail="month"
            />
            <div className="legend">
              <span className="legend-item"><span className="dot dot-free" /> Available</span>
              <span className="legend-item"><span className="dot dot-blocked" /> Blocked</span>
              <span className="legend-item"><span className="dot dot-booked" /> Booked</span>
              <span className="legend-item"><span className="dot dot-selected" /> Selected</span>
            </div>
          </div>

          <aside className="avail-controls">
            <h3>Selected: {selected.size} date{selected.size !== 1 ? 's' : ''}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-medium)', marginBottom: 16 }}>
              Click dates in the calendar to select them, then block or unblock.
            </p>
            <button
              onClick={() => applyAction(false)}
              disabled={saving || selected.size === 0}
              className="btn btn-danger btn-full"
              style={{ marginBottom: 8 }}
            >
              <FiLock size={13} /> Block selected
            </button>
            <button
              onClick={() => applyAction(true)}
              disabled={saving || selected.size === 0}
              className="btn btn-success btn-full"
            >
              <FiUnlock size={13} /> Unblock selected
            </button>
            <hr className="divider" />
            <Link to={`/properties/${propertyId}`} className="btn btn-secondary btn-full">
              <FiHome size={13} /> View listing
            </Link>
          </aside>
        </div>
      </div>

      <style>{`
        .avail-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .host-nav { display: flex; gap: 4px; border-bottom: 1px solid var(--border-light); margin-bottom: 20px; }
        .host-nav-link { padding: 12px 20px; border-bottom: 2px solid transparent; font-weight: 600; color: var(--text-medium); margin-bottom: -1px; }
        .host-nav-link.active { color: var(--text-dark); border-bottom-color: var(--text-dark); }
        .avail-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
        .avail-calendar-wrap {
          background: white; border-radius: var(--radius-md); padding: 24px;
          border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);
        }
        .avail-controls {
          background: white; border-radius: var(--radius-md); padding: 24px;
          border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); height: fit-content;
        }
        .avail-controls h3 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .legend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 14px; font-size: 12px; color: var(--text-medium); }
        .legend-item { display: inline-flex; align-items: center; gap: 6px; }
        .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
        .dot-free { background: white; border: 1px solid var(--border); }
        .dot-blocked { background: #FFC107; }
        .dot-booked { background: var(--primary); }
        .dot-selected { background: var(--secondary); }
        .react-calendar { width: 100% !important; border: 1px solid var(--border) !important; border-radius: var(--radius-sm); }
        .react-calendar__tile.cal-booked { background: #FFE3E4; color: var(--primary); cursor: not-allowed; }
        .react-calendar__tile.cal-blocked { background: #FFF3CD; color: #856404; }
        .react-calendar__tile.cal-selected { background: var(--secondary); color: white; }
        .react-calendar__tile.cal-past { color: var(--text-light); }
        @media (max-width: 768px) { .avail-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default ManageAvailabilityPage;
