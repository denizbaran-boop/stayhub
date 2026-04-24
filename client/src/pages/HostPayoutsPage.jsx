import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FiDollarSign, FiClock, FiCheckCircle } from 'react-icons/fi';

const HostPayoutsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payouts');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const release = async (id) => {
    if (!window.confirm('Mark this payout as released (demo)?')) return;
    try {
      await api.post(`/payouts/${id}/release`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  if (loading) return <div className="page" style={{ display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>;
  if (error) return <div className="page page-content"><div className="alert alert-error">{error}</div></div>;
  if (!data) return null;

  return (
    <div className="payouts-page page">
      <div className="page-content">
        <div className="host-nav">
          <Link to="/dashboard/host" className="host-nav-link">Dashboard</Link>
          <Link to="/dashboard/host/payouts" className="host-nav-link active">Payouts</Link>
          <Link to="/dashboard/host/earnings" className="host-nav-link">Earnings</Link>
        </div>

        <h1 className="section-title">Payouts</h1>

        <div className="payout-summary">
          <div className="payout-card pending">
            <FiClock size={22} />
            <div>
              <p className="payout-card-value">${data.summary.pending_total.toFixed(2)}</p>
              <p className="payout-card-label">Pending ({data.summary.pending_count})</p>
            </div>
          </div>
          <div className="payout-card paid">
            <FiCheckCircle size={22} />
            <div>
              <p className="payout-card-value">${data.summary.paid_total.toFixed(2)}</p>
              <p className="payout-card-label">Released ({data.summary.paid_count})</p>
            </div>
          </div>
          <div className="payout-card total">
            <FiDollarSign size={22} />
            <div>
              <p className="payout-card-value">${data.summary.lifetime_total.toFixed(2)}</p>
              <p className="payout-card-label">Lifetime</p>
            </div>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Guest</th>
                <th>Dates</th>
                <th>Total</th>
                <th>Commission</th>
                <th>Your Payout</th>
                <th>Status</th>
                <th>Payout Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.payouts.length === 0 && (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: 28, color: 'var(--text-medium)' }}>No payouts yet. Payouts are created after a guest pays for a booking.</td></tr>
              )}
              {data.payouts.map(p => (
                <tr key={p.id}>
                  <td>{p.property_title}</td>
                  <td>{p.guest_first_name} {p.guest_last_name}</td>
                  <td>{p.check_in} → {p.check_out}</td>
                  <td>${parseFloat(p.booking_total).toFixed(2)}</td>
                  <td>${parseFloat(p.commission).toFixed(2)}</td>
                  <td><strong>${parseFloat(p.amount).toFixed(2)}</strong></td>
                  <td>
                    {p.status === 'paid' ? <span className="badge badge-completed">Paid</span>
                     : p.status === 'on_hold' ? <span className="badge badge-inactive">On hold</span>
                     : <span className="badge badge-pending">Pending</span>}
                  </td>
                  <td>{p.payout_date || '—'}</td>
                  <td>
                    {p.status === 'pending' && (
                      <button onClick={() => release(p.id)} className="btn btn-success btn-sm">Release</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .payouts-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .host-nav { display: flex; gap: 4px; border-bottom: 1px solid var(--border-light); margin-bottom: 20px; }
        .host-nav-link { padding: 12px 20px; border-bottom: 2px solid transparent; font-weight: 600; color: var(--text-medium); margin-bottom: -1px; }
        .host-nav-link.active { color: var(--text-dark); border-bottom-color: var(--text-dark); }
        .payout-summary {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px; margin-bottom: 28px;
        }
        .payout-card {
          background: white; padding: 20px; border-radius: var(--radius-md);
          border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);
          display: flex; align-items: center; gap: 12px;
        }
        .payout-card.pending { border-left: 4px solid #FFC107; }
        .payout-card.paid { border-left: 4px solid #28a745; }
        .payout-card.total { border-left: 4px solid var(--primary); }
        .payout-card-value { font-size: 22px; font-weight: 700; }
        .payout-card-label { font-size: 13px; color: var(--text-medium); }
        .admin-table-wrap {
          background: white; border-radius: var(--radius-md); overflow: hidden;
          border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);
          overflow-x: auto;
        }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 10px 12px; text-align: left; font-size: 13px; border-bottom: 1px solid var(--border-light); }
        .admin-table th { background: var(--bg-light); font-size: 11px; text-transform: uppercase; color: var(--text-medium); letter-spacing: 0.5px; }
      `}</style>
    </div>
  );
};

export default HostPayoutsPage;
