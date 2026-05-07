import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FiDollarSign, FiShoppingBag, FiHome, FiUsers, FiTrendingUp, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const AdminRevenuePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/revenue');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="page" style={{ display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>;
  if (error) return <div className="page page-content"><div className="alert alert-error">{error}</div></div>;
  if (!data) return null;

  const maxMonthlyRevenue = Math.max(...data.monthly.map(m => parseFloat(m.revenue)), 1);

  return (
    <div className="admin-page page">
      <div className="page-content">
        <div className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Users</Link>
          <Link to="/admin/revenue" className="admin-nav-link active">Revenue</Link>
          <Link to="/admin/disputes" className="admin-nav-link">Disputes</Link>
        </div>

        <h1 className="section-title">Platform Revenue Report</h1>

        <div className="stats-grid">
          <StatCard icon={<FiDollarSign />} label="Gross Revenue" value={`$${data.overall.gross_revenue.toFixed(0)}`} />
          <StatCard icon={<FiTrendingUp />} label="Commission Revenue" value={`$${data.overall.commission_revenue.toFixed(0)}`} />
          <StatCard icon={<FiShoppingBag />} label="Total Bookings" value={data.overall.total_bookings} />
          <StatCard icon={<FiCheckCircle />} label="Confirmed" value={data.overall.confirmed_bookings} />
          <StatCard icon={<FiCheckCircle />} label="Completed" value={data.overall.completed_bookings} />
          <StatCard icon={<FiXCircle />} label="Cancelled" value={data.overall.cancelled_bookings} />
          <StatCard icon={<FiUsers />} label="Total Users" value={data.counts.users} />
          <StatCard icon={<FiHome />} label="Active Properties" value={data.counts.active_properties} />
        </div>

        {data.monthly.length > 0 && (
          <section className="admin-section">
            <h2 className="admin-section-title">Monthly Revenue</h2>
            <div className="monthly-chart">
              {data.monthly.slice().reverse().map(m => (
                <div key={m.month} className="chart-col">
                  <div className="chart-bar-wrap">
                    <div
                      className="chart-bar"
                      style={{ height: `${(parseFloat(m.revenue) / maxMonthlyRevenue) * 100}%` }}
                    >
                      <span className="chart-value">${parseFloat(m.revenue).toFixed(0)}</span>
                    </div>
                  </div>
                  <span className="chart-label">{m.month}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="admin-section">
          <h2 className="admin-section-title">Top Hosts</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Host</th>
                  <th>Email</th>
                  <th>Bookings</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.top_hosts.map(h => (
                  <tr key={h.id}>
                    <td><Link to={`/users/${h.id}`}>{h.first_name} {h.last_name}</Link></td>
                    <td>{h.email}</td>
                    <td>{h.bookings}</td>
                    <td>${parseFloat(h.revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">Recent Transactions</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Property</th>
                  <th>Guest</th>
                  <th>Host</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td>{tx.property_title}</td>
                    <td>{tx.guest_first_name} {tx.guest_last_name}</td>
                    <td>{tx.host_first_name} {tx.host_last_name}</td>
                    <td>${parseFloat(tx.final_price).toFixed(2)}</td>
                    <td><span className={`badge badge-${tx.status}`}>{tx.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <style>{`
        .admin-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .admin-nav { display: flex; gap: 4px; border-bottom: 1px solid var(--border-light); margin-bottom: 20px; }
        .admin-nav-link {
          padding: 12px 20px; border-bottom: 2px solid transparent; font-weight: 600;
          color: var(--text-medium); margin-bottom: -1px;
        }
        .admin-nav-link.active { color: var(--text-dark); border-bottom-color: var(--text-dark); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 28px; }
        .admin-section { background: white; border-radius: var(--radius-md); padding: 24px; border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); margin-bottom: 24px; }
        .admin-section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
        .monthly-chart {
          display: flex; gap: 12px; align-items: flex-end; height: 200px;
          padding: 12px; background: var(--bg-light); border-radius: var(--radius-sm);
          overflow-x: auto;
        }
        .chart-col { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 60px; flex: 1; }
        .chart-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
        .chart-bar {
          width: 100%; background: linear-gradient(180deg, var(--primary), var(--primary-dark));
          border-radius: 4px 4px 0 0; position: relative; min-height: 3px;
          display: flex; align-items: flex-start; justify-content: center;
        }
        .chart-value {
          font-size: 10px; font-weight: 700; color: white;
          padding-top: 3px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .chart-label { font-size: 11px; color: var(--text-medium); }
        .admin-table-wrap { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 10px 12px; text-align: left; font-size: 13px; border-bottom: 1px solid var(--border-light); }
        .admin-table th { background: var(--bg-light); font-size: 11px; text-transform: uppercase; color: var(--text-medium); letter-spacing: 0.5px; }
      `}</style>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="stat-card">
    <div className="stat-icon-wrap">{icon}</div>
    <div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
    <style>{`
      .stat-card {
        background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md);
        padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: var(--shadow-sm);
      }
      .stat-icon-wrap {
        color: var(--primary); display: flex; align-items: center; justify-content: center;
        width: 40px; height: 40px; background: #FFE3E4; border-radius: 50%;
      }
      .stat-value { font-size: 20px; font-weight: 700; color: var(--text-dark); }
      .stat-label { font-size: 12px; color: var(--text-medium); }
    `}</style>
  </div>
);

export default AdminRevenuePage;
