import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FiArrowLeft, FiTrash2, FiHome, FiStar } from 'react-icons/fi';

const WishlistDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ wishlist: null, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/wishlists/${id}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Wishlist not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const remove = async (itemId) => {
    if (!window.confirm('Remove this property from the wishlist?')) return;
    try {
      await api.delete(`/wishlists/${id}/items/${itemId}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  if (loading) return <div className="page" style={{ paddingTop: 'var(--navbar-height)' }}><div className="spinner" /></div>;
  if (error) return (
    <div className="page" style={{ paddingTop: 'var(--navbar-height)' }}>
      <div className="page-content"><div className="alert alert-error">{error}</div></div>
    </div>
  );

  return (
    <div className="page wl-detail">
      <div className="page-content">
        <button onClick={() => navigate('/wishlists')} className="back-link">
          <FiArrowLeft /> Back to wishlists
        </button>
        <h1 className="section-title">{data.wishlist?.name}</h1>
        <p className="wl-meta">
          {data.items.length} saved {data.items.length === 1 ? 'property' : 'properties'}
        </p>

        {data.items.length === 0 ? (
          <div className="wl-empty-state">
            <FiHome size={36} />
            <h3>This wishlist is empty</h3>
            <p>Browse properties and click <strong>Save</strong> to add to this list.</p>
            <Link to="/" className="btn btn-primary">Browse properties</Link>
          </div>
        ) : (
          <div className="wl-items">
            {data.items.map(item => (
              <div key={item.item_id} className="wl-item">
                <Link to={`/properties/${item.id}`} className="wl-item-image">
                  {item.primary_photo
                    ? <img src={item.primary_photo} alt={item.title} />
                    : <div className="wl-item-no-image"><FiHome size={28} /></div>}
                </Link>
                <div className="wl-item-body">
                  <Link to={`/properties/${item.id}`} className="wl-item-title">{item.title}</Link>
                  <div className="wl-item-meta">
                    {item.city}, {item.country}
                  </div>
                  <div className="wl-item-meta">
                    {item.avg_rating ? (
                      <><FiStar size={12} fill="#FF5A5F" color="#FF5A5F" /> {parseFloat(item.avg_rating).toFixed(1)} ({item.review_count})</>
                    ) : 'No reviews yet'}
                  </div>
                  <div className="wl-item-price">${parseFloat(item.price_per_night).toFixed(0)} / night</div>
                </div>
                <button onClick={() => remove(item.item_id)} className="icon-btn icon-btn-danger" title="Remove">
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        .wl-detail { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .wl-detail .page-content { max-width: 1000px; margin: 0 auto; padding: 32px 24px; }
        .back-link {
          display: inline-flex; align-items: center; gap: 6px; color: var(--text-medium);
          background: none; border: none; cursor: pointer; padding: 0; margin-bottom: 12px;
          font-size: 14px;
        }
        .wl-meta { color: var(--text-medium); margin-bottom: 24px; }
        .wl-items { display: flex; flex-direction: column; gap: 14px; }
        .wl-item {
          display: grid; grid-template-columns: 200px 1fr auto; gap: 16px;
          background: white; padding: 14px; border-radius: var(--radius-md);
          border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);
          align-items: center;
        }
        .wl-item-image { display: block; height: 140px; border-radius: var(--radius-sm); overflow: hidden; }
        .wl-item-image img { width: 100%; height: 100%; object-fit: cover; }
        .wl-item-no-image {
          width: 100%; height: 100%; background: var(--bg-light);
          display: flex; align-items: center; justify-content: center; color: var(--text-light);
        }
        .wl-item-title { font-size: 16px; font-weight: 700; color: var(--text-dark); text-decoration: none; }
        .wl-item-title:hover { color: var(--primary); }
        .wl-item-meta { font-size: 13px; color: var(--text-medium); margin-top: 4px; display: flex; align-items: center; gap: 4px; }
        .wl-item-price { margin-top: 8px; font-weight: 700; color: var(--text-dark); }
        .icon-btn {
          background: none; border: 1px solid var(--border-light);
          width: 30px; height: 30px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center; cursor: pointer;
          color: var(--text-medium); transition: var(--transition);
        }
        .icon-btn-danger:hover { background: var(--primary); border-color: var(--primary); color: white; }
        .wl-empty-state {
          text-align: center; padding: 48px 24px; color: var(--text-medium);
          background: white; border-radius: var(--radius-md); border: 1px solid var(--border-light);
        }
        .wl-empty-state h3 { font-size: 18px; margin: 12px 0 6px; color: var(--text-dark); }
        @media (max-width: 720px) {
          .wl-item { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default WishlistDetailPage;
