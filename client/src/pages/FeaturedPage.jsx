import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import PropertyCard from '../components/PropertyCard';
import { FiStar } from 'react-icons/fi';

const FeaturedPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/properties/featured');
        setProperties(res.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="featured-page page">
      <div className="page-content">
        <div className="featured-hero">
          <h1>
            <FiStar size={26} fill="#FF5A5F" color="#FF5A5F" />
            Featured Stays
          </h1>
          <p>Hand-picked, high-rated properties loved by our community.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : properties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✨</div>
            <h3>No featured properties yet</h3>
            <p>Check back soon!</p>
          </div>
        ) : (
          <div className="properties-grid">
            {properties.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </div>

      <style>{`
        .featured-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .featured-hero {
          text-align: center; padding: 28px 0; margin-bottom: 16px;
        }
        .featured-hero h1 {
          font-size: 30px; font-weight: 700; display: inline-flex; align-items: center; gap: 10px;
        }
        .featured-hero p { color: var(--text-medium); margin-top: 6px; font-size: 15px; }
      `}</style>
    </div>
  );
};

export default FeaturedPage;
