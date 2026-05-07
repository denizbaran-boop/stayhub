import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { FiBarChart2, FiHome, FiCalendar } from 'react-icons/fi';

const HostOccupancyPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date();
  const ninetyAgo = new Date(today.getTime() - 90 * 86400000);
  const [range, setRange] = useState({
    from: ninetyAgo.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/occupancy/host?from=${range.from}&to=${range.to}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const apply = (e) => { e.preventDefault(); load(); };

  const monthlyMax = data ? Math.max(1, ...data.monthly.map(m => m.occupancy_rate)) : 1;

  return (
    <div className="page occ-page">
      <div className="page-content">
        <h1 className="section-title"><FiBarChart2 /> Occupancy Analytics</h1>
        <p className="page-desc">
          See what percentage of your nights have been booked. Adjust the window to compare seasons.
        </p>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={apply} className="occ-window">
          <label>
            From <input type="date" className="form-input" value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} />
          </label>
          <label>
            To <input type="date" className="form-input" value={range.to} onChange={e => setRange({ ...range, to: e.target.value })} />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>Apply</button>
        </form>

        {loading || !data ? <div className="spinner" /> : (
          <>
            <div className="occ-cards">
              <div className="occ-stat">
                <div className="occ-stat-label">Overall Occupancy</div>
                <div className="occ-stat-value occ-stat-big">{data.overall.occupancy_rate.toFixed(1)}%</div>
                <div className="occ-stat-sub">
                  {data.overall.booked_nights} / {data.overall.capacity_nights} nights
                </div>
              </div>
              <div className="occ-stat">
                <div className="occ-stat-label"><FiHome size={13} /> Properties</div>
                <div className="occ-stat-value">{data.overall.property_count}</div>
              </div>
              <div className="occ-stat">
                <div className="occ-stat-label"><FiCalendar size={13} /> Window</div>
                <div className="occ-stat-value">
                  {Math.round((new Date(range.to) - new Date(range.from)) / 86400000)} days
                </div>
              </div>
            </div>

            <div className="occ-card">
              <h3>Monthly trend (last 12 months)</h3>
              <div className="bar-chart">
                {data.monthly.map(m => (
                  <div key={m.month} className="bar-col" title={`${m.occupancy_rate.toFixed(1)}% — ${m.booked_nights}/${m.capacity_nights} nights`}>
                    <div className="bar-fill" style={{ height: `${(m.occupancy_rate / monthlyMax) * 100}%` }}>
                      <span className="bar-label">{m.occupancy_rate.toFixed(0)}%</span>
                    </div>
                    <span className="bar-x">{m.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="occ-card">
              <h3>By property</h3>
              {data.properties.length === 0 ? (
                <p className="page-desc">You have no listings yet.</p>
              ) : (
                <table className="occ-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Booked nights</th>
                      <th>Bookings</th>
                      <th>Occupancy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.properties.map(p => (
                      <tr key={p.id}>
                        <td>{p.title}</td>
                        <td>{p.city}</td>
                        <td><span className={`status-badge status-${p.status}`}>{p.status}</span></td>
                        <td>{p.booked_nights} / {p.window_nights}</td>
                        <td>{p.booking_count}</td>
                        <td>
                          <div className="rate-bar">
                            <div className="rate-fill" style={{ width: `${Math.min(100, p.occupancy_rate)}%` }}></div>
                          </div>
                          <span className="rate-text">{p.occupancy_rate.toFixed(1)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
      <style>{`
        .occ-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .occ-page .page-content { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
        .section-title { display: flex; align-items: center; gap: 10px; }
        .page-desc { color: var(--text-medium); margin-bottom: 16px; font-size: 14px; }
        .occ-window { display: flex; gap: 12px; align-items: end; margin-bottom: 24px; }
        .occ-window label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--text-medium); }
        .occ-cards { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 16px; margin-bottom: 18px; }
        .occ-stat { background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 18px; box-shadow: var(--shadow-sm); }
        .occ-stat-label { font-size: 12px; text-transform: uppercase; color: var(--text-medium); display: flex; align-items: center; gap: 6px; }
        .occ-stat-value { font-size: 22px; font-weight: 700; margin-top: 6px; }
        .occ-stat-big { font-size: 36px; color: var(--primary); }
        .occ-stat-sub { color: var(--text-medium); font-size: 13px; margin-top: 4px; }
        .occ-card { background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 20px; margin-bottom: 18px; box-shadow: var(--shadow-sm); }
        .occ-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 14px; }

        .bar-chart {
          display: grid; grid-template-columns: repeat(12, 1fr); gap: 6px; height: 180px;
          align-items: end;
        }
        .bar-col { display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: end; }
        .bar-fill {
          width: 100%; background: linear-gradient(180deg, #FF5A5F, #FF8087); border-radius: 4px 4px 0 0;
          min-height: 4px; position: relative; display: flex; align-items: flex-start; justify-content: center;
        }
        .bar-label { color: white; font-size: 10px; font-weight: 700; padding: 2px; }
        .bar-x { font-size: 11px; color: var(--text-medium); margin-top: 4px; }

        .occ-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .occ-table th, .occ-table td { padding: 10px 6px; text-align: left; border-bottom: 1px solid var(--border-light); }
        .occ-table th { font-weight: 600; color: var(--text-medium); font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px; }
        .status-badge { padding: 2px 8px; border-radius: var(--radius-full); font-size: 11px; text-transform: capitalize; }
        .status-active { background: #e6f7ec; color: #1a7e3e; }
        .status-inactive { background: #fff3cd; color: #8a6d11; }
        .status-deleted { background: #f8d7da; color: #842029; }
        .rate-bar { display: inline-block; width: 100px; height: 6px; background: var(--bg-light); border-radius: 3px; margin-right: 8px; vertical-align: middle; overflow: hidden; }
        .rate-fill { background: var(--primary); height: 100%; }
        .rate-text { font-size: 13px; font-weight: 600; }
        @media (max-width: 720px) {
          .occ-cards { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default HostOccupancyPage;
