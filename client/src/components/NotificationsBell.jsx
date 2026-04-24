import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FiBell, FiCheck } from 'react-icons/fi';

const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  const handleClick = async (n) => {
    try {
      await api.patch(`/notifications/${n.id}/read`);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      setUnreadCount(c => Math.max(0, c - (n.is_read ? 0 : 1)));
    } catch {}
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const relativeTime = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  return (
    <div className="bell-wrap" ref={ref}>
      <button className="bell-btn" onClick={handleOpen} aria-label="Notifications">
        <FiBell size={18} />
        {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="bell-panel">
          <div className="bell-header">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="bell-mark-all">
                <FiCheck size={12} /> Mark all read
              </button>
            )}
          </div>
          {loading ? (
            <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
          ) : notifications.length === 0 ? (
            <div className="bell-empty">
              <p>No notifications yet</p>
            </div>
          ) : (
            <ul className="bell-list">
              {notifications.map(n => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={`bell-item ${!n.is_read ? 'unread' : ''}`}
                  >
                    <div className="bell-item-content">
                      <strong className="bell-title">{n.title}</strong>
                      {n.message && <p className="bell-msg">{n.message}</p>}
                      <span className="bell-time">{relativeTime(n.created_at)}</span>
                    </div>
                    {!n.is_read && <span className="bell-dot" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <style>{`
        .bell-wrap { position: relative; }
        .bell-btn {
          position: relative;
          width: 40px; height: 40px; border-radius: 50%;
          border: 1px solid transparent; background: transparent;
          display: flex; align-items: center; justify-content: center; color: var(--text-dark);
          cursor: pointer;
        }
        .bell-btn:hover { background: var(--bg-light); }
        .bell-badge {
          position: absolute; top: 4px; right: 4px;
          min-width: 18px; height: 18px; padding: 0 5px;
          background: var(--primary); color: white; border-radius: 9px;
          font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center;
        }
        .bell-panel {
          position: absolute; right: 0; top: calc(100% + 8px); width: 340px;
          background: white; border: 1px solid var(--border); border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg); z-index: 1100; overflow: hidden; animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px);} to { opacity: 1; transform: translateY(0);} }
        .bell-header { padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); }
        .bell-mark-all { background: none; border: none; color: var(--primary); font-size: 12px; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 4px; }
        .bell-empty { padding: 28px; text-align: center; color: var(--text-medium); font-size: 14px; }
        .bell-list { list-style: none; margin: 0; padding: 0; max-height: 360px; overflow-y: auto; }
        .bell-item {
          width: 100%; padding: 12px 14px; background: none; border: none; text-align: left;
          border-bottom: 1px solid var(--border-light); cursor: pointer; display: flex; justify-content: space-between; gap: 10px;
          font-family: inherit;
        }
        .bell-item:hover { background: var(--bg-light); }
        .bell-item.unread { background: rgba(255, 90, 95, 0.03); }
        .bell-item-content { flex: 1; min-width: 0; }
        .bell-title { font-size: 13px; color: var(--text-dark); display: block; margin-bottom: 2px; }
        .bell-msg { font-size: 12px; color: var(--text-medium); line-height: 1.4; }
        .bell-time { font-size: 11px; color: var(--text-light); margin-top: 4px; display: inline-block; }
        .bell-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); flex-shrink: 0; margin-top: 6px; }
      `}</style>
    </div>
  );
};

export default NotificationsBell;
