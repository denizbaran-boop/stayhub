import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FiHeart, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi';

const WishlistsPage = () => {
  const [lists, setLists] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wishlists');
      setLists(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post('/wishlists', { name: name.trim() });
      setName('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this wishlist?')) return;
    try {
      await api.delete(`/wishlists/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const saveRename = async (id) => {
    if (!editValue.trim()) return;
    try {
      await api.put(`/wishlists/${id}`, { name: editValue.trim() });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="page wl-page">
      <div className="page-content">
        <div className="page-header">
          <h1 className="section-title"><FiHeart /> My Wishlists</h1>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={create} className="wl-new-form">
          <input
            type="text"
            placeholder="Create a new wishlist (e.g. Summer escapes)"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            className="form-input"
          />
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>Create</button>
        </form>

        {loading ? (
          <div className="spinner" />
        ) : lists.length === 0 ? (
          <div className="wl-empty-state">
            <FiHeart size={36} />
            <h3>No wishlists yet</h3>
            <p>Save properties from the listings page to organize them here.</p>
          </div>
        ) : (
          <div className="wl-grid">
            {lists.map(list => (
              <div key={list.id} className="wl-card">
                <div className="wl-card-head">
                  {editing === list.id ? (
                    <div className="wl-rename">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="form-input"
                        maxLength={100}
                      />
                      <button onClick={() => saveRename(list.id)} className="icon-btn" title="Save">
                        <FiCheck size={16} />
                      </button>
                      <button onClick={() => setEditing(null)} className="icon-btn" title="Cancel">
                        <FiX size={16} />
                      </button>
                    </div>
                  ) : (
                    <Link to={`/wishlists/${list.id}`} className="wl-card-title">
                      {list.name}
                    </Link>
                  )}
                  <div className="wl-card-actions">
                    <button
                      onClick={() => { setEditing(list.id); setEditValue(list.name); }}
                      className="icon-btn"
                      title="Rename"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button onClick={() => remove(list.id)} className="icon-btn icon-btn-danger" title="Delete">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="wl-card-meta">
                  {list.item_count} {list.item_count === 1 ? 'property' : 'properties'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        .wl-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .wl-page .page-content { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
        .wl-page .section-title { display: flex; align-items: center; gap: 10px; }
        .wl-new-form { display: flex; gap: 12px; margin: 16px 0 32px; }
        .wl-new-form .form-input { flex: 1; }
        .wl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 16px; }
        .wl-card {
          background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md);
          padding: 18px; box-shadow: var(--shadow-sm);
        }
        .wl-card-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .wl-card-title { font-weight: 700; font-size: 16px; color: var(--text-dark); text-decoration: none; }
        .wl-card-title:hover { color: var(--primary); }
        .wl-card-actions { display: flex; gap: 4px; }
        .wl-card-meta { color: var(--text-medium); font-size: 13px; margin-top: 6px; }
        .wl-rename { display: flex; gap: 4px; align-items: center; flex: 1; }
        .icon-btn {
          background: none; border: 1px solid var(--border-light);
          width: 30px; height: 30px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center; cursor: pointer;
          color: var(--text-medium); transition: var(--transition);
        }
        .icon-btn:hover { background: var(--bg-light); color: var(--text-dark); }
        .icon-btn-danger:hover { background: var(--primary); border-color: var(--primary); color: white; }
        .wl-empty-state {
          text-align: center; padding: 48px 24px; color: var(--text-medium);
          background: white; border-radius: var(--radius-md); border: 1px solid var(--border-light);
        }
        .wl-empty-state h3 { font-size: 18px; margin: 12px 0 6px; color: var(--text-dark); }
      `}</style>
    </div>
  );
};

export default WishlistsPage;
