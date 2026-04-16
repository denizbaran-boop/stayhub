import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FiPlus, FiTrash2, FiArrowLeft, FiArrowRight } from 'react-icons/fi';

const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'cabin', 'studio', 'loft', 'other'];
const AMENITY_OPTIONS = [
  'WiFi', 'Kitchen', 'Parking', 'Pool', 'Air conditioning', 'Hot tub',
  'Washer', 'Dryer', 'TV', 'Gym', 'Fireplace', 'BBQ grill', 'Elevator',
  'Workspace', 'Beach access', 'Hiking trails', 'Ski storage', 'Wine cellar',
  'Garden', 'Coffee maker', 'Doorman',
];

const STEPS = ['Basic Info', 'Location', 'Details', 'Photos', 'Review'];

const CreateListingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    property_type: 'apartment',
    address: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
    price_per_night: '',
    max_guests: 1,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [],
    photos: [],
  });

  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const updateNum = (field) => (e) => setForm({ ...form, [field]: parseFloat(e.target.value) || 0 });

  const toggleAmenity = (amenity) => {
    setForm({
      ...form,
      amenities: form.amenities.includes(amenity)
        ? form.amenities.filter(a => a !== amenity)
        : [...form.amenities, amenity],
    });
  };

  const addPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    setForm({ ...form, photos: [...form.photos, { url: newPhotoUrl.trim(), caption: '' }] });
    setNewPhotoUrl('');
  };

  const removePhoto = (index) => {
    setForm({ ...form, photos: form.photos.filter((_, i) => i !== index) });
  };

  const validateStep = () => {
    const errors = {};
    if (step === 0) {
      if (!form.title.trim()) errors.title = 'Title is required';
      if (!form.property_type) errors.property_type = 'Type is required';
    }
    if (step === 1) {
      if (!form.address.trim()) errors.address = 'Address is required';
      if (!form.city.trim()) errors.city = 'City is required';
      if (!form.country.trim()) errors.country = 'Country is required';
    }
    if (step === 2) {
      if (!form.price_per_night || form.price_per_night <= 0) errors.price_per_night = 'Valid price is required';
      if (!form.max_guests || form.max_guests < 1) errors.max_guests = 'At least 1 guest required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => {
    setStep(s => Math.max(s - 1, 0));
    setFieldErrors({});
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        price_per_night: parseFloat(form.price_per_night),
        max_guests: parseInt(form.max_guests),
        bedrooms: parseInt(form.bedrooms),
        bathrooms: parseFloat(form.bathrooms),
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      };
      const res = await api.post('/properties', payload);
      navigate(`/properties/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing');
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-listing-page">
      <div className="create-listing-inner">
        <div className="create-listing-header">
          <h1>Create a Listing</h1>
          <p>Tell us about your property</p>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((s, i) => (
            <div key={i} className={`step ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}>
              <div className="step-circle">{i < step ? '✓' : i + 1}</div>
              <span className="step-label">{s}</span>
            </div>
          ))}
        </div>

        <div className="create-listing-card">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="step-content">
              <h2>What kind of property are you listing?</h2>
              <div className="type-grid">
                {PROPERTY_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`type-card ${form.property_type === type ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, property_type: type })}
                  >
                    <span className="type-emoji">
                      {{'apartment':'🏢','house':'🏠','villa':'🏰','cabin':'🏕️','studio':'🏙️','loft':'🏗️','other':'🏨'}[type]}
                    </span>
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  </button>
                ))}
              </div>
              {fieldErrors.property_type && <span className="form-error">{fieldErrors.property_type}</span>}

              <div className="form-group" style={{ marginTop: 24 }}>
                <label className="form-label">Listing Title *</label>
                <input
                  type="text"
                  className={`form-input ${fieldErrors.title ? 'error' : ''}`}
                  placeholder="Cozy Downtown Apartment with City Views"
                  value={form.title}
                  onChange={update('title')}
                  maxLength={100}
                />
                {fieldErrors.title && <span className="form-error">{fieldErrors.title}</span>}
                <span className="char-count">{form.title.length}/100</span>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe your property, what makes it special, nearby attractions..."
                  value={form.description}
                  onChange={update('description')}
                  rows={5}
                  maxLength={2000}
                />
                <span className="char-count">{form.description.length}/2000</span>
              </div>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="step-content">
              <h2>Where is your property located?</h2>
              <div className="form-group">
                <label className="form-label">Street Address *</label>
                <input
                  type="text"
                  className={`form-input ${fieldErrors.address ? 'error' : ''}`}
                  placeholder="123 Main Street, Unit 4B"
                  value={form.address}
                  onChange={update('address')}
                />
                {fieldErrors.address && <span className="form-error">{fieldErrors.address}</span>}
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    className={`form-input ${fieldErrors.city ? 'error' : ''}`}
                    placeholder="New York"
                    value={form.city}
                    onChange={update('city')}
                  />
                  {fieldErrors.city && <span className="form-error">{fieldErrors.city}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Country *</label>
                  <input
                    type="text"
                    className={`form-input ${fieldErrors.country ? 'error' : ''}`}
                    placeholder="United States"
                    value={form.country}
                    onChange={update('country')}
                  />
                  {fieldErrors.country && <span className="form-error">{fieldErrors.country}</span>}
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Latitude (optional)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="40.7128"
                    value={form.latitude}
                    onChange={update('latitude')}
                    step="any"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude (optional)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="-74.0060"
                    value={form.longitude}
                    onChange={update('longitude')}
                    step="any"
                  />
                </div>
              </div>
              <p className="form-hint">
                Tip: You can get coordinates from Google Maps by right-clicking a location.
              </p>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="step-content">
              <h2>Property details & amenities</h2>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Price per Night ($) *</label>
                  <input
                    type="number"
                    className={`form-input ${fieldErrors.price_per_night ? 'error' : ''}`}
                    placeholder="150"
                    value={form.price_per_night}
                    onChange={update('price_per_night')}
                    min={1}
                  />
                  {fieldErrors.price_per_night && <span className="form-error">{fieldErrors.price_per_night}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Max Guests *</label>
                  <input
                    type="number"
                    className={`form-input ${fieldErrors.max_guests ? 'error' : ''}`}
                    value={form.max_guests}
                    onChange={updateNum('max_guests')}
                    min={1}
                    max={20}
                  />
                  {fieldErrors.max_guests && <span className="form-error">{fieldErrors.max_guests}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Bedrooms</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.bedrooms}
                    onChange={updateNum('bedrooms')}
                    min={0}
                    max={20}
                  />
                </div>
              </div>

              <div className="form-group" style={{ maxWidth: 200 }}>
                <label className="form-label">Bathrooms</label>
                <select className="form-select" value={form.bathrooms} onChange={update('bathrooms')}>
                  {[0.5,1,1.5,2,2.5,3,3.5,4,5,6].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amenities</label>
                <div className="amenity-checkboxes">
                  {AMENITY_OPTIONS.map(amenity => (
                    <label
                      key={amenity}
                      className={`amenity-checkbox ${form.amenities.includes(amenity) ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={form.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        style={{ display: 'none' }}
                      />
                      {amenity}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Photos */}
          {step === 3 && (
            <div className="step-content">
              <h2>Add photos to your listing</h2>
              <p className="step-desc">Add URLs for your property photos. The first photo will be the main image.</p>

              <div className="photo-url-input">
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/photo.jpg"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhoto())}
                />
                <button
                  type="button"
                  onClick={addPhoto}
                  className="btn btn-secondary"
                  disabled={!newPhotoUrl.trim()}
                >
                  <FiPlus size={16} /> Add
                </button>
              </div>

              <div className="photos-preview">
                {form.photos.map((photo, i) => (
                  <div key={i} className="photo-preview-item">
                    <img src={photo.url} alt={`Photo ${i + 1}`} onError={(e) => e.target.src = 'https://via.placeholder.com/200x150?text=Invalid+URL'} />
                    {i === 0 && <span className="primary-badge">Main</span>}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="remove-photo-btn"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
                {form.photos.length === 0 && (
                  <div className="no-photos">
                    <p>No photos added yet. Add some URLs above!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="step-content">
              <h2>Review your listing</h2>
              <div className="review-summary">
                <div className="review-section">
                  <h4>Property Type</h4>
                  <p>{form.property_type.charAt(0).toUpperCase() + form.property_type.slice(1)}</p>
                </div>
                <div className="review-section">
                  <h4>Title</h4>
                  <p>{form.title}</p>
                </div>
                {form.description && (
                  <div className="review-section">
                    <h4>Description</h4>
                    <p>{form.description.substring(0, 200)}{form.description.length > 200 ? '...' : ''}</p>
                  </div>
                )}
                <div className="review-section">
                  <h4>Location</h4>
                  <p>{form.address}, {form.city}, {form.country}</p>
                </div>
                <div className="review-section">
                  <h4>Details</h4>
                  <p>
                    ${parseFloat(form.price_per_night || 0).toFixed(2)}/night ·
                    {form.max_guests} guests ·
                    {form.bedrooms} bedrooms ·
                    {form.bathrooms} bathrooms
                  </p>
                </div>
                {form.amenities.length > 0 && (
                  <div className="review-section">
                    <h4>Amenities ({form.amenities.length})</h4>
                    <p>{form.amenities.join(', ')}</p>
                  </div>
                )}
                <div className="review-section">
                  <h4>Photos</h4>
                  <p>{form.photos.length} photo{form.photos.length !== 1 ? 's' : ''} added</p>
                  {form.photos.length > 0 && (
                    <div className="review-photos">
                      {form.photos.slice(0, 3).map((p, i) => (
                        <img key={i} src={p.url} alt="" className="review-thumb" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="step-navigation">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 0}
              className="btn btn-secondary"
            >
              <FiArrowLeft size={16} /> Back
            </button>
            <span className="step-indicator">{step + 1} / {STEPS.length}</span>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={nextStep} className="btn btn-primary">
                Next <FiArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Creating...' : 'Create Listing'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .create-listing-page {
          padding-top: var(--navbar-height);
          min-height: 100vh;
          background: var(--bg-light);
        }
        .create-listing-inner {
          max-width: 760px;
          margin: 0 auto;
          padding: 32px 24px 60px;
        }
        .create-listing-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .create-listing-header h1 { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
        .create-listing-header p { color: var(--text-medium); }
        .stepper {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 32px;
          overflow-x: auto;
        }
        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          opacity: 0.5;
          transition: var(--transition);
        }
        .step.active, .step.completed { opacity: 1; }
        .step-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          background: white;
          transition: var(--transition);
        }
        .step.active .step-circle {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
        }
        .step.completed .step-circle {
          border-color: #28a745;
          background: #28a745;
          color: white;
        }
        .step-label { font-size: 11px; font-weight: 600; white-space: nowrap; }
        .create-listing-card {
          background: white;
          border-radius: var(--radius-lg);
          padding: 32px;
          box-shadow: var(--shadow-md);
        }
        .step-content h2 { font-size: 22px; font-weight: 700; margin-bottom: 20px; }
        .step-desc { color: var(--text-medium); font-size: 14px; margin-bottom: 16px; }
        .type-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 8px;
        }
        .type-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 8px;
          border: 2px solid var(--border);
          border-radius: var(--radius-md);
          background: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          font-family: inherit;
          text-transform: capitalize;
        }
        .type-card:hover { border-color: var(--text-dark); }
        .type-card.active {
          border-color: var(--primary);
          background: #FFF0F0;
          color: var(--primary);
        }
        .type-emoji { font-size: 24px; }
        .char-count { font-size: 12px; color: var(--text-light); align-self: flex-end; }
        .form-hint { font-size: 13px; color: var(--text-medium); font-style: italic; margin-top: 4px; }
        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .amenity-checkboxes { display: flex; flex-wrap: wrap; gap: 8px; }
        .amenity-checkbox {
          padding: 7px 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          font-size: 13px;
          cursor: pointer;
          transition: var(--transition);
          user-select: none;
        }
        .amenity-checkbox.checked {
          background: var(--text-dark);
          color: white;
          border-color: var(--text-dark);
        }
        .photo-url-input { display: flex; gap: 10px; margin-bottom: 20px; }
        .photo-url-input .form-input { flex: 1; }
        .photos-preview {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }
        .photo-preview-item {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          aspect-ratio: 4/3;
          border: 2px solid var(--border-light);
        }
        .photo-preview-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .primary-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: var(--primary);
          color: white;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: 700;
        }
        .remove-photo-btn {
          position: absolute;
          top: 6px;
          right: 6px;
          background: rgba(0,0,0,0.6);
          color: white;
          border: none;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .no-photos {
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px;
          color: var(--text-medium);
          border: 2px dashed var(--border);
          border-radius: var(--radius-md);
          font-size: 14px;
        }
        .review-summary { display: flex; flex-direction: column; gap: 16px; }
        .review-section {
          padding: 14px;
          background: var(--bg-light);
          border-radius: var(--radius-sm);
        }
        .review-section h4 {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-medium);
          margin-bottom: 4px;
        }
        .review-section p { font-size: 14px; line-height: 1.6; }
        .review-photos { display: flex; gap: 8px; margin-top: 8px; }
        .review-thumb {
          width: 60px;
          height: 45px;
          object-fit: cover;
          border-radius: var(--radius-sm);
        }
        .step-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--border-light);
        }
        .step-indicator { font-size: 14px; color: var(--text-medium); }
        @media (max-width: 640px) {
          .type-grid { grid-template-columns: repeat(2, 1fr); }
          .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default CreateListingPage;
