import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { FiMessageCircle, FiCheckCircle } from 'react-icons/fi';

const InquiryForm = ({ propertyId, hostFirstName }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/messages/inquiry', {
        property_id: propertyId,
        content: content.trim(),
      });
      setSent(res.data.conversation_id);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inquiry-card">
      <h3><FiMessageCircle size={16} /> Ask {hostFirstName || 'the host'} a question</h3>
      {sent ? (
        <div className="inquiry-success">
          <FiCheckCircle size={18} />
          <span>Message sent! </span>
          <button onClick={() => navigate(`/inbox/${sent}`)} className="inquiry-link">
            Open conversation
          </button>
        </div>
      ) : (
        <form onSubmit={handleSend}>
          <textarea
            className="form-textarea"
            placeholder="Hi! I have a question about your listing..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="btn btn-secondary btn-full"
            style={{ marginTop: 10 }}
          >
            {loading ? 'Sending...' : 'Send inquiry'}
          </button>
        </form>
      )}

      <style>{`
        .inquiry-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          margin-top: 16px;
          box-shadow: var(--shadow-sm);
        }
        .inquiry-card h3 {
          font-size: 15px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .inquiry-success {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #28a745;
          font-size: 14px;
          padding: 10px 12px;
          background: #D1E7DD;
          border-radius: var(--radius-sm);
        }
        .inquiry-link {
          background: none;
          border: none;
          color: var(--primary);
          text-decoration: underline;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default InquiryForm;
