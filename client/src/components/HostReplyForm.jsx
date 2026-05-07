import React, { useState } from 'react';
import api from '../api/axios';
import { FiMessageSquare } from 'react-icons/fi';

const HostReplyForm = ({ reviewId, existingReply, onSaved }) => {
  const [open, setOpen] = useState(!!existingReply);
  const [text, setText] = useState(existingReply || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/review-replies', { review_id: reviewId, reply: text.trim() });
      onSaved && onSaved(text.trim());
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="reply-toggle">
        <FiMessageSquare size={13} /> Reply to this review
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="host-reply-form">
      <textarea
        rows={2}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write a public reply..."
        className="form-input"
        maxLength={2000}
      />
      {error && <div className="alert alert-error" style={{ fontSize: 12, padding: 6 }}>{error}</div>}
      <div className="reply-actions">
        <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving || text.trim().length < 3}>
          {saving ? 'Posting...' : existingReply ? 'Update reply' : 'Post reply'}
        </button>
      </div>
      <style>{`
        .reply-toggle {
          display: inline-flex; align-items: center; gap: 6px;
          background: none; border: none; color: var(--primary);
          font-weight: 600; font-size: 12px; cursor: pointer; padding: 4px 0;
        }
        .host-reply-form { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
        .reply-actions { display: flex; justify-content: flex-end; gap: 8px; }
        .btn-sm { padding: 6px 12px; font-size: 13px; }
      `}</style>
    </form>
  );
};

export default HostReplyForm;
