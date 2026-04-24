import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import StarRating from '../components/StarRating';
import { FiUser, FiHome, FiCalendar, FiStar } from 'react-icons/fi';

const PublicProfilePage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [guestReviews, setGuestReviews] = useState({ reviews: [], avg_rating: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/users/${id}`);
        setData(res.data);
        if (res.data.user.role === 'guest' || res.data.user.role === 'admin') {
          const hr = await api.get(`/host-reviews/guest/${id}`);
          setGuestReviews(hr.data);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Profile not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="page" style={{ display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>;
  if (error || !data) return <div className="page page-content"><div className="alert alert-error">{error || 'Profile not found'}</div></div>;

  const { user, properties, host_rating, guest_stats, guest_rating } = data;
  const joined = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="profile-page page">
      <div className="page-content">
        <div className="profile-header">
          <div className="profile-avatar-big">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.first_name} />
            ) : (
              <FiUser size={40} />
            )}
          </div>
          <div className="profile-header-info">
            <h1>{user.first_name} {user.last_name}</h1>
            <p className="profile-role">
              <span className="badge badge-active" style={{ textTransform: 'capitalize' }}>{user.role}</span>
              <span style={{ marginLeft: 8 }}>Joined {joined}</span>
            </p>
            <div className="profile-quick-stats">
              {user.role === 'host' && host_rating && host_rating.review_count > 0 && (
                <div className="quick-stat">
                  <FiStar size={16} fill="#FF5A5F" color="#FF5A5F" />
                  <strong>{host_rating.avg_rating}</strong>
                  <span>· {host_rating.review_count} review{host_rating.review_count !== 1 ? 's' : ''}</span>
                </div>
              )}
              {user.role === 'host' && properties && (
                <div className="quick-stat">
                  <FiHome size={16} />
                  <strong>{properties.length}</strong>
                  <span>listing{properties.length !== 1 ? 's' : ''}</span>
                </div>
              )}
              {guest_stats && (
                <>
                  <div className="quick-stat">
                    <FiCalendar size={16} />
                    <strong>{guest_stats.completed_stays}</strong>
                    <span>completed stay{guest_stats.completed_stays !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="quick-stat">
                    <FiCalendar size={16} />
                    <strong>{guest_stats.upcoming_stays}</strong>
                    <span>upcoming</span>
                  </div>
                </>
              )}
              {user.role === 'guest' && guest_rating && guest_rating.review_count > 0 && (
                <div className="quick-stat">
                  <FiStar size={16} fill="#FF5A5F" color="#FF5A5F" />
                  <strong>{guest_rating.avg_rating}</strong>
                  <span>from hosts</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {user.role === 'host' && properties && properties.length > 0 && (
          <section className="profile-section">
            <h2 className="section-title">{user.first_name}'s listings</h2>
            <div className="profile-listings">
              {properties.map(p => (
                <Link to={`/properties/${p.id}`} key={p.id} className="profile-listing-card">
                  <div className="profile-listing-img">
                    {p.primary_photo ? (
                      <img src={p.primary_photo} alt={p.title} />
                    ) : (
                      <div className="profile-listing-placeholder"><FiHome size={24} /></div>
                    )}
                  </div>
                  <div className="profile-listing-info">
                    <h4>{p.title}</h4>
                    <p>{p.city}, {p.country}</p>
                    <p className="profile-listing-stats">
                      {parseFloat(p.avg_rating) > 0 && (
                        <>
                          <StarRating rating={parseFloat(p.avg_rating)} size={12} />
                          {parseFloat(p.avg_rating).toFixed(1)} · {' '}
                        </>
                      )}
                      ${parseFloat(p.price_per_night).toFixed(0)}/night
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {user.role === 'guest' && guestReviews.reviews.length > 0 && (
          <section className="profile-section">
            <h2 className="section-title">What hosts say about {user.first_name}</h2>
            <div className="review-list">
              {guestReviews.reviews.map(r => (
                <div key={r.id} className="review-item">
                  <div className="review-user">
                    <img
                      src={r.host_avatar || `https://i.pravatar.cc/40?u=${r.host_id}`}
                      alt={r.host_first_name}
                      className="review-avatar"
                    />
                    <div>
                      <strong>{r.host_first_name} {r.host_last_name}</strong>
                      <p className="review-date">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <StarRating rating={r.rating} size={13} />
                  {r.comment && <p className="review-comment">{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <style>{`
        .profile-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .profile-header {
          background: white;
          border-radius: var(--radius-md);
          padding: 28px;
          display: flex;
          gap: 24px;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border-light);
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .profile-avatar-big {
          width: 112px; height: 112px; border-radius: 50%;
          background: var(--bg-light); overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-light);
          flex-shrink: 0;
        }
        .profile-avatar-big img { width: 100%; height: 100%; object-fit: cover; }
        .profile-header-info h1 { font-size: 26px; font-weight: 700; margin-bottom: 6px; }
        .profile-role { font-size: 13px; color: var(--text-medium); margin-bottom: 12px; }
        .profile-quick-stats { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 8px; }
        .quick-stat { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text-medium); }
        .quick-stat strong { color: var(--text-dark); font-weight: 700; }
        .profile-section { background: white; border-radius: var(--radius-md); padding: 24px; box-shadow: var(--shadow-sm); margin-bottom: 24px; border: 1px solid var(--border-light); }
        .profile-listings { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .profile-listing-card {
          display: block; background: white; border: 1px solid var(--border-light);
          border-radius: var(--radius-md); overflow: hidden; transition: var(--transition);
        }
        .profile-listing-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .profile-listing-img { height: 140px; overflow: hidden; }
        .profile-listing-img img { width: 100%; height: 100%; object-fit: cover; }
        .profile-listing-placeholder { width: 100%; height: 100%; background: var(--bg-light); display: flex; align-items: center; justify-content: center; color: var(--text-light); }
        .profile-listing-info { padding: 12px; }
        .profile-listing-info h4 { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
        .profile-listing-info p { font-size: 12px; color: var(--text-medium); }
        .profile-listing-stats { display: flex; align-items: center; gap: 4px; margin-top: 6px; color: var(--text-dark); }
        .review-list { display: flex; flex-direction: column; gap: 14px; }
        .review-item { padding: 14px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); }
        .review-user { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .review-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
        .review-date { font-size: 12px; color: var(--text-medium); }
        .review-comment { font-size: 14px; color: var(--text-dark); margin-top: 6px; line-height: 1.5; }
      `}</style>
    </div>
  );
};

export default PublicProfilePage;
