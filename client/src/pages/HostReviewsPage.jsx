import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import HostReplyForm from '../components/HostReplyForm';
import StarRating from '../components/StarRating';
import { FiMessageSquare } from 'react-icons/fi';

const HostReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews/host-inbound');
      setReviews(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visible = reviews.filter(r => {
    if (filter === 'unanswered') return !r.reply_text;
    if (filter === 'answered') return !!r.reply_text;
    return true;
  });

  return (
    <div className="page hr-page">
      <div className="page-content">
        <h1 className="section-title"><FiMessageSquare /> Reviews on My Listings</h1>
        <p className="page-desc">Reply publicly to guest reviews. Your replies appear under each review on the property page.</p>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="filter-bar">
          <button onClick={() => setFilter('all')} className={`chip ${filter === 'all' ? 'chip-active' : ''}`}>All ({reviews.length})</button>
          <button onClick={() => setFilter('unanswered')} className={`chip ${filter === 'unanswered' ? 'chip-active' : ''}`}>
            Unanswered ({reviews.filter(r => !r.reply_text).length})
          </button>
          <button onClick={() => setFilter('answered')} className={`chip ${filter === 'answered' ? 'chip-active' : ''}`}>
            Answered ({reviews.filter(r => r.reply_text).length})
          </button>
        </div>

        {loading ? <div className="spinner" /> : visible.length === 0 ? (
          <div className="empty-card">
            <h3>No reviews to show</h3>
          </div>
        ) : (
          <div className="hr-list">
            {visible.map(r => (
              <div key={r.id} className="hr-card">
                <div className="hr-head">
                  <Link to={`/properties/${r.property_id}`} className="hr-prop">{r.property_title}</Link>
                  <span className="hr-date">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="hr-user">
                  <img
                    src={r.avatar_url || `https://i.pravatar.cc/40?u=${r.guest_id}`}
                    alt={r.first_name}
                    className="hr-avatar"
                  />
                  <div>
                    <strong>{r.first_name} {r.last_name}</strong>
                    <StarRating rating={r.rating} size={13} />
                  </div>
                </div>
                {r.comment && <p className="hr-comment">{r.comment}</p>}
                {r.reply_text ? (
                  <div className="hr-reply">
                    <strong>Your response · {new Date(r.reply_created_at).toLocaleDateString()}</strong>
                    <p>{r.reply_text}</p>
                    <HostReplyForm
                      reviewId={r.id}
                      existingReply={r.reply_text}
                      onSaved={(t) => setReviews(rs => rs.map(x => x.id === r.id ? { ...x, reply_text: t, reply_created_at: new Date().toISOString() } : x))}
                    />
                  </div>
                ) : (
                  <HostReplyForm
                    reviewId={r.id}
                    onSaved={(t) => setReviews(rs => rs.map(x => x.id === r.id ? { ...x, reply_text: t, reply_created_at: new Date().toISOString() } : x))}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        .hr-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .hr-page .page-content { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
        .section-title { display: flex; align-items: center; gap: 10px; }
        .page-desc { color: var(--text-medium); margin-bottom: 18px; font-size: 14px; }
        .filter-bar { display: flex; gap: 8px; margin-bottom: 18px; }
        .chip { padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid var(--border); background: white; cursor: pointer; font-size: 13px; }
        .chip-active { background: var(--text-dark); color: white; border-color: var(--text-dark); }
        .hr-list { display: flex; flex-direction: column; gap: 14px; }
        .hr-card { background: white; padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); }
        .hr-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .hr-prop { font-weight: 700; font-size: 15px; color: var(--primary); text-decoration: none; }
        .hr-date { color: var(--text-medium); font-size: 13px; }
        .hr-user { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .hr-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
        .hr-comment { font-size: 14px; line-height: 1.6; color: var(--text-dark); white-space: pre-wrap; }
        .hr-reply {
          margin-top: 10px; padding: 10px 12px; border-left: 3px solid var(--primary);
          background: var(--bg-light); border-radius: var(--radius-sm); font-size: 14px;
        }
        .hr-reply p { margin-top: 4px; color: var(--text-medium); }
        .empty-card { background: white; padding: 32px; border-radius: var(--radius-md); border: 1px solid var(--border-light); text-align: center; }
      `}</style>
    </div>
  );
};

export default HostReviewsPage;
