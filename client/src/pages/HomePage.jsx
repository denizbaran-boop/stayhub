import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';
import { FiHome, FiSun, FiMapPin, FiStar } from 'react-icons/fi';
import { FaUmbrellaBeach, FaMountain, FaCity } from 'react-icons/fa';

const CATEGORIES = [
  { label: 'All', value: '', icon: <FiHome size={20} /> },
  { label: 'Apartments', value: 'apartment', icon: <FaCity size={20} /> },
  { label: 'Houses', value: 'house', icon: <FiHome size={20} /> },
  { label: 'Villas', value: 'villa', icon: <FiSun size={20} /> },
  { label: 'Cabins', value: 'cabin', icon: <FaMountain size={20} /> },
  { label: 'Studios', value: 'studio', icon: <FiMapPin size={20} /> },
  { label: 'Beach', value: 'beach', icon: <FaUmbrellaBeach size={20} /> },
];

const HomePage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState('');

  const fetchProperties = async (type = '') => {
    setLoading(true);
    setError('');
    try {
      let url = '/properties/featured';
      if (type && type !== 'beach') {
        const res = await api.get('/search', { params: { property_type: type, limit: 12 } });
        setProperties(res.data.properties || []);
      } else if (type === 'beach') {
        const res = await api.get('/search', { params: { location: 'beach', limit: 12 } });
        setProperties(res.data.properties || []);
      } else {
        const res = await api.get('/properties/featured');
        setProperties(res.data || []);
      }
    } catch {
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">Find your perfect stay</h1>
          <p className="hero-subtitle">Discover unique homes, cabins, and apartments around the world</p>
          <SearchBar />
        </div>
      </div>

      {/* Category tabs */}
      <div className="categories-bar">
        <div className="categories-inner">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`category-btn ${selectedCategory === cat.value ? 'active' : ''}`}
            >
              <span className="category-icon">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Properties */}
      <div className="home-content">
        {loading ? (
          <div className="loading-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-image" />
                <div className="skeleton-text" />
                <div className="skeleton-text short" />
                <div className="skeleton-text short" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : properties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏠</div>
            <h3>No properties found</h3>
            <p>Try a different category or search for a specific location.</p>
          </div>
        ) : (
          <>
            <h2 className="section-title">
              {selectedCategory
                ? `${CATEGORIES.find(c => c.value === selectedCategory)?.label || 'Properties'}`
                : 'Featured stays'}
            </h2>
            <div className="properties-grid">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Features section */}
      <div className="features-section">
        <div className="features-inner">
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 40 }}>
            Why choose StayHub?
          </h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏡</div>
              <h3>Unique homes</h3>
              <p>From cozy studios to luxury villas, find the perfect space for any trip.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure booking</h3>
              <p>Your payment and personal information are always protected.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Verified reviews</h3>
              <p>Real reviews from real guests help you make the right choice.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Host support</h3>
              <p>Connect directly with hosts for a personalized experience.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .home-page {
          padding-top: var(--navbar-height);
        }
        .hero {
          position: relative;
          height: 560px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600') center/cover;
          opacity: 0.4;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%);
        }
        .hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          width: 100%;
          max-width: 900px;
        }
        .hero-title {
          font-size: 48px;
          font-weight: 800;
          color: white;
          text-shadow: 0 2px 8px rgba(0,0,0,0.3);
          line-height: 1.1;
        }
        .hero-subtitle {
          font-size: 18px;
          color: rgba(255,255,255,0.9);
          text-shadow: 0 1px 4px rgba(0,0,0,0.3);
          margin-bottom: 8px;
        }
        .categories-bar {
          border-bottom: 1px solid var(--border-light);
          background: white;
          position: sticky;
          top: var(--navbar-height);
          z-index: 100;
        }
        .categories-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          gap: 4px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .categories-inner::-webkit-scrollbar { display: none; }
        .category-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-medium);
          cursor: pointer;
          white-space: nowrap;
          transition: var(--transition);
          margin-bottom: -1px;
        }
        .category-btn:hover {
          color: var(--text-dark);
          border-bottom-color: var(--border);
        }
        .category-btn.active {
          color: var(--text-dark);
          border-bottom-color: var(--text-dark);
        }
        .category-icon {
          font-size: 20px;
          opacity: 0.7;
        }
        .category-btn.active .category-icon { opacity: 1; }
        .home-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px;
        }
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .skeleton-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .skeleton-image {
          width: 100%;
          aspect-ratio: 4/3;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: var(--radius-md);
        }
        .skeleton-text {
          height: 14px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }
        .skeleton-text.short { width: 60%; }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .features-section {
          background: var(--bg-light);
          padding: 60px 24px;
          margin-top: 40px;
        }
        .features-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 24px;
        }
        .feature-card {
          background: white;
          border-radius: var(--radius-md);
          padding: 28px 24px;
          text-align: center;
          box-shadow: var(--shadow-sm);
        }
        .feature-icon {
          font-size: 36px;
          margin-bottom: 14px;
        }
        .feature-card h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--text-dark);
        }
        .feature-card p {
          font-size: 14px;
          color: var(--text-medium);
          line-height: 1.6;
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 32px; }
          .hero { height: 480px; }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
