import React, { useState } from 'react';
import api from '../api/axios';
import { FiStar } from 'react-icons/fi';

const HostReviewForm = ({ bookingId, onSubmitted, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Please select a rating');
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/host-reviews', { booking_id: bookingId, rating, comment: comment || null });
      onSubmitted?.(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="host-review-form">
      <p className="hr-title">How was your guest?</p>
      <div className="hr-stars">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="hr-star-btn"
            aria-label={`${n} star${n !== 1 ? 's' : ''}`}
          >
            <FiStar size={22} fill={(hover || rating) >= n ? '#FF5A5F' : 'none'} color={(hover || rating) >= n ? '#FF5A5F' : '#B0B0B0'} />
          </button>
        ))}
      </div>
      <textarea
        className="form-textarea"
        placeholder="Optional: share feedback about this guest..."
        rows={3}
        value={comment}
        onChange={e => setComment(e.target.value)}
      />
      {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
          {loading ? 'Submitting...' : 'Submit review'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary btn-sm">Cancel</button>
        )}
      </div>
      <style>{`
        .host-review-form {
          background: var(--bg-light); padding: 14px; border-radius: var(--radius-sm);
          margin-top: 10px;
        }
        .hr-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
        .hr-stars { display: flex; gap: 4px; margin-bottom: 10px; }
        .hr-star-btn { background: none; border: none; padding: 2px; cursor: pointer; }
      `}</style>
    </form>
  );
};

export default HostReviewForm;
