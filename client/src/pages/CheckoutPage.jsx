import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { FiCreditCard, FiLock, FiCheck, FiCalendar, FiHome } from 'react-icons/fi';

const CheckoutPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    cardholder_name: '',
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        setBooking(res.data);
        const payRes = await api.get(`/payments/booking/${bookingId}`);
        if (payRes.data.some(p => p.status === 'succeeded')) {
          setSuccess(true);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load booking');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId]);

  const formatCard = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const validate = () => {
    const errors = {};
    if (!form.cardholder_name.trim()) errors.cardholder_name = 'Required';
    const digits = form.card_number.replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(digits)) errors.card_number = 'Invalid card number';
    const m = parseInt(form.expiry_month, 10);
    if (!(m >= 1 && m <= 12)) errors.expiry_month = 'MM';
    if (!/^\d{2,4}$/.test(form.expiry_year)) errors.expiry_year = 'YY';
    if (!/^\d{3,4}$/.test(form.cvv)) errors.cvv = 'CVV';
    return errors;
  };

  const handlePay = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setProcessing(true);
    setError('');
    try {
      await api.post('/payments', {
        booking_id: bookingId,
        cardholder_name: form.cardholder_name,
        card_number: form.card_number.replace(/\s+/g, ''),
        expiry_month: parseInt(form.expiry_month, 10),
        expiry_year: parseInt(form.expiry_year, 10),
        cvv: form.cvv,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="page page-content">
        <div className="alert alert-error">{error || 'Booking not found'}</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page checkout-page">
        <div className="checkout-container">
          <div className="checkout-success">
            <FiCheck size={48} className="success-icon" />
            <h1>Payment Successful</h1>
            <p>
              Your payment is held. The booking is <strong>pending host approval</strong> — you'll
              get a confirmation email and in-app alert as soon as the host accepts your request.
              If the host rejects, your payment will be refunded automatically.
            </p>
            <div className="success-summary">
              <p><strong>Booking:</strong> #{booking.id.slice(0, 8)}</p>
              <p><strong>Property:</strong> {booking.property_title}</p>
              <p><strong>Dates:</strong> {booking.check_in} → {booking.check_out}</p>
              <p><strong>Total paid:</strong> ${parseFloat(booking.final_price).toFixed(2)}</p>
              <p><strong>Status:</strong> Awaiting host approval</p>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
              <Link to="/dashboard/guest" className="btn btn-primary">View my trips</Link>
              <Link to="/" className="btn btn-secondary">Back to Home</Link>
            </div>
          </div>
        </div>
        <CheckoutStyles />
      </div>
    );
  }

  const nights = Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / 86400000);

  return (
    <div className="page checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Confirm and pay</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="checkout-grid">
          <form onSubmit={handlePay} className="checkout-form">
            <div className="checkout-section">
              <h3>Pay with <FiCreditCard style={{ verticalAlign: 'middle' }} /></h3>
              <div className="form-group">
                <label className="form-label">Cardholder Name</label>
                <input
                  type="text"
                  className={`form-input ${fieldErrors.cardholder_name ? 'error' : ''}`}
                  placeholder="Jane Doe"
                  value={form.cardholder_name}
                  onChange={(e) => setForm({ ...form, cardholder_name: e.target.value })}
                />
                {fieldErrors.cardholder_name && <span className="form-error">{fieldErrors.cardholder_name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input
                  type="text"
                  className={`form-input ${fieldErrors.card_number ? 'error' : ''}`}
                  placeholder="4242 4242 4242 4242"
                  value={form.card_number}
                  onChange={(e) => setForm({ ...form, card_number: formatCard(e.target.value) })}
                  inputMode="numeric"
                />
                {fieldErrors.card_number && <span className="form-error">{fieldErrors.card_number}</span>}
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Exp. Month</label>
                  <input
                    type="text"
                    className={`form-input ${fieldErrors.expiry_month ? 'error' : ''}`}
                    placeholder="MM"
                    value={form.expiry_month}
                    onChange={(e) => setForm({ ...form, expiry_month: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                  />
                  {fieldErrors.expiry_month && <span className="form-error">{fieldErrors.expiry_month}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Exp. Year</label>
                  <input
                    type="text"
                    className={`form-input ${fieldErrors.expiry_year ? 'error' : ''}`}
                    placeholder="YYYY"
                    value={form.expiry_year}
                    onChange={(e) => setForm({ ...form, expiry_year: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  />
                  {fieldErrors.expiry_year && <span className="form-error">{fieldErrors.expiry_year}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input
                    type="text"
                    className={`form-input ${fieldErrors.cvv ? 'error' : ''}`}
                    placeholder="123"
                    value={form.cvv}
                    onChange={(e) => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  />
                  {fieldErrors.cvv && <span className="form-error">{fieldErrors.cvv}</span>}
                </div>
              </div>
              <p className="demo-note">
                <FiLock size={12} /> Demo only. Any valid-looking card works (Luhn-check).
                Try <code>4242 4242 4242 4242</code>.
              </p>
            </div>

            <button type="submit" disabled={processing} className="btn btn-primary btn-lg btn-full">
              {processing ? 'Processing...' : `Pay $${parseFloat(booking.final_price).toFixed(2)}`}
            </button>
          </form>

          <aside className="checkout-summary">
            <h3>Your booking</h3>
            <div className="summary-property">
              <FiHome size={16} />
              <span>{booking.property_title}</span>
            </div>
            <div className="summary-row">
              <span><FiCalendar size={12} /> Check-in</span>
              <span>{booking.check_in}</span>
            </div>
            <div className="summary-row">
              <span><FiCalendar size={12} /> Check-out</span>
              <span>{booking.check_out}</span>
            </div>
            <div className="summary-row">
              <span>Nights</span>
              <span>{nights}</span>
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${parseFloat(booking.total_price).toFixed(2)}</span>
            </div>
            {parseFloat(booking.discount_amount) > 0 && (
              <div className="summary-row discount">
                <span>Discount</span>
                <span>-${parseFloat(booking.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <span>${parseFloat(booking.final_price).toFixed(2)}</span>
            </div>
          </aside>
        </div>
      </div>
      <CheckoutStyles />
    </div>
  );
};

const CheckoutStyles = () => (
  <style>{`
    .checkout-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
    .checkout-container { max-width: 960px; margin: 0 auto; padding: 32px 24px; }
    .checkout-title { font-size: 26px; font-weight: 700; margin-bottom: 24px; }
    .checkout-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; }
    .checkout-form { background: white; border-radius: var(--radius-md); border: 1px solid var(--border-light); padding: 24px; box-shadow: var(--shadow-sm); }
    .checkout-section h3 { font-size: 17px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .demo-note { font-size: 12px; color: var(--text-medium); margin-top: 8px; display: flex; align-items: center; gap: 6px; }
    .demo-note code { background: var(--bg-light); padding: 1px 6px; border-radius: 3px; font-size: 11px; }
    .checkout-summary { background: white; border-radius: var(--radius-md); border: 1px solid var(--border-light); padding: 24px; box-shadow: var(--shadow-sm); height: fit-content; position: sticky; top: 100px; }
    .checkout-summary h3 { font-size: 17px; font-weight: 700; margin-bottom: 16px; }
    .summary-property { display: flex; align-items: center; gap: 8px; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid var(--border-light); font-weight: 600; }
    .summary-row { display: flex; justify-content: space-between; font-size: 14px; padding: 6px 0; color: var(--text-dark); }
    .summary-row.discount { color: #28a745; }
    .summary-row.total { font-weight: 700; font-size: 16px; border-top: 1px solid var(--border); margin-top: 8px; padding-top: 12px; }
    .summary-row span { display: flex; align-items: center; gap: 4px; }
    .checkout-success { background: white; border-radius: var(--radius-md); padding: 48px; text-align: center; box-shadow: var(--shadow-md); }
    .success-icon { color: #28a745; margin-bottom: 16px; }
    .checkout-success h1 { font-size: 26px; font-weight: 700; margin-bottom: 8px; }
    .checkout-success p { color: var(--text-medium); margin-bottom: 24px; }
    .success-summary { background: var(--bg-light); border-radius: var(--radius-sm); padding: 16px; text-align: left; max-width: 420px; margin: 0 auto; }
    .success-summary p { color: var(--text-dark); margin: 4px 0; }
    @media (max-width: 768px) { .checkout-grid { grid-template-columns: 1fr; } }
  `}</style>
);

export default CheckoutPage;
