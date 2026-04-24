import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FiDollarSign, FiShoppingBag, FiClock, FiTrendingUp } from 'react-icons/fi';

const HostEarningsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/payouts/earnings');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load earnings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="page" style={{ display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>;
  if (error) return <div className="page page-content"><div className="alert alert-error">{error}</div></div>;
  if (!data) return null;

  const maxMonthly = Math.max(...data.monthly.map(m => parseFloat(m.revenue)), 1);

  return (
    <div className="earnings-page page">
      <div className="page-content">
        <div className="host-nav">
          <Link to="/dashboard/host" className="host-nav-link">Dashboard</Link>
          <Link to="/dashboard/host/payouts" className="host-nav-link">Payouts</Link>
          <Link to="/dashboard/host/earnings" className="host-nav-link active">Earnings</Link>
        </div>

        <h1 className="section-title">Earnings Statistics</h1>

        <div className="earnings-grid">
          <EarnCard icon={<FiDollarSign />} label="Total Earnings" value={`$${data.overall.gross_revenue.toFixed(0)}`} />
          <EarnCard icon={<FiShoppingBag />} label="Completed Bookings" value={data.overall.completed_bookings} />
          <EarnCard icon={<FiClock />} label="Pending Bookings" value={data.overall.pending_bookings} />
          <EarnCard icon={<FiTrendingUp />} label="Avg. Booking Value" value={`$${data.overall.avg_booking_value.toFixed(0)}`} />
          <EarnCard icon={<FiClock />} label="Pending Payout" value={`$${data.overall.pending_payout.toFixed(0)}`} />
          <EarnCard icon={<FiDollarSign />} label="Paid Out" value={`$${data.overall.paid_payout.toFixed(0)}`} />
        </div>

        {data.monthly.length > 0 && (
          <section className="stats-section">
            <h2 className="stats-title">Monthly Earnings</h2>
            <div className="monthly-chart">
              {data.monthly.slice().reverse().map(m => (
                <div key={m.month} className="chart-col">
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{ height: `${(parseFloat(m.revenue) / maxMonthly) * 100}%` }}>
                      <span className="chart-value">${parseFloat(m.revenue).toFixed(0)}</span>
                    </div>
                  </div>
                  <span className="chart-label">{m.month}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.by_property.length > 0 && (
          <section className="stats-section">
            <h2 className="stats-title">By Property</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_property.map(p => (
                    <tr key={p.id}>
                      <td>{p.title}</td>
                      <td>{p.bookings}</td>
                      <td>${parseFloat(p.revenue).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <style>{`
        .earnings-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .host-nav { display: flex; gap: 4px; border-bottom: 1px solid var(--border-light); margin-bottom: 20px; }
        .host-nav-link { padding: 12px 20px; border-bottom: 2px solid transparent; font-weight: 600; color: var(--text-medium); margin-bottom: -1px; }
        .host-nav-link.active { color: var(--text-dark); border-bottom-color: var(--text-dark); }
        .earnings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 28px; }
        .stats-section { background: white; border-radius: var(--radius-md); padding: 24px; border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); margin-bottom: 24px; }
        .stats-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
        .monthly-chart { display: flex; gap: 12px; align-items: flex-end; height: 200px; padding: 12px; background: var(--bg-light); border-radius: var(--radius-sm); }
        .chart-col { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 60px; flex: 1; }
        .chart-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
        .chart-bar { width: 100%; background: linear-gradient(180deg, var(--primary), var(--primary-dark)); border-radius: 4px 4px 0 0; position: relative; min-height: 3px; display: flex; align-items: flex-start; justify-content: center; }
        .chart-value { font-size: 10px; font-weight: 700; color: white; padding-top: 3px; }
        .chart-label { font-size: 11px; color: var(--text-medium); }
        .admin-table-wrap { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 10px 12px; text-align: left; font-size: 13px; border-bottom: 1px solid var(--border-light); }
        .admin-table th { background: var(--bg-light); font-size: 11px; text-transform: uppercase; color: var(--text-medium); letter-spacing: 0.5px; }
      `}</style>
    </div>
  );
};

const EarnCard = ({ icon, label, value }) => (
  <div className="earn-card">
    <div className="earn-icon">{icon}</div>
    <div>
      <p className="earn-value">{value}</p>
      <p className="earn-label">{label}</p>
    </div>
    <style>{`
      .earn-card { background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: var(--shadow-sm); }
      .earn-icon { color: var(--primary); display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #FFE3E4; border-radius: 50%; }
      .earn-value { font-size: 20px; font-weight: 700; color: var(--text-dark); }
      .earn-label { font-size: 12px; color: var(--text-medium); }
    `}</style>
  </div>
);

export default HostEarningsPage;
