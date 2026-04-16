import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';
import MapView from '../components/MapView';
import { FiFilter, FiMap, FiGrid, FiSliders } from 'react-icons/fi';

const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'cabin', 'studio', 'loft', 'other'];
const AMENITY_OPTIONS = ['WiFi', 'Kitchen', 'Parking', 'Pool', 'Air conditioning', 'Hot tub', 'Washer', 'Gym', 'Fireplace', 'BBQ grill'];

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    property_type: searchParams.get('property_type') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    amenities: searchParams.get('amenities') || '',
    sort: searchParams.get('sort') || 'relevance',
  });

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchParams.get('location')) params.location = searchParams.get('location');
      if (searchParams.get('check_in')) params.check_in = searchParams.get('check_in');
      if (searchParams.get('check_out')) params.check_out = searchParams.get('check_out');
      if (searchParams.get('guests')) params.guests = searchParams.get('guests');
      if (filters.min_price) params.min_price = filters.min_price;
      if (filters.max_price) params.max_price = filters.max_price;
      if (filters.property_type) params.property_type = filters.property_type;
      if (filters.bedrooms) params.bedrooms = filters.bedrooms;
      if (filters.amenities) params.amenities = filters.amenities;
      if (filters.sort) params.sort = filters.sort;

      const res = await api.get('/search', { params });
      setProperties(res.data.properties || []);
      setTotal(res.data.total || 0);
    } catch {
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [searchParams, filters.sort]);

  const applyFilters = () => {
    fetchResults();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ min_price: '', max_price: '', property_type: '', bedrooms: '', amenities: '', sort: 'relevance' });
  };

  const toggleAmenity = (amenity) => {
    const current = filters.amenities ? filters.amenities.split(',') : [];
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    setFilters({ ...filters, amenities: updated.join(',') });
  };

  const locationLabel = searchParams.get('location') || 'All locations';
  const datesLabel = searchParams.get('check_in') && searchParams.get('check_out')
    ? `${searchParams.get('check_in')} – ${searchParams.get('check_out')}`
    : null;

  return (
    <div className="search-results-page">
      {/* Search bar */}
      <div className="search-results-bar">
        <SearchBar
          initialValues={{
            location: searchParams.get('location') || '',
            check_in: searchParams.get('check_in') || '',
            check_out: searchParams.get('check_out') || '',
            guests: searchParams.get('guests') || 1,
          }}
          compact
        />
      </div>

      {/* Controls */}
      <div className="search-controls">
        <div className="search-controls-left">
          <p className="search-result-count">
            {loading ? 'Searching...' : `${total} stay${total !== 1 ? 's' : ''} found`}
            {locationLabel !== 'All locations' && ` in ${locationLabel}`}
          </p>
          {datesLabel && <span className="search-dates-label">{datesLabel}</span>}
        </div>
        <div className="search-controls-right">
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="sort-select"
          >
            <option value="relevance">Most relevant</option>
            <option value="price_asc">Price: Low to high</option>
            <option value="price_desc">Price: High to low</option>
            <option value="rating">Highest rated</option>
          </select>
          <button
            className={`control-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiSliders size={15} /> Filters
          </button>
          <button
            className={`control-btn ${showMap ? 'active' : ''}`}
            onClick={() => setShowMap(!showMap)}
          >
            {showMap ? <><FiGrid size={15} /> Grid</> : <><FiMap size={15} /> Map</>}
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-header">
            <h3>Filters</h3>
            <button onClick={clearFilters} className="clear-filters">Clear all</button>
          </div>
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Property type</label>
              <div className="type-buttons">
                {PROPERTY_TYPES.map(type => (
                  <button
                    key={type}
                    className={`type-btn ${filters.property_type === type ? 'active' : ''}`}
                    onClick={() => setFilters({ ...filters, property_type: filters.property_type === type ? '' : type })}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label className="filter-label">Price range (per night)</label>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min $"
                  value={filters.min_price}
                  onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                  className="form-input"
                  min={0}
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Max $"
                  value={filters.max_price}
                  onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                  className="form-input"
                  min={0}
                />
              </div>
            </div>
            <div className="filter-group">
              <label className="filter-label">Bedrooms</label>
              <div className="bedroom-buttons">
                {['Any', '1', '2', '3', '4+'].map(n => (
                  <button
                    key={n}
                    className={`type-btn ${(n === 'Any' ? '' : n.replace('+', '')) === filters.bedrooms ? 'active' : ''}`}
                    onClick={() => setFilters({ ...filters, bedrooms: n === 'Any' ? '' : n.replace('+', '') })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group filter-amenities">
              <label className="filter-label">Amenities</label>
              <div className="amenity-checkboxes">
                {AMENITY_OPTIONS.map(amenity => {
                  const selected = filters.amenities.split(',').includes(amenity);
                  return (
                    <label key={amenity} className={`amenity-checkbox ${selected ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleAmenity(amenity)}
                        style={{ display: 'none' }}
                      />
                      {amenity}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="filters-footer">
            <button onClick={applyFilters} className="btn btn-primary">
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className={`search-results-layout ${showMap ? 'with-map' : ''}`}>
        <div className="search-results-grid">
          {loading ? (
            <div className="loading-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-image" />
                  <div className="skeleton-text" />
                  <div className="skeleton-text short" />
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No properties found</h3>
              <p>Try adjusting your search or filters to find available stays.</p>
              <button onClick={clearFilters} className="btn btn-primary">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="properties-grid">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>

        {showMap && (
          <div className="search-map">
            <MapView properties={properties} />
          </div>
        )}
      </div>

      <style>{`
        .search-results-page {
          padding-top: var(--navbar-height);
          min-height: 100vh;
        }
        .search-results-bar {
          background: white;
          border-bottom: 1px solid var(--border-light);
          padding: 16px 24px;
          display: flex;
          justify-content: center;
        }
        .search-controls {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .search-controls-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .search-result-count {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-dark);
        }
        .search-dates-label {
          font-size: 13px;
          color: var(--text-medium);
          background: var(--bg-light);
          padding: 4px 10px;
          border-radius: var(--radius-full);
        }
        .search-controls-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sort-select {
          padding: 8px 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          font-size: 13px;
          background: white;
          cursor: pointer;
          font-family: inherit;
        }
        .control-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          background: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          font-family: inherit;
        }
        .control-btn:hover, .control-btn.active {
          background: var(--text-dark);
          color: white;
          border-color: var(--text-dark);
        }
        .filters-panel {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 24px;
          border-top: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          background: white;
        }
        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .filters-header h3 { font-size: 18px; font-weight: 700; }
        .clear-filters {
          background: none;
          border: none;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-dark);
          cursor: pointer;
          text-decoration: underline;
        }
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 24px;
        }
        .filter-group { display: flex; flex-direction: column; gap: 10px; }
        .filter-label { font-size: 14px; font-weight: 700; }
        .type-buttons, .bedroom-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .type-btn {
          padding: 6px 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          background: white;
          font-size: 13px;
          cursor: pointer;
          transition: var(--transition);
          text-transform: capitalize;
          font-family: inherit;
        }
        .type-btn:hover, .type-btn.active {
          border-color: var(--text-dark);
          background: var(--text-dark);
          color: white;
        }
        .price-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .price-inputs .form-input { max-width: 100px; }
        .filter-amenities { grid-column: 1 / -1; }
        .amenity-checkboxes {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .amenity-checkbox {
          padding: 6px 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          font-size: 13px;
          cursor: pointer;
          transition: var(--transition);
        }
        .amenity-checkbox.checked {
          background: var(--text-dark);
          color: white;
          border-color: var(--text-dark);
        }
        .filters-footer {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
        }
        .search-results-layout {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        .search-results-layout.with-map {
          display: grid;
          grid-template-columns: 1fr 480px;
          gap: 24px;
          max-width: 100%;
          padding: 24px;
        }
        .search-map {
          position: sticky;
          top: calc(var(--navbar-height) + 20px);
          height: calc(100vh - var(--navbar-height) - 40px);
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--border-light);
        }
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .skeleton-card { display: flex; flex-direction: column; gap: 10px; }
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
        @media (max-width: 768px) {
          .search-results-layout.with-map {
            grid-template-columns: 1fr;
          }
          .search-map { height: 300px; position: static; }
        }
      `}</style>
    </div>
  );
};

export default SearchResultsPage;
