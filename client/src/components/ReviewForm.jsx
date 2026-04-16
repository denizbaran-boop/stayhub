import React, { useState } from 'react';
import api from '../api/axios';
import StarRating from './StarRating';

const ReviewForm = ({ bookingId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/reviews', {
        booking_id: bookingId,
        rating,
        comment: comment.trim() || undefined,
      });
      onReviewSubmitted(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <h4>Leave a Review</h4>

      <div className="review-rating-selector">
        <span>Your rating:</span>
        <div className="review-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`star-btn ${rating >= star ? 'active' : ''}`}
              aria-label={`${star} star`}
            >
              ★
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="rating-label">
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </span>
        )}
      </div>

      <textarea
        placeholder="Share your experience (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        className="form-textarea"
        maxLength={1000}
      />

      {error && <div className="alert alert-error">{error}</div>}

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="btn btn-primary"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>

      <style>{`
        .review-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          background: var(--bg-light);
        }
        .review-form h4 {
          font-size: 16px;
          font-weight: 700;
        }
        .review-rating-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
        }
        .review-stars {
          display: flex;
          gap: 4px;
        }
        .star-btn {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: var(--border);
          transition: color 0.1s;
          padding: 0;
          line-height: 1;
        }
        .star-btn.active, .star-btn:hover {
          color: #FF5A5F;
        }
        .rating-label {
          font-weight: 600;
          color: var(--text-dark);
          font-size: 13px;
        }
      `}</style>
    </form>
  );
};

export default ReviewForm;
