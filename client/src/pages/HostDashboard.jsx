import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import StarRating from '../components/StarRating';
import HostReviewForm from '../components/HostReviewForm';
import { FiPlus, FiEdit, FiTrash2, FiCheck, FiX, FiHome, FiCalendar, FiTag, FiUsers, FiDollarSign, FiBarChart2, FiCreditCard, FiLock, FiTrendingUp, FiMessageSquare } from 'react-icons/fi';

const BOOKING_STATUS_TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'];

const HostDashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [bookingTab, setBookingTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_revenue: 0, active_listings: 0, pending_bookings: 0 });

  // New promo form
  const [promoForm, setPromoForm] = useState({
    code: '', discount_type: 'percentage', discount_value: '', description: '',
    max_uses: '', valid_from: '', valid_until: '', property_id: '',
  });
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [reviewingGuestBooking, setReviewingGuestBooking] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [bookingTab]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [bookRes, propRes, promoRes] = await Promise.all([
        api.get('/bookings/host'),
        api.get('/properties'),
        api.get('/promotions'),
      ]);
      const allBookings = bookRes.data;
      setBookings(allBookings);
      setProperties(propRes.data.properties || []);
      setPromotions(promoRes.data);

      // Calculate stats
      const revenue = allBookings
        .filter(b => ['confirmed', 'completed'].includes(b.status))
        .reduce((sum, b) => sum + parseFloat(b.final_price), 0);
      const pending = allBookings.filter(b => b.status === 'pending').length;
      setStats({
        total_revenue: revenue,
        active_listings: (propRes.data.properties || []).filter(p => p.status === 'active').length,
        pending_bookings: pending,
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const params = bookingTab !== 'all' ? { status: bookingTab } : {};
      const res = await api.get('/bookings/host', { params });
      setBookings(res.data);
    } catch {}
  };

  const handleBookingAction = async (bookingId, status) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
      if (status === 'confirmed' || status === 'rejected') {
        setStats(prev => ({ ...prev, pending_bookings: Math.max(0, prev.pending_bookings - 1) }));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Delete this property? This action cannot be undone.')) return;
    try {
      await api.delete(`/properties/${propertyId}`);
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    setPromoLoading(true);
    setPromoError('');
    try {
      const payload = {
        ...promoForm,
        discount_value: parseFloat(promoForm.discount_value),
        max_uses: promoForm.max_uses ? parseInt(promoForm.max_uses) : undefined,
        property_id: promoForm.property_id || undefined,
        valid_from: promoForm.valid_from || undefined,
        valid_until: promoForm.valid_until || undefined,
      };
      const res = await api.post('/promotions', payload);
      setPromotions(prev => [res.data, ...prev]);
      setPromoForm({ code: '', discount_type: 'percentage', discount_value: '', description: '', max_uses: '', valid_from: '', valid_until: '', property_id: '' });
    } catch (err) {
      setPromoError(err.response?.data?.error || 'Failed to create promotion');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleDeletePromo = async (promoId) => {
    try {
      await api.delete(`/promotions/${promoId}`);
      setPromotions(prev => prev.map(p => p.id === promoId ? { ...p, is_active: false } : p));
    } catch {}
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const nightCount = (c1, c2) => Math.ceil((new Date(c2) - new Date(c1)) / 86400000);
  const stayEnded = (checkOut) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(checkOut) <= today;
  };

  return (
    <div className="dashboard-page">
      <div className="page-content">
        <div className="dashboard-header">
          <div>
            <h1>Host Dashboard</h1>
            <p className="dashboard-subtitle">Welcome back, {user?.first_name}!</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to="/dashboard/host/payouts" className="btn btn-secondary">
              <FiCreditCard size={14} /> Payouts
            </Link>
            <Link to="/dashboard/host/earnings" className="btn btn-secondary">
              <FiBarChart2 size={14} /> Earnings
            </Link>
            <Link to="/dashboard/host/occupancy" className="btn btn-secondary">
              <FiTrendingUp size={14} /> Occupancy
            </Link>
            <Link to="/dashboard/host/reviews" className="btn btn-secondary">
              <FiMessageSquare size={14} /> Reviews
            </Link>
            <Link to="/inbox" className="btn btn-secondary">
              Inbox
            </Link>
            <Link to="/create-listing" className="btn btn-primary">
              <FiPlus size={15} /> Add Listing
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="host-stats">
          <div className="stat-card">
            <FiDollarSign size={24} className="stat-icon" />
            <div>
              <p className="stat-value">${stats.total_revenue.toFixed(0)}</p>
              <p className="stat-label">Total Revenue</p>
            </div>
          </div>
          <div className="stat-card">
            <FiHome size={24} className="stat-icon" />
            <div>
              <p className="stat-value">{stats.active_listings}</p>
              <p className="stat-label">Active Listings</p>
            </div>
          </div>
          <div className="stat-card">
            <FiCalendar size={24} className="stat-icon" />
            <div>
              <p className="stat-value">{stats.pending_bookings}</p>
              <p className="stat-label">Pending Bookings</p>
            </div>
          </div>
          <div className="stat-card">
            <FiUsers size={24} className="stat-icon" />
            <div>
              <p className="stat-value">{bookings.filter(b => b.status === 'confirmed').length}</p>
              <p className="stat-label">Confirmed Bookings</p>
            </div>
          </div>
        </div>

        {/* Section nav */}
        <div className="section-nav">
          {[
            { id: 'bookings', label: 'Bookings', count: bookings.filter(b => b.status === 'pending').length },
            { id: 'listings', label: 'Listings' },
            { id: 'promotions', label: 'Promotions' },
          ].map(section => (
            <button
              key={section.id}
              className={`section-nav-btn ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
              {section.count > 0 && <span className="nav-badge">{section.count}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Bookings section */}
            {activeSection === 'bookings' && (
              <div>
                <div className="status-tabs">
                  {BOOKING_STATUS_TABS.map(tab => (
                    <button
                      key={tab}
                      className={`status-tab ${bookingTab === tab ? 'active' : ''}`}
                      onClick={() => setBookingTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {bookings.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <h3>No bookings yet</h3>
                    <p>When guests book your properties, they'll appear here.</p>
                  </div>
                ) : (
                  <div className="bookings-list">
                    {bookings.map(booking => (
                      <div key={booking.id} className="host-booking-card">
                        <div className="host-booking-image">
                          {booking.property_photo ? (
                            <img src={booking.property_photo} alt={booking.property_title} />
                          ) : <div className="booking-card-image-placeholder"><FiHome size={24} /></div>}
                        </div>
                        <div className="host-booking-info">
                          <div className="host-booking-header">
                            <div>
                              <h4 className="host-booking-property">{booking.property_title}</h4>
                              <p className="host-booking-guest">
                                <FiUsers size={12} />
                                {booking.guest_first_name} {booking.guest_last_name} · {booking.guest_email}
                              </p>
                            </div>
                            <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                          </div>
                          <div className="booking-details">
                            <div className="booking-detail">
                              <FiCalendar size={12} />
                              {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
                              <span className="detail-sub">({nightCount(booking.check_in, booking.check_out)} nights)</span>
                            </div>
                            <div className="booking-detail">
                              <FiUsers size={12} />
                              {booking.num_guests} guest{booking.num_guests !== 1 ? 's' : ''}
                            </div>
                          </div>
                          {booking.special_requests && (
                            <p className="booking-special-request">{booking.special_requests}</p>
                          )}
                          <div className="host-booking-footer">
                            <span className="booking-total-amount">${parseFloat(booking.final_price).toFixed(2)}</span>
                            {booking.status === 'pending' && (
                              <div className="host-booking-actions">
                                <button
                                  onClick={() => handleBookingAction(booking.id, 'confirmed')}
                                  className="btn btn-success btn-sm"
                                >
                                  <FiCheck size={14} /> Confirm
                                </button>
                                <button
                                  onClick={() => handleBookingAction(booking.id, 'rejected')}
                                  className="btn btn-danger btn-sm"
                                >
                                  <FiX size={14} /> Reject
                                </button>
                              </div>
                            )}
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => handleBookingAction(booking.id, 'completed')}
                                className="btn btn-secondary btn-sm"
                              >
                                Mark Completed
                              </button>
                            )}
                            {['completed', 'confirmed'].includes(booking.status) && !booking.host_review_id && stayEnded(booking.check_out) && (
                              <button
                                onClick={() => setReviewingGuestBooking(reviewingGuestBooking === booking.id ? null : booking.id)}
                                className="btn btn-outline-primary btn-sm"
                              >
                                Review Guest
                              </button>
                            )}
                            {['completed', 'confirmed'].includes(booking.status) && !booking.host_review_id && !stayEnded(booking.check_out) && (
                              <span style={{ fontSize: 12, color: 'var(--text-medium)' }}>
                                Opens after {formatDate(booking.check_out)}
                              </span>
                            )}
                            {booking.host_review_id && (
                              <span style={{ fontSize: 12, color: 'var(--text-medium)' }}>
                                ✓ Reviewed ({booking.host_review_rating}★)
                              </span>
                            )}
                          </div>
                          {reviewingGuestBooking === booking.id && (
                            <HostReviewForm
                              bookingId={booking.id}
                              onSubmitted={(r) => {
                                setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, host_review_id: r.id, host_review_rating: r.rating } : b));
                                setReviewingGuestBooking(null);
                              }}
                              onCancel={() => setReviewingGuestBooking(null)}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Listings section */}
            {activeSection === 'listings' && (
              <div>
                {properties.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🏠</div>
                    <h3>No listings yet</h3>
                    <p>Start earning by listing your first property.</p>
                    <Link to="/create-listing" className="btn btn-primary">Create Listing</Link>
                  </div>
                ) : (
                  <div className="listings-grid">
                    {properties.map(property => (
                      <div key={property.id} className="listing-card">
                        <div className="listing-card-image">
                          {property.photos?.[0]?.url ? (
                            <img src={property.photos[0].url} alt={property.title} />
                          ) : (
                            <div className="listing-card-placeholder"><FiHome size={28} /></div>
                          )}
                          <span className={`badge badge-${property.status} listing-status-badge`}>
                            {property.status}
                          </span>
                        </div>
                        <div className="listing-card-info">
                          <h4 className="listing-card-title">{property.title}</h4>
                          <p className="listing-card-location">{property.city}, {property.country}</p>
                          <div className="listing-card-stats">
                            <span>${parseFloat(property.price_per_night).toFixed(0)}/night</span>
                            {parseFloat(property.avg_rating) > 0 && (
                              <span>
                                <StarRating rating={parseFloat(property.avg_rating)} size={11} />
                                {parseFloat(property.avg_rating).toFixed(1)}
                              </span>
                            )}
                            <span>{property.review_count || 0} reviews</span>
                          </div>
                          <div className="listing-card-actions">
                            <Link to={`/properties/${property.id}`} className="btn btn-secondary btn-sm">View</Link>
                            <Link to={`/edit-listing/${property.id}`} className="btn btn-secondary btn-sm">
                              <FiEdit size={13} /> Edit
                            </Link>
                            <Link to={`/dashboard/host/properties/${property.id}/availability`} className="btn btn-secondary btn-sm">
                              <FiLock size={13} /> Dates
                            </Link>
                            <Link to={`/dashboard/host/properties/${property.id}/seasonal-pricing`} className="btn btn-secondary btn-sm">
                              <FiTag size={13} /> Pricing
                            </Link>
                            <button
                              onClick={() => handleDeleteProperty(property.id)}
                              className="btn btn-danger btn-sm"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Promotions section */}
            {activeSection === 'promotions' && (
              <div className="promotions-section">
                {/* Create promo form */}
                <div className="promo-form-card">
                  <h3>Create Promotion</h3>
                  {promoError && <div className="alert alert-error">{promoError}</div>}
                  <form onSubmit={handleCreatePromo} className="promo-create-form">
                    <div className="form-row-3">
                      <div className="form-group">
                        <label className="form-label">Promo Code *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="SUMMER20"
                          value={promoForm.code}
                          onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Discount Type *</label>
                        <select
                          className="form-select"
                          value={promoForm.discount_type}
                          onChange={e => setPromoForm({ ...promoForm, discount_type: e.target.value })}
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount ($)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Discount Value * {promoForm.discount_type === 'percentage' ? '(%)' : '($)'}
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder={promoForm.discount_type === 'percentage' ? '10' : '25'}
                          value={promoForm.discount_value}
                          onChange={e => setPromoForm({ ...promoForm, discount_value: e.target.value })}
                          min={0}
                          max={promoForm.discount_type === 'percentage' ? 100 : undefined}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row-3">
                      <div className="form-group">
                        <label className="form-label">Property (optional)</label>
                        <select
                          className="form-select"
                          value={promoForm.property_id}
                          onChange={e => setPromoForm({ ...promoForm, property_id: e.target.value })}
                        >
                          <option value="">All properties</option>
                          {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Valid From</label>
                        <input
                          type="date"
                          className="form-input"
                          value={promoForm.valid_from}
                          onChange={e => setPromoForm({ ...promoForm, valid_from: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Valid Until</label>
                        <input
                          type="date"
                          className="form-input"
                          value={promoForm.valid_until}
                          onChange={e => setPromoForm({ ...promoForm, valid_until: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Summer special discount"
                          value={promoForm.description}
                          onChange={e => setPromoForm({ ...promoForm, description: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Max Uses (optional)</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Unlimited"
                          value={promoForm.max_uses}
                          onChange={e => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                          min={1}
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={promoLoading} className="btn btn-primary">
                      <FiTag size={14} />
                      {promoLoading ? 'Creating...' : 'Create Promotion'}
                    </button>
                  </form>
                </div>

                {/* Promotions list */}
                {promotions.length > 0 && (
                  <div className="promos-list">
                    <h3 style={{ marginBottom: 16 }}>Your Promotions</h3>
                    {promotions.map(promo => (
                      <div key={promo.id} className={`promo-item ${!promo.is_active ? 'inactive' : ''}`}>
                        <div className="promo-code-badge">{promo.code}</div>
                        <div className="promo-details">
                          <p className="promo-value">
                            {promo.discount_type === 'percentage'
                              ? `${promo.discount_value}% off`
                              : `$${promo.discount_value} off`}
                          </p>
                          {promo.description && <p className="promo-desc">{promo.description}</p>}
                          <div className="promo-meta">
                            <span>Used: {promo.uses_count}{promo.max_uses ? `/${promo.max_uses}` : ''}</span>
                            {promo.valid_until && <span>Expires: {new Date(promo.valid_until).toLocaleDateString()}</span>}
                            {promo.property_title && <span>For: {promo.property_title}</span>}
                          </div>
                        </div>
                        <div className="promo-actions">
                          <span className={`badge ${promo.is_active ? 'badge-active' : 'badge-inactive'}`}>
                            {promo.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {promo.is_active && (
                            <button
                              onClick={() => handleDeletePromo(promo.id)}
                              className="btn btn-danger btn-sm"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
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
          margin-bottom: 24px;
        }
        .dashboard-header h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
        .dashboard-subtitle { color: var(--text-medium); }
        .host-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }
        .stat-card {
          background: white;
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border-light);
        }
        .stat-icon { color: var(--primary); flex-shrink: 0; }
        .stat-value { font-size: 24px; font-weight: 700; color: var(--text-dark); }
        .stat-label { font-size: 13px; color: var(--text-medium); }
        .section-nav {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid var(--border-light);
          margin-bottom: 24px;
        }
        .section-nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-medium);
          cursor: pointer;
          transition: var(--transition);
          margin-bottom: -1px;
          font-family: inherit;
        }
        .section-nav-btn:hover { color: var(--text-dark); }
        .section-nav-btn.active {
          color: var(--text-dark);
          border-bottom-color: var(--text-dark);
        }
        .nav-badge {
          background: var(--primary);
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .status-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid var(--border-light);
          margin-bottom: 20px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .status-tab {
          padding: 8px 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-medium);
          cursor: pointer;
          white-space: nowrap;
          transition: var(--transition);
          margin-bottom: -1px;
          font-family: inherit;
        }
        .status-tab:hover { color: var(--text-dark); }
        .status-tab.active { color: var(--text-dark); border-bottom-color: var(--text-dark); }
        .bookings-list { display: flex; flex-direction: column; gap: 12px; }
        .host-booking-card {
          background: white;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          overflow: hidden;
          display: grid;
          grid-template-columns: 160px 1fr;
          box-shadow: var(--shadow-sm);
        }
        .host-booking-image { height: 100%; min-height: 140px; overflow: hidden; }
        .host-booking-image img { width: 100%; height: 100%; object-fit: cover; }
        .booking-card-image-placeholder {
          width: 100%; height: 100%; background: var(--bg-light);
          display: flex; align-items: center; justify-content: center; color: var(--text-light);
        }
        .host-booking-info { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .host-booking-header {
          display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
        }
        .host-booking-property { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
        .host-booking-guest {
          display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--text-medium);
        }
        .booking-details { display: flex; flex-wrap: wrap; gap: 12px; }
        .booking-detail {
          display: flex; align-items: center; gap: 5px; font-size: 13px; color: var(--text-dark);
        }
        .detail-sub { color: var(--text-medium); font-size: 12px; }
        .booking-special-request {
          font-size: 12px; color: var(--text-medium); font-style: italic;
          background: var(--bg-light); padding: 6px 10px; border-radius: var(--radius-sm);
          border-left: 3px solid var(--border);
        }
        .host-booking-footer {
          display: flex; justify-content: space-between; align-items: center;
          padding-top: 10px; border-top: 1px solid var(--border-light); flex-wrap: wrap; gap: 8px;
        }
        .booking-total-amount { font-size: 16px; font-weight: 700; }
        .host-booking-actions { display: flex; gap: 8px; }
        .listings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .listing-card {
          background: white;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .listing-card-image {
          height: 180px; overflow: hidden; position: relative;
        }
        .listing-card-image img { width: 100%; height: 100%; object-fit: cover; }
        .listing-card-placeholder {
          width: 100%; height: 100%; background: var(--bg-light);
          display: flex; align-items: center; justify-content: center; color: var(--text-light);
        }
        .listing-status-badge { position: absolute; top: 8px; left: 8px; }
        .listing-card-info { padding: 16px; }
        .listing-card-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
        .listing-card-location {
          font-size: 13px; color: var(--text-medium); margin-bottom: 8px;
        }
        .listing-card-stats {
          display: flex; flex-wrap: wrap; gap: 10px; font-size: 13px;
          color: var(--text-medium); margin-bottom: 12px; align-items: center;
        }
        .listing-card-actions { display: flex; gap: 8px; }
        .promotions-section { display: flex; flex-direction: column; gap: 24px; }
        .promo-form-card {
          background: white; border-radius: var(--radius-md);
          border: 1px solid var(--border-light); padding: 24px; box-shadow: var(--shadow-sm);
        }
        .promo-form-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
        .promo-create-form { display: flex; flex-direction: column; gap: 16px; }
        .form-row-3 {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
        }
        .form-row-2 {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
        }
        .promos-list { background: white; border-radius: var(--radius-md); border: 1px solid var(--border-light); padding: 24px; }
        .promo-item {
          display: flex; align-items: center; gap: 16px;
          padding: 14px 0; border-bottom: 1px solid var(--border-light);
          flex-wrap: wrap;
        }
        .promo-item:last-child { border-bottom: none; padding-bottom: 0; }
        .promo-item.inactive { opacity: 0.6; }
        .promo-code-badge {
          background: var(--primary); color: white; padding: 6px 14px;
          border-radius: var(--radius-full); font-size: 13px; font-weight: 700;
          letter-spacing: 1px; flex-shrink: 0;
        }
        .promo-details { flex: 1; }
        .promo-value { font-size: 15px; font-weight: 700; }
        .promo-desc { font-size: 13px; color: var(--text-medium); }
        .promo-meta {
          display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: var(--text-medium); margin-top: 4px;
        }
        .promo-actions { display: flex; align-items: center; gap: 10px; }
        @media (max-width: 768px) {
          .host-booking-card { grid-template-columns: 1fr; }
          .host-booking-image { height: 180px; }
          .form-row-3, .form-row-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default HostDashboard;
