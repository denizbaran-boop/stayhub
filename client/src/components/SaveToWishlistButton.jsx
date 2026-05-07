import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { FiHeart } from 'react-icons/fi';

const SaveToWishlistButton = ({ propertyId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const popRef = useRef(null);

  const isAnySaved = lists.some(l => l.saved);

  const refresh = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/wishlists/property/${propertyId}`);
      setLists(res.data);
    } catch {
      setLists([]);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [propertyId, user?.id]);

  useEffect(() => {
    const onClick = (e) => { if (popRef.current && !popRef.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const togglePopover = () => {
    if (!user) return navigate('/login');
    setOpen(o => !o);
  };

  const toggleList = async (list) => {
    setLoading(true);
    setError('');
    try {
      if (list.saved) {
        // Need item id; fetch detail
        const detail = await api.get(`/wishlists/${list.id}`);
        const item = detail.data.items.find(i => i.id === propertyId);
        if (item) await api.delete(`/wishlists/${list.id}/items/${item.item_id}`);
      } else {
        await api.post(`/wishlists/${list.id}/items`, { property_id: propertyId });
      }
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const createList = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/wishlists', { name: newName.trim() });
      await api.post(`/wishlists/${res.data.id}/items`, { property_id: propertyId });
      setNewName('');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wl-button-wrap" ref={popRef}>
      <button
        onClick={togglePopover}
        className="header-action-btn"
        type="button"
      >
        <FiHeart
          size={16}
          fill={isAnySaved ? '#FF5A5F' : 'none'}
          color={isAnySaved ? '#FF5A5F' : 'currentColor'}
        />
        {isAnySaved ? 'Saved' : 'Save'}
      </button>
      {open && (
        <div className="wl-popover">
          <div className="wl-popover-title">Save to wishlist</div>
          {error && <div className="alert alert-error" style={{ fontSize: 13 }}>{error}</div>}
          {lists.length === 0 ? (
            <div className="wl-empty">No wishlists yet — create one below.</div>
          ) : (
            <ul className="wl-list">
              {lists.map(l => (
                <li key={l.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={l.saved}
                      disabled={loading}
                      onChange={() => toggleList(l)}
                    />
                    <span>{l.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={createList} className="wl-create">
            <input
              type="text"
              placeholder="New wishlist name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              maxLength={100}
              className="form-input"
            />
            <button type="submit" disabled={loading || !newName.trim()} className="btn btn-primary btn-sm">
              Add
            </button>
          </form>
        </div>
      )}
      <style>{`
        .wl-button-wrap { position: relative; display: inline-block; }
        .wl-popover {
          position: absolute; right: 0; top: calc(100% + 8px); z-index: 1100;
          background: white; border: 1px solid var(--border); border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg); padding: 14px; min-width: 280px;
        }
        .wl-popover-title { font-weight: 700; margin-bottom: 8px; font-size: 14px; }
        .wl-list { list-style: none; padding: 0; margin: 0 0 10px; max-height: 200px; overflow-y: auto; }
        .wl-list li label {
          display: flex; align-items: center; gap: 8px; padding: 6px 0; cursor: pointer;
          font-size: 14px;
        }
        .wl-empty { font-size: 13px; color: var(--text-medium); margin-bottom: 8px; }
        .wl-create { display: flex; gap: 6px; }
        .wl-create .form-input { padding: 6px 10px; font-size: 13px; }
        .btn-sm { padding: 6px 12px; font-size: 13px; }
      `}</style>
    </div>
  );
};

export default SaveToWishlistButton;
