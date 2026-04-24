import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { FiMessageCircle, FiSend, FiHome } from 'react-icons/fi';

const InboxPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const messagesEndRef = useRef(null);

  const loadConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
    } catch {
      // silent
    } finally {
      setLoadingConvos(false);
    }
  };

  const loadConversation = async (id) => {
    setLoadingThread(true);
    try {
      const res = await api.get(`/messages/conversations/${id}`);
      setActiveConvo(res.data.conversation);
      setMessages(res.data.messages);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to load conversation');
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setActiveConvo(null);
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvo) return;
    setSending(true);
    try {
      const res = await api.post('/messages', {
        conversation_id: activeConvo.id,
        content: newMessage.trim(),
      });
      setMessages(prev => [...prev, { ...res.data.message, first_name: user.first_name, last_name: user.last_name, avatar_url: user.avatar_url }]);
      setNewMessage('');
      loadConversations();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const otherPartyName = (c) => {
    if (!user) return '';
    return user.id === c.guest_id
      ? `${c.host_first_name} ${c.host_last_name}`
      : `${c.guest_first_name} ${c.guest_last_name}`;
  };

  const otherPartyAvatar = (c) => user.id === c.guest_id ? c.host_avatar : c.guest_avatar;

  return (
    <div className="inbox-page page">
      <div className="inbox-grid">
        <aside className="convo-list">
          <div className="convo-list-header">
            <h2><FiMessageCircle /> Inbox</h2>
          </div>
          {loadingConvos ? (
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
          ) : conversations.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}>
              <p style={{ fontSize: 14 }}>No conversations yet.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Ask a host a question from any listing.</p>
            </div>
          ) : (
            conversations.map(c => (
              <button
                key={c.id}
                onClick={() => navigate(`/inbox/${c.id}`)}
                className={`convo-item ${activeConvo?.id === c.id ? 'active' : ''}`}
              >
                <div className="convo-avatar">
                  {otherPartyAvatar(c) ? <img src={otherPartyAvatar(c)} alt="" /> : otherPartyName(c)[0]}
                </div>
                <div className="convo-info">
                  <div className="convo-top">
                    <strong>{otherPartyName(c)}</strong>
                    {c.unread_count > 0 && <span className="convo-unread">{c.unread_count}</span>}
                  </div>
                  {c.property_title && <p className="convo-property">{c.property_title}</p>}
                  {c.last_message && <p className="convo-preview">{c.last_message}</p>}
                </div>
              </button>
            ))
          )}
        </aside>

        <main className="convo-thread">
          {!activeConvo ? (
            <div className="convo-empty">
              <FiMessageCircle size={48} />
              <h3>Select a conversation</h3>
              <p>Your messages with hosts and guests appear here.</p>
            </div>
          ) : (
            <>
              <header className="thread-header">
                <div>
                  <strong>{otherPartyName(activeConvo)}</strong>
                  {activeConvo.property_title && (
                    <Link to={`/properties/${activeConvo.property_id}`} className="thread-property-link">
                      <FiHome size={12} /> {activeConvo.property_title}
                    </Link>
                  )}
                </div>
              </header>
              <div className="thread-messages">
                {loadingThread ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
                ) : messages.length === 0 ? (
                  <div className="empty-state"><p>No messages yet. Say hi!</p></div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`thread-msg ${m.sender_id === user.id ? 'mine' : 'theirs'}`}>
                      <div className="thread-msg-bubble">
                        <p>{m.content}</p>
                        <span className="thread-msg-time">
                          {new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} className="thread-input">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="form-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={sending || !newMessage.trim()} className="btn btn-primary">
                  <FiSend size={14} /> Send
                </button>
              </form>
            </>
          )}
        </main>
      </div>

      <style>{`
        .inbox-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .inbox-grid {
          max-width: 1100px; margin: 0 auto; padding: 24px;
          display: grid; grid-template-columns: 320px 1fr; gap: 20px;
          min-height: calc(100vh - var(--navbar-height) - 48px);
        }
        .convo-list {
          background: white; border: 1px solid var(--border-light);
          border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm);
          display: flex; flex-direction: column;
        }
        .convo-list-header { padding: 16px; border-bottom: 1px solid var(--border-light); }
        .convo-list-header h2 { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .convo-item {
          width: 100%; background: none; border: none; border-bottom: 1px solid var(--border-light);
          padding: 12px 16px; display: flex; gap: 12px; cursor: pointer; text-align: left;
          transition: var(--transition); font-family: inherit;
        }
        .convo-item:hover { background: var(--bg-light); }
        .convo-item.active { background: var(--bg-light); border-left: 3px solid var(--primary); }
        .convo-avatar {
          width: 42px; height: 42px; border-radius: 50%; background: var(--bg-light);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; color: var(--text-medium); flex-shrink: 0; overflow: hidden;
        }
        .convo-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .convo-info { flex: 1; min-width: 0; }
        .convo-top { display: flex; justify-content: space-between; align-items: center; }
        .convo-unread {
          background: var(--primary); color: white; font-size: 11px;
          border-radius: 10px; padding: 2px 8px; font-weight: 700;
        }
        .convo-property { font-size: 12px; color: var(--text-medium); margin-top: 2px; }
        .convo-preview {
          font-size: 13px; color: var(--text-medium); margin-top: 4px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .convo-thread {
          background: white; border: 1px solid var(--border-light);
          border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
          display: flex; flex-direction: column; overflow: hidden; min-height: 400px;
        }
        .convo-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          flex: 1; color: var(--text-medium); padding: 40px;
        }
        .convo-empty h3 { font-size: 17px; margin-top: 16px; margin-bottom: 4px; color: var(--text-dark); }
        .thread-header {
          padding: 16px; border-bottom: 1px solid var(--border-light);
          display: flex; align-items: center; justify-content: space-between;
        }
        .thread-property-link {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 12px; color: var(--text-medium); margin-top: 4px;
        }
        .thread-messages {
          flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;
        }
        .thread-msg { display: flex; }
        .thread-msg.mine { justify-content: flex-end; }
        .thread-msg-bubble {
          max-width: 70%; padding: 10px 14px; border-radius: 14px;
          background: var(--bg-light); color: var(--text-dark);
          display: flex; flex-direction: column; gap: 4px;
        }
        .thread-msg.mine .thread-msg-bubble { background: var(--primary); color: white; }
        .thread-msg.mine .thread-msg-time { color: rgba(255,255,255,0.8); }
        .thread-msg-time { font-size: 10px; color: var(--text-medium); }
        .thread-input {
          padding: 12px 16px; border-top: 1px solid var(--border-light);
          display: flex; gap: 8px;
        }
        .thread-input .form-input { flex: 1; }
        @media (max-width: 768px) {
          .inbox-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default InboxPage;
