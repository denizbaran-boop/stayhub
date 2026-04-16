import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import DateRangePicker from './DateRangePicker';
import { FiTag, FiCheck, FiX } from 'react-icons/fi';

const BookingForm = ({ property, blockedDates = [] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [error, setError] = useState('');
  const [promoError, setPromoError] = useState('');

  const nights = checkIn && checkOut
    ? Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    : 0;

  const basePrice = nights * parseFloat(property.price_per_night || 0);
  const discount = promoApplied?.discount_amount || 0;
  const total = basePrice - discount;

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    if (!checkIn || !checkOut) {
      setPromoError('Please select dates first');
      return;
    }
    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await api.post('/promotions/validate', {
        code: promoCode,
        property_id: property.id,
        total_price: basePrice,
      });
      setPromoApplied(res.data);
    } catch (err) {
      setPromoError(err.response?.data?.error || 'Invalid promotion code');
      setPromoApplied(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromoApplied(null);
    setPromoCode('');
    setPromoError('');
  };

  const handleBook = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out dates');
      return;
    }
    if (guests < 1) {
      setError('At least 1 guest required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/bookings', {
        property_id: property.id,
        check_in: checkIn.toISOString().split('T')[0],
        check_out: checkOut.toISOString().split('T')[0],
        num_guests: guests,
        promotion_code: promoApplied ? promoCode : undefined,
        special_requests: specialRequests || undefined,
      });
      navigate('/dashboard/guest');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-form">
      <div className="booking-form-header">
        <span className="booking-price">
          <strong>${parseFloat(property.price_per_night).toFixed(0)}</strong>
          <span> / night</span>
        </span>
      </div>

      <DateRangePicker
        checkIn={checkIn}
        checkOut={checkOut}
        onCheckInChange={setCheckIn}
        onCheckOutChange={setCheckOut}
        blockedDates={blockedDates}
      />

      <div className="booking-guests">
        <label className="booking-guests-label">Guests</label>
        <div className="booking-guests-controls">
          <button
            type="button"
            onClick={() => setGuests(Math.max(1, guests - 1))}
            className="guests-btn"
          >-</button>
          <span className="guests-count">{guests} guest{guests !== 1 ? 's' : ''}</span>
          <button
            type="button"
            onClick={() => setGuests(Math.min(property.max_guests, guests + 1))}
            className="guests-btn"
          >+</button>
        </div>
        <span className="guests-max">Max {property.max_guests}</span>
      </div>

      {nights > 0 && (
        <div className="booking-price-breakdown">
          <div className="price-row">
            <span>${parseFloat(property.price_per_night).toFixed(0)} × {nights} night{nights !== 1 ? 's' : ''}</span>
            <span>${basePrice.toFixed(2)}</span>
          </div>
          {promoApplied && (
            <div className="price-row discount">
              <span>Discount ({promoApplied.promo.code})</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="price-row total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Promo code */}
      <div className="promo-section">
        {promoApplied ? (
          <div className="promo-applied">
            <FiCheck size={14} />
            <span>{promoApplied.promo.code} applied - ${discount.toFixed(2)} off</span>
            <button onClick={removePromo} className="promo-remove">
              <FiX size={14} />
            </button>
          </div>
        ) : (
          <div className="promo-input-row">
            <FiTag size={14} />
            <input
              type="text"
              placeholder="Promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="promo-input"
              onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
            />
            <button
              onClick={applyPromo}
              disabled={promoLoading || !promoCode.trim()}
              className="promo-btn"
            >
              {promoLoading ? '...' : 'Apply'}
            </button>
          </div>
        )}
        {promoError && <p className="promo-error">{promoError}</p>}
      </div>

      {/* Special requests */}
      <textarea
        placeholder="Special requests (optional)"
        value={specialRequests}
        onChange={(e) => setSpecialRequests(e.target.value)}
        className="booking-requests"
        rows={2}
      />

      {error && <div className="alert alert-error">{error}</div>}

      <button
        onClick={handleBook}
        disabled={loading || !checkIn || !checkOut}
        className="btn btn-primary btn-full btn-lg booking-submit"
      >
        {loading ? 'Booking...' : user ? 'Reserve' : 'Sign in to book'}
      </button>

      {nights > 0 && (
        <p className="booking-note">You won't be charged yet</p>
      )}

      <style>{`
        .booking-form {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 24px;
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: sticky;
          top: 96px;
        }
        .booking-form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .booking-price {
          font-size: 22px;
          color: var(--text-dark);
        }
        .booking-price strong {
          font-weight: 700;
        }
        .booking-price span {
          font-size: 15px;
          color: var(--text-medium);
        }
        .booking-guests {
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .booking-guests-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .booking-guests-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .guests-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: white;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }
        .guests-btn:hover {
          border-color: var(--text-dark);
        }
        .guests-count {
          font-size: 14px;
          min-width: 60px;
          text-align: center;
        }
        .guests-max {
          font-size: 12px;
          color: var(--text-medium);
        }
        .booking-price-breakdown {
          background: var(--bg-light);
          border-radius: var(--radius-sm);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .price-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: var(--text-dark);
        }
        .price-row.discount {
          color: #28a745;
        }
        .price-row.total {
          font-weight: 700;
          font-size: 16px;
          border-top: 1px solid var(--border);
          padding-top: 8px;
          margin-top: 4px;
        }
        .promo-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .promo-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
        }
        .promo-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          background: none;
          font-family: inherit;
          letter-spacing: 1px;
        }
        .promo-btn {
          background: none;
          border: none;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-dark);
          cursor: pointer;
          text-decoration: underline;
          font-family: inherit;
        }
        .promo-btn:disabled {
          color: var(--text-light);
          cursor: not-allowed;
          text-decoration: none;
        }
        .promo-applied {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #28a745;
          font-size: 14px;
          font-weight: 600;
          padding: 8px 12px;
          background: #D1E7DD;
          border-radius: var(--radius-sm);
        }
        .promo-applied span { flex: 1; }
        .promo-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: #28a745;
          display: flex;
          align-items: center;
        }
        .promo-error {
          font-size: 13px;
          color: var(--primary);
        }
        .booking-requests {
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          font-size: 14px;
          font-family: inherit;
          resize: none;
          color: var(--text-dark);
        }
        .booking-requests:focus {
          outline: none;
          border-color: var(--text-dark);
        }
        .booking-submit {
          border-radius: var(--radius-sm);
          font-size: 16px;
        }
        .booking-note {
          text-align: center;
          font-size: 13px;
          color: var(--text-medium);
        }
      `}</style>
    </div>
  );
};

export default BookingForm;
