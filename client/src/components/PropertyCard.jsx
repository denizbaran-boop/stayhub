import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiMapPin } from 'react-icons/fi';
import StarRating from './StarRating';

const PropertyCard = ({ property }) => {
  const [imgError, setImgError] = useState(false);
  const [saved, setSaved] = useState(false);

  const photo = property.primary_photo ||
    (property.photos && property.photos[0]?.url) ||
    null;

  const rating = parseFloat(property.avg_rating) || 0;
  const reviewCount = parseInt(property.review_count) || 0;

  return (
    <div className="property-card">
      <Link to={`/properties/${property.id}`} className="property-card-link">
        <div className="property-card-image-wrapper">
          {photo && !imgError ? (
            <img
              src={photo}
              alt={property.title}
              className="property-card-image"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="property-card-image-placeholder">
              <FiMapPin size={32} />
            </div>
          )}
          <button
            className={`property-card-save ${saved ? 'saved' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setSaved(!saved);
            }}
            aria-label={saved ? 'Unsave' : 'Save'}
          >
            <FiHeart size={18} />
          </button>
          <div className="property-card-type">{property.property_type}</div>
        </div>

        <div className="property-card-body">
          <div className="property-card-header">
            <h3 className="property-card-title">{property.title}</h3>
            {rating > 0 && (
              <div className="property-card-rating">
                <StarRating rating={rating} size={12} />
                <span>{rating.toFixed(1)}</span>
                {reviewCount > 0 && <span className="property-card-reviews">({reviewCount})</span>}
              </div>
            )}
          </div>

          <div className="property-card-location">
            <FiMapPin size={12} />
            <span>{property.city}, {property.country}</span>
          </div>

          <div className="property-card-meta">
            <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
            <span className="dot">·</span>
            <span>Up to {property.max_guests} guests</span>
          </div>

          <div className="property-card-price">
            <span className="property-card-price-value">${parseFloat(property.price_per_night).toFixed(0)}</span>
            <span className="property-card-price-night"> / night</span>
          </div>
        </div>
      </Link>

      <style>{`
        .property-card {
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: var(--transition);
          background: white;
        }
        .property-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-hover);
        }
        .property-card-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        .property-card-image-wrapper {
          position: relative;
          aspect-ratio: 4/3;
          overflow: hidden;
          border-radius: var(--radius-md);
          background: var(--bg-light);
        }
        .property-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .property-card:hover .property-card-image {
          transform: scale(1.05);
        }
        .property-card-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-light);
          background: var(--bg-light);
        }
        .property-card-save {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255,255,255,0.9);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-dark);
          transition: var(--transition);
          backdrop-filter: blur(4px);
        }
        .property-card-save:hover, .property-card-save.saved {
          color: var(--primary);
          background: white;
        }
        .property-card-save.saved svg {
          fill: var(--primary);
        }
        .property-card-type {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(255,255,255,0.9);
          padding: 3px 10px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
          backdrop-filter: blur(4px);
        }
        .property-card-body {
          padding: 12px 4px 4px;
        }
        .property-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 4px;
        }
        .property-card-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-dark);
          flex: 1;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .property-card-rating {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }
        .property-card-reviews {
          font-weight: 400;
          color: var(--text-medium);
        }
        .property-card-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: var(--text-medium);
          margin-bottom: 4px;
        }
        .property-card-meta {
          font-size: 13px;
          color: var(--text-medium);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }
        .dot { font-size: 8px; }
        .property-card-price {
          font-size: 15px;
        }
        .property-card-price-value {
          font-weight: 700;
          color: var(--text-dark);
        }
        .property-card-price-night {
          color: var(--text-medium);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
};

export default PropertyCard;
