import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import ReviewForm from '../components/ReviewForm';
import StarRating from '../components/StarRating';
import ReportIssueButton from '../components/ReportIssueButton';
import { FiMapPin, FiCalendar, FiUsers, FiTag, FiHome } from 'react-icons/fi';

const STATUS_TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const GuestDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const res = await api.get('/bookings/guest', { params });
      setBookings(res.data);
    } catch {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [activeTab]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReviewSubmitted = (review) => {
    setBookings(prev => prev.map(b =>
      b.id === reviewingBooking ? { ...b, review_id: review.id, review_rating: review.rating } : b
    ));
    setReviewingBooking(null);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const nightCount = (checkIn, checkOut) => Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000);
  const stayEnded = (checkOut) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(checkOut) <= today;
  };

  return (
    <div className="dashboard-page">
      <div className="page-content">
        <div className="dashboard-header">
          <div>
            <h1>My Trips</h1>
            <p className="dashboard-subtitle">Welcome back, {user?.first_name}!</p>
          </div>
          <Link to="/search" className="btn btn-primary">
            <FiHome size={15} /> Find a Stay
          </Link>
        </div>

        {/* Status tabs */}
        <div className="status-tabs">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              className={`status-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧳</div>
            <h3>No trips yet</h3>
            <p>Time to start exploring! Find amazing stays around the world.</p>
            <Link to="/search" className="btn btn-primary">Start Searching</Link>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-card-image">
                  {booking.property_photo ? (
                    <img src={booking.property_photo} alt={booking.property_title} />
                  ) : (
                    <div className="booking-card-image-placeholder">
                      <FiHome size={28} />
                    </div>
                  )}
                </div>
                <div className="booking-card-info">
                  <div className="booking-card-header">
                    <div>
                      <Link to={`/properties/${booking.property_id}`} className="booking-property-title">
                        {booking.property_title}
                      </Link>
                      <p className="booking-location">
                        <FiMapPin size={12} />
                        {booking.property_city}, {booking.property_country}
                      </p>
                    </div>
                    <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                  </div>

                  <div className="booking-details">
                    <div className="booking-detail">
                      <FiCalendar size={13} />
                      <span>{formatDate(booking.check_in)} – {formatDate(booking.check_out)}</span>
                      <span className="detail-sub">({nightCount(booking.check_in, booking.check_out)} nights)</span>
                    </div>
                    <div className="booking-detail">
                      <FiUsers size={13} />
                      <span>{booking.num_guests} guest{booking.num_guests !== 1 ? 's' : ''}</span>
                    </div>
                    {booking.discount_amount > 0 && (
                      <div className="booking-detail">
                        <FiTag size={13} />
                        <span style={{ color: '#28a745' }}>Discount: -${parseFloat(booking.discount_amount).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {booking.special_requests && (
                    <p className="booking-special-request">
                      Note: {booking.special_requests}
                    </p>
                  )}

                  <div className="booking-card-footer">
                    <div className="booking-price-display">
                      <span className="booking-total-label">Total paid:</span>
                      <span className="booking-total-amount">${parseFloat(booking.final_price).toFixed(2)}</span>
                    </div>

                    <div className="booking-actions">
                      {['pending', 'confirmed'].includes(booking.status) && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="btn btn-secondary btn-sm"
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                      {['completed', 'confirmed'].includes(booking.status) && !booking.review_id && stayEnded(booking.check_out) && (
                        <button
                          onClick={() => setReviewingBooking(reviewingBooking === booking.id ? null : booking.id)}
                          className="btn btn-outline-primary btn-sm"
                        >
                          Leave Review
                        </button>
                      )}
                      {['completed', 'confirmed'].includes(booking.status) && !booking.review_id && !stayEnded(booking.check_out) && (
                        <span style={{ fontSize: 12, color: 'var(--text-medium)' }}>
                          Review opens after {formatDate(booking.check_out)}
                        </span>
                      )}
                      {booking.review_id && (
                        <div className="reviewed-badge">
                          <StarRating rating={booking.review_rating} size={13} /> Reviewed
                        </div>
                      )}
                      {['confirmed', 'completed'].includes(booking.status) && (
                        <ReportIssueButton bookingId={booking.id} />
                      )}
                    </div>
                  </div>

                  {reviewingBooking === booking.id && (
                    <div style={{ marginTop: 16 }}>
                      <ReviewForm
                        bookingId={booking.id}
                        onReviewSubmitted={handleReviewSubmitted}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .dashboard-page {
          padding-top: var(--navbar-height);
          min-height: 100vh;
          background: var(--bg-light);
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
        }
        .dashboard-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .dashboard-subtitle { color: var(--text-medium); font-size: 15px; }
        .status-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid var(--border-light);
          margin-bottom: 24px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .status-tab {
          padding: 10px 18px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-medium);
          cursor: pointer;
          white-space: nowrap;
          transition: var(--transition);
          margin-bottom: -1px;
          font-family: inherit;
        }
        .status-tab:hover { color: var(--text-dark); }
        .status-tab.active {
          color: var(--text-dark);
          border-bottom-color: var(--text-dark);
        }
        .bookings-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .booking-card {
          background: white;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          overflow: hidden;
          display: grid;
          grid-template-columns: 200px 1fr;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }
        .booking-card:hover { box-shadow: var(--shadow-md); }
        .booking-card-image {
          height: 100%;
          min-height: 160px;
          overflow: hidden;
        }
        .booking-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .booking-card-image-placeholder {
          width: 100%;
          height: 100%;
          background: var(--bg-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-light);
        }
        .booking-card-info {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .booking-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .booking-property-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--text-dark);
          text-decoration: none;
          display: block;
          margin-bottom: 4px;
        }
        .booking-property-title:hover { text-decoration: underline; }
        .booking-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: var(--text-medium);
        }
        .booking-details {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }
        .booking-detail {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--text-dark);
        }
        .detail-sub { color: var(--text-medium); font-size: 13px; }
        .booking-special-request {
          font-size: 13px;
          color: var(--text-medium);
          font-style: italic;
          background: var(--bg-light);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          border-left: 3px solid var(--border);
        }
        .booking-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid var(--border-light);
          flex-wrap: wrap;
          gap: 12px;
        }
        .booking-price-display {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .booking-total-label { font-size: 13px; color: var(--text-medium); }
        .booking-total-amount { font-size: 18px; font-weight: 700; }
        .booking-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .reviewed-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-medium);
        }
        @media (max-width: 640px) {
          .booking-card { grid-template-columns: 1fr; }
          .booking-card-image { height: 200px; }
        }
      `}</style>
    </div>
  );
};

export default GuestDashboard;
