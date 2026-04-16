import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Link } from 'react-router-dom';
import { FiMapPin } from 'react-icons/fi';

const MAP_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const mapContainerStyle = { width: '100%', height: '100%' };

const defaultOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

const MapView = ({ properties = [], center, zoom = 12, singleProperty = false }) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [mapRef, setMapRef] = useState(null);

  const validProperties = properties.filter(
    (p) => p.latitude && p.longitude && !isNaN(p.latitude) && !isNaN(p.longitude)
  );

  const mapCenter = center || (validProperties.length > 0
    ? { lat: parseFloat(validProperties[0].latitude), lng: parseFloat(validProperties[0].longitude) }
    : { lat: 40.7128, lng: -74.0060 });

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: MAP_API_KEY,
  });

  const onLoad = useCallback((map) => {
    setMapRef(map);
    if (validProperties.length > 1 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      validProperties.forEach((p) => {
        bounds.extend({ lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) });
      });
      map.fitBounds(bounds, { padding: 60 });
    }
  }, [validProperties]);

  if (!MAP_API_KEY) {
    return (
      <div className="map-fallback">
        <FiMapPin size={32} />
        <p>Map view requires a Google Maps API key.</p>
        <p className="map-fallback-sub">Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in your <code>client/.env</code> file.</p>
        {singleProperty && validProperties[0] && (
          <p style={{ marginTop: 8 }}>
            Location: {validProperties[0].city}, {validProperties[0].country}
          </p>
        )}
        <style>{`
          .map-fallback {
            width: 100%;
            height: 100%;
            min-height: 300px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: var(--bg-light);
            color: var(--text-medium);
            border-radius: var(--radius-md);
            text-align: center;
            padding: 24px;
            gap: 8px;
          }
          .map-fallback-sub { font-size: 13px; }
          .map-fallback code {
            background: var(--border-light);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
          }
        `}</style>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-medium)' }}>
        Failed to load map.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={zoom}
      onLoad={onLoad}
      options={defaultOptions}
    >
      {validProperties.map((property) => (
        <Marker
          key={property.id}
          position={{ lat: parseFloat(property.latitude), lng: parseFloat(property.longitude) }}
          onClick={() => setSelectedProperty(property)}
          label={{
            text: `$${Math.round(property.price_per_night)}`,
            color: selectedProperty?.id === property.id ? 'white' : '#484848',
            fontWeight: 'bold',
            fontSize: '12px',
          }}
          icon={{
            url: 'data:image/svg+xml,' + encodeURIComponent(`
              <svg width="60" height="30" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="30" rx="15" fill="${selectedProperty?.id === property.id ? '#FF5A5F' : 'white'}" stroke="${selectedProperty?.id === property.id ? '#FF5A5F' : '#484848'}" stroke-width="1.5"/>
              </svg>
            `),
            scaledSize: { width: 60, height: 30 },
            anchor: { x: 30, y: 15 },
          }}
        />
      ))}

      {selectedProperty && (
        <InfoWindow
          position={{
            lat: parseFloat(selectedProperty.latitude),
            lng: parseFloat(selectedProperty.longitude),
          }}
          onCloseClick={() => setSelectedProperty(null)}
        >
          <div style={{ maxWidth: 200, padding: 4 }}>
            {selectedProperty.primary_photo && (
              <img
                src={selectedProperty.primary_photo}
                alt={selectedProperty.title}
                style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
              />
            )}
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#484848' }}>
              {selectedProperty.title}
            </h4>
            <p style={{ fontSize: 12, color: '#767676', marginBottom: 6 }}>
              {selectedProperty.city}
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
              ${parseFloat(selectedProperty.price_per_night).toFixed(0)}/night
            </p>
            <Link
              to={`/properties/${selectedProperty.id}`}
              style={{
                display: 'block',
                padding: '6px 12px',
                background: '#FF5A5F',
                color: 'white',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              View Details
            </Link>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default MapView;
