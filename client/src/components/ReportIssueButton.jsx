import React, { useState } from 'react';
import api from '../api/axios';
import { FiFlag } from 'react-icons/fi';

const REASONS = [
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'misrepresentation', label: 'Listing didn\'t match' },
  { value: 'no_show', label: 'No-show / lockout' },
  { value: 'property_damage', label: 'Property damage' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'payment_issue', label: 'Payment issue' },
  { value: 'other', label: 'Other' },
];

const ReportIssueButton = ({ bookingId, onReported }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('cleanliness');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (description.trim().length < 10) {
      setError('Please describe the issue (10+ characters).');
      return;
    }
    setSaving(true);
    try {
      await api.post('/disputes', {
        booking_id: bookingId,
        reason,
        description: description.trim(),
      });
      setSuccess(true);
      setDescription('');
      onReported && onReported();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to file report');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-secondary btn-sm" type="button">
        <FiFlag size={13} /> Report issue
      </button>
    );
  }

  return (
    <div className="report-form">
      <h4>Report an issue with this booking</h4>
      {success ? (
        <div className="alert alert-success">
          Thanks — our admin team has been notified. You can track status under <a href="/disputes">My Disputes</a>.
        </div>
      ) : (
        <form onSubmit={submit}>
          <select value={reason} onChange={e => setReason(e.target.value)} className="form-input">
            {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <textarea
            rows={3}
            placeholder="Describe what happened (10+ characters)..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="form-input"
            maxLength={2000}
          />
          {error && <div className="alert alert-error" style={{ fontSize: 12, padding: 6 }}>{error}</div>}
          <div className="report-actions">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? 'Submitting...' : 'Submit report'}
            </button>
          </div>
        </form>
      )}
      <style>{`
        .report-form {
          margin-top: 8px; padding: 14px; background: var(--bg-light);
          border-radius: var(--radius-sm); border: 1px solid var(--border-light);
        }
        .report-form h4 { font-size: 14px; margin-bottom: 10px; }
        .report-form select, .report-form textarea { margin-bottom: 8px; width: 100%; }
        .report-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-sm { padding: 6px 12px; font-size: 13px; }
      `}</style>
    </div>
  );
};

export default ReportIssueButton;
