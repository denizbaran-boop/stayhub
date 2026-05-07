import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FiArrowLeft, FiTrash2, FiPlus, FiCalendar } from 'react-icons/fi';

const SeasonalPricingPage = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', price_per_night: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [calc, setCalc] = useState(null);
  const [calcRange, setCalcRange] = useState({ check_in: '', check_out: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        api.get(`/properties/${propertyId}`),
        api.get(`/seasonal-pricing/property/${propertyId}`),
      ]);
      setProperty(pRes.data);
      setRates(rRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [propertyId]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post(`/seasonal-pricing/property/${propertyId}`, {
        name: form.name,
        start_date: form.start_date,
        end_date: form.end_date,
        price_per_night: parseFloat(form.price_per_night),
      });
      setForm({ name: '', start_date: '', end_date: '', price_per_night: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this seasonal rate?')) return;
    try {
      await api.delete(`/seasonal-pricing/property/${propertyId}/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const runCalc = async () => {
    if (!calcRange.check_in || !calcRange.check_out) return;
    try {
      const res = await api.get(
        `/seasonal-pricing/property/${propertyId}/calculate?check_in=${calcRange.check_in}&check_out=${calcRange.check_out}`
      );
      setCalc(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate');
    }
  };

  if (loading) return <div className="page" style={{ paddingTop: 'var(--navbar-height)' }}><div className="spinner" /></div>;

  return (
    <div className="page sp-page">
      <div className="page-content">
        <button onClick={() => navigate(-1)} className="back-link"><FiArrowLeft /> Back</button>
        <h1 className="section-title"><FiCalendar /> Seasonal Pricing</h1>
        {property && (
          <p className="sp-meta">
            <Link to={`/properties/${propertyId}`}>{property.title}</Link>
            {' · '}Base rate: <strong>${parseFloat(property.price_per_night).toFixed(2)}</strong>/night
          </p>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="sp-card">
          <h3>Add a seasonal rate</h3>
          <p className="sp-desc">
            Override the nightly price for specific date ranges. Booking previews use the base rate;
            the seasonal rate applies to nights inside the range.
          </p>
          <form onSubmit={submit} className="sp-form">
            <input
              type="text"
              placeholder="e.g. Summer 2026"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="form-input"
              required
              maxLength={100}
            />
            <input
              type="date"
              value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
              className="form-input"
              required
            />
            <input
              type="date"
              value={form.end_date}
              onChange={e => setForm({ ...form, end_date: e.target.value })}
              className="form-input"
              required
            />
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="Price per night"
              value={form.price_per_night}
              onChange={e => setForm({ ...form, price_per_night: e.target.value })}
              className="form-input"
              required
            />
            <button type="submit" disabled={saving} className="btn btn-primary">
              <FiPlus size={14} /> {saving ? 'Saving...' : 'Add rate'}
            </button>
          </form>
        </div>

        <div className="sp-card">
          <h3>Active seasonal rates</h3>
          {rates.length === 0 ? (
            <p className="sp-desc">No seasonal rates yet — guests pay the base rate every night.</p>
          ) : (
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Price / night</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rates.map(r => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{new Date(r.start_date).toLocaleDateString()}</td>
                    <td>{new Date(r.end_date).toLocaleDateString()}</td>
                    <td>${parseFloat(r.price_per_night).toFixed(2)}</td>
                    <td>
                      <button onClick={() => remove(r.id)} className="icon-btn icon-btn-danger" title="Delete">
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="sp-card">
          <h3>Test the price calculator</h3>
          <p className="sp-desc">Pick a date range to preview what a guest would pay.</p>
          <div className="sp-form" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
            <input
              type="date"
              value={calcRange.check_in}
              onChange={e => setCalcRange({ ...calcRange, check_in: e.target.value })}
              className="form-input"
            />
            <input
              type="date"
              value={calcRange.check_out}
              onChange={e => setCalcRange({ ...calcRange, check_out: e.target.value })}
              className="form-input"
            />
            <button
              onClick={runCalc}
              disabled={!calcRange.check_in || !calcRange.check_out}
              className="btn btn-secondary"
              type="button"
            >
              Calculate
            </button>
          </div>
          {calc && (
            <div className="sp-result">
              <div><strong>Total:</strong> ${calc.total.toFixed(2)} for {calc.nights} night{calc.nights !== 1 ? 's' : ''}</div>
              <div className="sp-breakdown">
                {calc.breakdown.map(d => (
                  <div key={d.date} className={`sp-day ${d.seasonal ? 'sp-day-season' : ''}`}>
                    <span>{d.date}</span>
                    <span>${d.price.toFixed(2)}</span>
                    {d.seasonal && <small>{d.season_name}</small>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .sp-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .sp-page .page-content { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; padding: 0; margin-bottom: 12px; color: var(--text-medium); font-size: 14px; }
        .section-title { display: flex; align-items: center; gap: 10px; }
        .sp-meta { color: var(--text-medium); margin-bottom: 24px; }
        .sp-meta a { color: var(--primary); text-decoration: underline; }
        .sp-card { background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 20px; margin-bottom: 18px; box-shadow: var(--shadow-sm); }
        .sp-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .sp-desc { font-size: 13px; color: var(--text-medium); margin-bottom: 14px; }
        .sp-form { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr auto; gap: 10px; align-items: center; }
        .sp-form .form-input, .sp-form .btn { width: 100%; }
        .sp-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .sp-table th, .sp-table td { padding: 10px 6px; text-align: left; border-bottom: 1px solid var(--border-light); }
        .sp-table th { font-weight: 600; color: var(--text-medium); font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px; }
        .icon-btn { background: none; border: 1px solid var(--border-light); width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-medium); transition: var(--transition); }
        .icon-btn-danger:hover { background: var(--primary); border-color: var(--primary); color: white; }
        .sp-result { margin-top: 16px; padding: 12px; background: var(--bg-light); border-radius: var(--radius-sm); }
        .sp-breakdown { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .sp-day { display: flex; flex-direction: column; padding: 6px 10px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); background: white; font-size: 12px; }
        .sp-day-season { background: #fff3cd; border-color: #ffe69c; }
        .sp-day small { color: var(--text-medium); }
        @media (max-width: 720px) { .sp-form { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </div>
  );
};

export default SeasonalPricingPage;
