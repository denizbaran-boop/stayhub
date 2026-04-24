import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import api from '../api/axios';
import StarRating from '../components/StarRating';
import { FiRefreshCw, FiMapPin, FiHome } from 'react-icons/fi';

const MAP_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const containerStyle = { width: '100%', height: '100%' };

const MapSearchPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [searchOnMove, setSearchOnMove] = useState(true);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const mapRef = useRef(null);
  const debounceRef = useRef(null);
  const pendingBoundsRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: MAP_API_KEY,
  });

  const loadProperties = useCallback(async (bounds) => {
    setLoading(true);
    try {
      const params = {};
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        params.ne_lat = ne.lat();
        params.ne_lng = ne.lng();
        params.sw_lat = sw.lat();
        params.sw_lng = sw.lng();
      }
      const res = await api.get('/search', { params });
      setProperties(res.data.properties || []);
      setNeedsRefresh(false);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load (no bounds yet)
  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleBoundsChanged = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    if (!bounds) return;
    pendingBoundsRef.current = bounds;

    if (!searchOnMove) {
      setNeedsRefresh(true);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadProperties(bounds);
    }, 600);
  }, [loadProperties, searchOnMove]);

  const handleSearchHere = () => {
    if (pendingBoundsRef.current) {
      loadProperties(pendingBoundsRef.current);
    } else if (mapRef.current?.getBounds()) {
      loadProperties(mapRef.current.getBounds());
    }
  };

  if (!MAP_API_KEY) {
    return (
      <div className="map-page page page-content">
        <div className="alert alert-info">
          <strong>Map view requires a Google Maps API key.</strong>
          <p style={{ marginTop: 8 }}>Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>client/.env</code> and restart the dev server.</p>
        </div>
        <div className="properties-grid">
          {properties.map(p => <PropertyMiniCard key={p.id} p={p} />)}
        </div>
      </div>
    );
  }

  if (loadError) return <div className="page page-content"><div className="alert alert-error">Failed to load map.</div></div>;
  if (!isLoaded) return <div className="page" style={{ display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>;

  const validProps = properties.filter(p => p.latitude && p.longitude);
  const center = validProps[0]
    ? { lat: parseFloat(validProps[0].latitude), lng: parseFloat(validProps[0].longitude) }
    : { lat: 40, lng: -80 };

  return (
    <div className="map-page">
      <div className="map-sidebar">
        <div className="map-sidebar-header">
          <h2><FiMapPin size={16} /> {properties.length} stays in this area</h2>
          <label className="toggle-row">
            <input type="checkbox" checked={searchOnMove} onChange={(e) => setSearchOnMove(e.target.checked)} />
            <span>Search as map moves</span>
          </label>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : properties.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-state-icon">🗺️</div>
            <h3>No properties here</h3>
            <p>Try zooming out or moving the map.</p>
          </div>
        ) : (
          <div className="map-sidebar-list">
            {properties.map(p => (
              <Link to={`/properties/${p.id}`} key={p.id} className="map-list-card"
                onMouseEnter={() => setSelected(p)}
              >
                <div className="map-list-img">
                  {p.primary_photo ? <img src={p.primary_photo} alt={p.title} /> : <div className="map-list-placeholder"><FiHome /></div>}
                </div>
                <div className="map-list-info">
                  <h4>{p.title}</h4>
                  <p className="map-list-loc">{p.city}, {p.country}</p>
                  <div className="map-list-meta">
                    {parseFloat(p.avg_rating) > 0 && (
                      <span><StarRating rating={parseFloat(p.avg_rating)} size={11} /> {parseFloat(p.avg_rating).toFixed(1)}</span>
                    )}
                    <strong>${parseFloat(p.price_per_night).toFixed(0)}/night</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="map-main">
        {needsRefresh && (
          <button onClick={handleSearchHere} className="map-search-here-btn">
            <FiRefreshCw size={13} /> Search this area
          </button>
        )}
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={4}
          onLoad={(map) => { mapRef.current = map; }}
          onIdle={handleBoundsChanged}
          options={{ mapTypeControl: false, streetViewControl: false }}
        >
          {validProps.map(p => (
            <Marker
              key={p.id}
              position={{ lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) }}
              onClick={() => setSelected(p)}
              label={{
                text: `$${Math.round(p.price_per_night)}`,
                color: selected?.id === p.id ? 'white' : '#484848',
                fontWeight: 'bold',
                fontSize: '12px',
              }}
              icon={{
                url: 'data:image/svg+xml,' + encodeURIComponent(`
                  <svg width="60" height="30" xmlns="http://www.w3.org/2000/svg">
                    <rect width="60" height="30" rx="15" fill="${selected?.id === p.id ? '#FF5A5F' : 'white'}" stroke="${selected?.id === p.id ? '#FF5A5F' : '#484848'}" stroke-width="1.5"/>
                  </svg>
                `),
                scaledSize: { width: 60, height: 30 },
                anchor: { x: 30, y: 15 },
              }}
            />
          ))}
          {selected && (
            <InfoWindow
              position={{ lat: parseFloat(selected.latitude), lng: parseFloat(selected.longitude) }}
              onCloseClick={() => setSelected(null)}
            >
              <div style={{ maxWidth: 220 }}>
                {selected.primary_photo && (
                  <img src={selected.primary_photo} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }} />
                )}
                <h4 style={{ fontSize: 14, marginBottom: 2 }}>{selected.title}</h4>
                <p style={{ fontSize: 12, color: '#767676', marginBottom: 4 }}>{selected.city}</p>
                <p style={{ fontSize: 13, fontWeight: 700 }}>${parseFloat(selected.price_per_night).toFixed(0)}/night</p>
                {parseFloat(selected.avg_rating) > 0 && (
                  <p style={{ fontSize: 12, color: '#484848' }}>⭐ {parseFloat(selected.avg_rating).toFixed(1)}</p>
                )}
                <Link to={`/properties/${selected.id}`} style={{ display: 'inline-block', marginTop: 8, padding: '6px 12px', background: '#FF5A5F', color: 'white', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                  View Details
                </Link>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      <style>{`
        .map-page {
          padding-top: var(--navbar-height);
          height: 100vh; display: grid;
          grid-template-columns: 360px 1fr;
        }
        .map-sidebar {
          overflow-y: auto; background: white; border-right: 1px solid var(--border-light);
          display: flex; flex-direction: column;
        }
        .map-sidebar-header {
          padding: 16px; border-bottom: 1px solid var(--border-light); position: sticky; top: 0; background: white;
        }
        .map-sidebar-header h2 { font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .toggle-row { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-medium); margin-top: 8px; }
        .map-sidebar-list { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
        .map-list-card {
          display: grid; grid-template-columns: 100px 1fr; gap: 10px;
          border: 1px solid var(--border-light); border-radius: var(--radius-sm);
          overflow: hidden; transition: var(--transition);
        }
        .map-list-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
        .map-list-img { height: 100px; overflow: hidden; background: var(--bg-light); }
        .map-list-img img { width: 100%; height: 100%; object-fit: cover; }
        .map-list-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-light); }
        .map-list-info { padding: 6px 10px 6px 0; }
        .map-list-info h4 { font-size: 13px; font-weight: 700; margin-bottom: 2px; line-height: 1.3; }
        .map-list-loc { font-size: 11px; color: var(--text-medium); margin-bottom: 4px; }
        .map-list-meta { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-medium); }
        .map-main { position: relative; }
        .map-search-here-btn {
          position: absolute; top: 12px; left: 50%; transform: translateX(-50%); z-index: 10;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; background: white; border: 1px solid var(--border);
          border-radius: var(--radius-full); font-size: 13px; font-weight: 600;
          box-shadow: var(--shadow-md); cursor: pointer;
        }
        .map-search-here-btn:hover { background: var(--bg-light); }
        @media (max-width: 768px) {
          .map-page { grid-template-columns: 1fr; grid-template-rows: 300px 1fr; height: calc(100vh - var(--navbar-height)); }
          .map-main { order: -1; }
        }
      `}</style>
    </div>
  );
};

const PropertyMiniCard = ({ p }) => (
  <Link to={`/properties/${p.id}`} className="card" style={{ display: 'block', padding: 16 }}>
    <h4>{p.title}</h4>
    <p style={{ color: 'var(--text-medium)', fontSize: 13 }}>{p.city}, {p.country}</p>
    <p><strong>${parseFloat(p.price_per_night).toFixed(0)}/night</strong></p>
  </Link>
);

export default MapSearchPage;
