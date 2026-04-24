import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import BookingForm from '../components/BookingForm';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import ReviewForm from '../components/ReviewForm';
import MapView from '../components/MapView';
import StarRating from '../components/StarRating';
import InquiryForm from '../components/InquiryForm';
import {
  FiMapPin, FiUsers, FiBriefcase, FiHome, FiStar,
  FiChevronLeft, FiChevronRight, FiX, FiShare2, FiHeart
} from 'react-icons/fi';

const AMENITY_ICONS = {
  'WiFi': '📶', 'Kitchen': '🍳', 'Parking': '🚗', 'Pool': '🏊',
  'Air conditioning': '❄️', 'Washer': '🫧', 'Dryer': '♨️', 'TV': '📺',
  'Hot tub': '🛁', 'Gym': '💪', 'Fireplace': '🔥', 'BBQ grill': '🍖',
  'Elevator': '🛗', 'Workspace': '💻', 'Beach access': '🏖️',
  'Hiking trails': '🥾', 'Ski storage': '⛷️', 'Wine cellar': '🍷',
  'Garden': '🌿', 'Coffee maker': '☕', 'Doorman': '🚪',
};

const PropertyDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [propRes, reviewRes, blockedRes] = await Promise.all([
          api.get(`/properties/${id}`),
          api.get(`/reviews/property/${id}`),
          api.get(`/availability/${id}/blocked`),
        ]);
        setProperty(propRes.data);
        setReviews(reviewRes.data.reviews || []);
        setBlockedDates(blockedRes.data.blocked_dates || []);
      } catch {
        setError('Property not found');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  if (error || !property) return (
    <div className="page">
      <div className="page-content">
        <div className="alert alert-error">{error || 'Property not found'}</div>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    </div>
  );

  const photos = property.photos || [];
  const mainPhoto = photos[photoIndex]?.url || photos[0]?.url;
  const rating = parseFloat(property.avg_rating) || 0;
  const reviewCount = parseInt(property.review_count) || 0;

  const isOwner = user?.id === property.host_id;

  return (
    <div className="property-page">
      {/* Header */}
      <div className="property-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <FiChevronLeft size={20} /> Back
        </button>
        <div className="property-header-actions">
          <button className="header-action-btn"><FiShare2 size={16} /> Share</button>
          <button className="header-action-btn"><FiHeart size={16} /> Save</button>
        </div>
      </div>

      <div className="property-content">
        {/* Title */}
        <div className="property-title-section">
          <h1 className="property-title">{property.title}</h1>
          <div className="property-meta">
            {rating > 0 && (
              <span className="property-rating-inline">
                <FiStar size={14} fill="#FF5A5F" color="#FF5A5F" />
                {rating.toFixed(1)}
                <span className="meta-sep">·</span>
                <span className="review-link">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
                <span className="meta-sep">·</span>
              </span>
            )}
            <FiMapPin size={13} />
            <span>{property.address}, {property.city}, {property.country}</span>
          </div>
        </div>

        {/* Photo gallery */}
        <div className="photo-gallery" onClick={() => setGalleryOpen(true)}>
          <div className="photo-main">
            {mainPhoto ? (
              <img src={mainPhoto} alt={property.title} />
            ) : (
              <div className="photo-placeholder"><FiHome size={40} /></div>
            )}
          </div>
          {photos.length > 1 && (
            <div className="photo-grid">
              {photos.slice(1, 5).map((photo, i) => (
                <div key={i} className="photo-thumb" onClick={() => { setPhotoIndex(i + 1); setGalleryOpen(true); }}>
                  <img src={photo.url} alt={`Photo ${i + 2}`} />
                  {i === 3 && photos.length > 5 && (
                    <div className="photo-more">+{photos.length - 5}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          {photos.length > 1 && (
            <button className="show-photos-btn" onClick={(e) => { e.stopPropagation(); setGalleryOpen(true); }}>
              Show all photos
            </button>
          )}
        </div>

        {/* Main layout */}
        <div className="property-layout">
          <div className="property-info">
            {/* Host & details */}
            <div className="property-host-row">
              <div>
                <h2 className="property-info-title">
                  {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)} hosted by{' '}
                  <Link to={`/users/${property.host_id}`} style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                    {property.host_first_name}
                  </Link>
                </h2>
                <div className="property-quick-info">
                  <span><FiUsers size={14} /> {property.max_guests} guests</span>
                  <span className="meta-sep">·</span>
                  <span>{property.bedrooms} bedroom{property.bedrooms !== 1 ? 's' : ''}</span>
                  <span className="meta-sep">·</span>
                  <span>{property.bathrooms} bathroom{property.bathrooms !== 1 ? 's' : ''}</span>
                </div>
              </div>
              {property.host_avatar && (
                <Link to={`/users/${property.host_id}`}>
                  <img src={property.host_avatar} alt={property.host_first_name} className="host-avatar" />
                </Link>
              )}
            </div>

            <hr className="divider" />

            {/* Description */}
            {property.description && (
              <>
                <div className="property-description">
                  <h3>About this place</h3>
                  <p>{property.description}</p>
                </div>
                <hr className="divider" />
              </>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <>
                <div className="property-amenities">
                  <h3>What this place offers</h3>
                  <div className="amenities-grid">
                    {property.amenities.map((amenity) => (
                      <div key={amenity} className="amenity-item">
                        <span className="amenity-emoji">{AMENITY_ICONS[amenity] || '✓'}</span>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <hr className="divider" />
              </>
            )}

            {/* Map */}
            {property.latitude && property.longitude && (
              <>
                <div className="property-map-section">
                  <h3>Where you'll be</h3>
                  <p className="map-address">{property.city}, {property.country}</p>
                  <div className="property-map">
                    <MapView
                      properties={[property]}
                      center={{ lat: parseFloat(property.latitude), lng: parseFloat(property.longitude) }}
                      zoom={14}
                      singleProperty
                    />
                  </div>
                </div>
                <hr className="divider" />
              </>
            )}

            {/* Availability calendar */}
            <div className="property-calendar-section">
              <h3>Availability</h3>
              <AvailabilityCalendar propertyId={id} />
            </div>

            <hr className="divider" />

            {/* Reviews */}
            <div className="property-reviews">
              <div className="reviews-header">
                <h3>
                  {rating > 0 ? (
                    <><FiStar size={18} fill="#FF5A5F" color="#FF5A5F" /> {rating.toFixed(1)} · {reviewCount} review{reviewCount !== 1 ? 's' : ''}</>
                  ) : (
                    'No reviews yet'
                  )}
                </h3>
              </div>
              {reviews.length > 0 ? (
                <div className="reviews-grid">
                  {reviews.map((review) => (
                    <div key={review.id} className="review-item">
                      <div className="review-user">
                        <img
                          src={review.avatar_url || `https://i.pravatar.cc/40?u=${review.guest_id}`}
                          alt={review.first_name}
                          className="review-avatar"
                        />
                        <div>
                          <strong>{review.first_name} {review.last_name}</strong>
                          <p className="review-date">
                            {new Date(review.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size={13} />
                      {review.comment && <p className="review-comment">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-medium)', fontSize: 14 }}>
                  Be the first to review this property!
                </p>
              )}
            </div>
          </div>

          {/* Booking form sidebar */}
          <div className="booking-sidebar">
            {isOwner ? (
              <div className="owner-notice">
                <FiHome size={24} />
                <h3>This is your listing</h3>
                <Link to={`/edit-listing/${id}`} className="btn btn-primary btn-full">
                  Edit Listing
                </Link>
              </div>
            ) : (
              <>
                <BookingForm property={property} blockedDates={blockedDates} />
                <InquiryForm propertyId={id} hostFirstName={property.host_first_name} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Gallery modal */}
      {galleryOpen && (
        <div className="gallery-modal" onClick={() => setGalleryOpen(false)}>
          <button className="gallery-close" onClick={() => setGalleryOpen(false)}>
            <FiX size={24} />
          </button>
          <div className="gallery-nav">
            <button
              className="gallery-btn"
              onClick={(e) => { e.stopPropagation(); setPhotoIndex(Math.max(0, photoIndex - 1)); }}
              disabled={photoIndex === 0}
            >
              <FiChevronLeft size={24} />
            </button>
          </div>
          <div className="gallery-image" onClick={(e) => e.stopPropagation()}>
            <img src={photos[photoIndex]?.url} alt={`Photo ${photoIndex + 1}`} />
            <p className="gallery-caption">
              {photoIndex + 1} / {photos.length}
              {photos[photoIndex]?.caption && ` — ${photos[photoIndex].caption}`}
            </p>
          </div>
          <div className="gallery-nav">
            <button
              className="gallery-btn"
              onClick={(e) => { e.stopPropagation(); setPhotoIndex(Math.min(photos.length - 1, photoIndex + 1)); }}
              disabled={photoIndex === photos.length - 1}
            >
              <FiChevronRight size={24} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .property-page {
          padding-top: var(--navbar-height);
          min-height: 100vh;
        }
        .property-header {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-dark);
          cursor: pointer;
          text-decoration: underline;
        }
        .property-header-actions {
          display: flex;
          gap: 8px;
        }
        .header-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: none;
          border: none;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-dark);
          cursor: pointer;
          border-radius: var(--radius-full);
          text-decoration: underline;
          transition: var(--transition);
        }
        .header-action-btn:hover { background: var(--bg-light); }
        .property-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px 60px;
        }
        .property-title-section { margin-bottom: 16px; }
        .property-title {
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .property-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--text-medium);
          flex-wrap: wrap;
        }
        .property-rating-inline {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-dark);
          font-weight: 600;
        }
        .review-link { text-decoration: underline; cursor: pointer; }
        .meta-sep { color: var(--text-light); }

        /* Photo gallery */
        .photo-gallery {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          height: 480px;
          cursor: pointer;
          margin-bottom: 32px;
        }
        .photo-main {
          grid-row: 1 / 3;
          overflow: hidden;
        }
        .photo-main img, .photo-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        .photo-gallery:hover img { transform: scale(1.02); }
        .photo-placeholder {
          width: 100%;
          height: 100%;
          background: var(--bg-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-light);
        }
        .photo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 8px;
        }
        .photo-thumb {
          overflow: hidden;
          position: relative;
        }
        .photo-more {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          font-weight: 700;
        }
        .show-photos-btn {
          position: absolute;
          bottom: 16px;
          right: 16px;
          background: white;
          border: 1px solid var(--text-dark);
          border-radius: var(--radius-sm);
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }
        .show-photos-btn:hover { background: var(--bg-light); }

        /* Layout */
        .property-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 48px;
          align-items: start;
        }
        .property-host-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .property-info-title {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .property-quick-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          color: var(--text-medium);
          flex-wrap: wrap;
        }
        .host-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--border-light);
          flex-shrink: 0;
        }
        .property-description h3,
        .property-amenities h3,
        .property-map-section h3,
        .property-calendar-section h3,
        .property-reviews h3 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 14px;
        }
        .property-description p {
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-medium);
          white-space: pre-line;
        }
        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .amenity-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          padding: 12px;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
        }
        .amenity-emoji { font-size: 20px; }
        .map-address { color: var(--text-medium); font-size: 14px; margin-bottom: 12px; }
        .property-map {
          height: 320px;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-light);
        }
        .reviews-header { margin-bottom: 24px; }
        .reviews-header h3 {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 0;
        }
        .reviews-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .review-item {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .review-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .review-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }
        .review-date { font-size: 12px; color: var(--text-medium); }
        .review-comment { font-size: 14px; line-height: 1.6; color: var(--text-medium); }
        .booking-sidebar { position: relative; }
        .owner-notice {
          text-align: center;
          padding: 32px 24px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          position: sticky;
          top: 96px;
        }
        .owner-notice h3 { font-size: 18px; font-weight: 600; }

        /* Gallery modal */
        .gallery-modal {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: rgba(0,0,0,0.92);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 20px;
        }
        .gallery-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }
        .gallery-close:hover { background: rgba(255,255,255,0.2); }
        .gallery-nav { flex-shrink: 0; }
        .gallery-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }
        .gallery-btn:hover:not(:disabled) { background: rgba(255,255,255,0.2); }
        .gallery-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .gallery-image {
          max-width: 900px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .gallery-image img {
          max-height: 80vh;
          max-width: 100%;
          object-fit: contain;
          border-radius: var(--radius-md);
        }
        .gallery-caption { color: rgba(255,255,255,0.7); font-size: 13px; }

        @media (max-width: 1024px) {
          .property-layout { grid-template-columns: 1fr; }
          .booking-sidebar { position: static; order: -1; }
          .photo-gallery { height: 320px; }
        }
        @media (max-width: 640px) {
          .photo-gallery { grid-template-columns: 1fr; }
          .photo-grid { display: none; }
        }
      `}</style>
    </div>
  );
};

export default PropertyDetailPage;
