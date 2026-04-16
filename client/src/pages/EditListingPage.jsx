import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { FiSave, FiTrash2, FiPlus, FiArrowLeft } from 'react-icons/fi';

const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'cabin', 'studio', 'loft', 'other'];
const AMENITY_OPTIONS = [
  'WiFi', 'Kitchen', 'Parking', 'Pool', 'Air conditioning', 'Hot tub',
  'Washer', 'Dryer', 'TV', 'Gym', 'Fireplace', 'BBQ grill', 'Elevator',
  'Workspace', 'Beach access', 'Hiking trails', 'Ski storage', 'Wine cellar',
  'Garden', 'Coffee maker', 'Doorman',
];

const EditListingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [photos, setPhotos] = useState([]);

  const [form, setForm] = useState({
    title: '', description: '', property_type: 'apartment',
    address: '', city: '', country: '',
    latitude: '', longitude: '',
    price_per_night: '', max_guests: 1, bedrooms: 1, bathrooms: 1,
    amenities: [], status: 'active',
  });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/properties/${id}`);
        const p = res.data;
        setForm({
          title: p.title || '',
          description: p.description || '',
          property_type: p.property_type || 'apartment',
          address: p.address || '',
          city: p.city || '',
          country: p.country || '',
          latitude: p.latitude || '',
          longitude: p.longitude || '',
          price_per_night: p.price_per_night || '',
          max_guests: p.max_guests || 1,
          bedrooms: p.bedrooms || 1,
          bathrooms: p.bathrooms || 1,
          amenities: p.amenities || [],
          status: p.status || 'active',
        });
        setPhotos(p.photos || []);
      } catch {
        setError('Failed to load property');
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const toggleAmenity = (amenity) => {
    setForm({
      ...form,
      amenities: form.amenities.includes(amenity)
        ? form.amenities.filter(a => a !== amenity)
        : [...form.amenities, amenity],
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
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
      await api.put(`/properties/${id}`, payload);
      setSuccess('Listing updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  const addPhoto = async () => {
    if (!newPhotoUrl.trim()) return;
    try {
      const res = await api.post(`/properties/${id}/photos`, {
        url: newPhotoUrl.trim(),
        is_primary: photos.length === 0,
      });
      setPhotos(prev => [...prev, res.data]);
      setNewPhotoUrl('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add photo');
    }
  };

  const deletePhoto = async (photoId) => {
    try {
      await api.delete(`/properties/${id}/photos/${photoId}`);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch {
      setError('Failed to delete photo');
    }
  };

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="edit-listing-page">
      <div className="edit-listing-inner">
        <div className="edit-listing-header">
          <Link to="/dashboard/host" className="back-link">
            <FiArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="edit-listing-title">
            <h1>Edit Listing</h1>
            <Link to={`/properties/${id}`} className="view-listing-link">View Listing</Link>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="edit-tabs">
          {['details', 'location', 'photos', 'availability'].map(tab => (
            <button
              key={tab}
              className={`edit-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="edit-card">
          {/* Details tab */}
          {activeTab === 'details' && (
            <div>
              <div className="form-group">
                <label className="form-label">Property Type</label>
                <div className="type-buttons">
                  {PROPERTY_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`type-btn ${form.property_type === type ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, property_type: type })}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Title</label>
                <input type="text" className="form-input" value={form.title} onChange={update('title')} />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={update('description')} rows={5} />
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Price per Night ($)</label>
                  <input type="number" className="form-input" value={form.price_per_night} onChange={update('price_per_night')} min={1} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Guests</label>
                  <input type="number" className="form-input" value={form.max_guests} onChange={update('max_guests')} min={1} max={20} />
                </div>
                <div className="form-group">
                  <label className="form-label">Bedrooms</label>
                  <input type="number" className="form-input" value={form.bedrooms} onChange={update('bedrooms')} min={0} max={20} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Bathrooms</label>
                  <select className="form-select" value={form.bathrooms} onChange={update('bathrooms')}>
                    {[0.5,1,1.5,2,2.5,3,3.5,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={update('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Amenities</label>
                <div className="amenity-checkboxes">
                  {AMENITY_OPTIONS.map(amenity => (
                    <label key={amenity} className={`amenity-checkbox ${form.amenities.includes(amenity) ? 'checked' : ''}`}>
                      <input type="checkbox" checked={form.amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} style={{ display: 'none' }} />
                      {amenity}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Location tab */}
          {activeTab === 'location' && (
            <div>
              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input type="text" className="form-input" value={form.address} onChange={update('address')} />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-input" value={form.city} onChange={update('city')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input type="text" className="form-input" value={form.country} onChange={update('country')} />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input type="number" className="form-input" value={form.latitude} onChange={update('latitude')} step="any" />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input type="number" className="form-input" value={form.longitude} onChange={update('longitude')} step="any" />
                </div>
              </div>
            </div>
          )}

          {/* Photos tab */}
          {activeTab === 'photos' && (
            <div>
              <div className="photo-url-input" style={{ marginBottom: 20 }}>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/photo.jpg"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhoto())}
                />
                <button type="button" onClick={addPhoto} disabled={!newPhotoUrl.trim()} className="btn btn-secondary">
                  <FiPlus size={16} /> Add Photo
                </button>
              </div>

              <div className="photos-grid">
                {photos.length === 0 ? (
                  <div className="no-photos">
                    <p>No photos yet. Add some URLs above!</p>
                  </div>
                ) : (
                  photos.map((photo, i) => (
                    <div key={photo.id} className="photo-preview-item">
                      <img src={photo.url} alt={`Photo ${i + 1}`} onError={(e) => e.target.style.opacity = '0.3'} />
                      {photo.is_primary && <span className="primary-badge">Main</span>}
                      <button onClick={() => deletePhoto(photo.id)} className="remove-photo-btn">
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Availability tab */}
          {activeTab === 'availability' && (
            <AvailabilityManager propertyId={id} />
          )}

          {activeTab !== 'photos' && activeTab !== 'availability' && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-light)' }}>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                <FiSave size={15} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .edit-listing-page {
          padding-top: var(--navbar-height);
          min-height: 100vh;
          background: var(--bg-light);
        }
        .edit-listing-inner {
          max-width: 860px;
          margin: 0 auto;
          padding: 32px 24px 60px;
        }
        .edit-listing-header { margin-bottom: 24px; }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--text-medium);
          text-decoration: none;
          margin-bottom: 12px;
        }
        .back-link:hover { color: var(--text-dark); }
        .edit-listing-title {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .edit-listing-title h1 { font-size: 26px; font-weight: 700; }
        .view-listing-link {
          font-size: 14px;
          color: var(--primary);
          text-decoration: underline;
        }
        .edit-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-light);
          margin-bottom: 24px;
          gap: 4px;
        }
        .edit-tab {
          padding: 10px 20px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-medium);
          cursor: pointer;
          transition: var(--transition);
          margin-bottom: -1px;
          font-family: inherit;
          text-transform: capitalize;
        }
        .edit-tab:hover { color: var(--text-dark); }
        .edit-tab.active { color: var(--text-dark); border-bottom-color: var(--text-dark); }
        .edit-card {
          background: white;
          border-radius: var(--radius-lg);
          padding: 32px;
          box-shadow: var(--shadow-md);
        }
        .type-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
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
        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .amenity-checkboxes { display: flex; flex-wrap: wrap; gap: 8px; }
        .amenity-checkbox {
          padding: 6px 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          font-size: 13px;
          cursor: pointer;
          transition: var(--transition);
          user-select: none;
        }
        .amenity-checkbox.checked { background: var(--text-dark); color: white; border-color: var(--text-dark); }
        .photo-url-input { display: flex; gap: 10px; }
        .photo-url-input .form-input { flex: 1; }
        .photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
        .photo-preview-item {
          position: relative; border-radius: var(--radius-md);
          overflow: hidden; aspect-ratio: 4/3; border: 1px solid var(--border-light);
        }
        .photo-preview-item img { width: 100%; height: 100%; object-fit: cover; }
        .primary-badge {
          position: absolute; top: 8px; left: 8px;
          background: var(--primary); color: white;
          padding: 2px 8px; border-radius: var(--radius-full);
          font-size: 11px; font-weight: 700;
        }
        .remove-photo-btn {
          position: absolute; top: 6px; right: 6px;
          background: rgba(0,0,0,0.6); color: white;
          border: none; border-radius: 50%;
          width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .no-photos {
          grid-column: 1 / -1; text-align: center; padding: 40px;
          color: var(--text-medium); border: 2px dashed var(--border); border-radius: var(--radius-md); font-size: 14px;
        }
        @media (max-width: 640px) {
          .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

// Availability manager sub-component
const AvailabilityManager = ({ propertyId }) => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleDateChange = (e) => {
    const date = e.target.value;
    if (!date) return;
    if (selectedDates.includes(date)) {
      setSelectedDates(prev => prev.filter(d => d !== date));
    } else {
      setSelectedDates(prev => [...prev, date]);
    }
  };

  const handleSave = async () => {
    if (selectedDates.length === 0) {
      setMessage('Please select at least one date');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await api.post(`/availability/${propertyId}`, { dates: selectedDates, is_available: isAvailable });
      setMessage(`Updated ${selectedDates.length} date(s) successfully`);
      setSelectedDates([]);
    } catch {
      setMessage('Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Manage Availability</h3>
      <p style={{ color: 'var(--text-medium)', marginBottom: 20, fontSize: 14 }}>
        Block or unblock specific dates for your property. Blocked dates won't be available for booking.
      </p>

      {message && (
        <div className={`alert ${message.includes('Failed') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Select Dates to Update</label>
        <input
          type="date"
          className="form-input"
          min={new Date().toISOString().split('T')[0]}
          onChange={handleDateChange}
          style={{ maxWidth: 240 }}
        />
        {selectedDates.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {selectedDates.map(d => (
              <span key={d} style={{ padding: '4px 10px', background: 'var(--bg-light)', borderRadius: 'var(--radius-full)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                {d}
                <button onClick={() => setSelectedDates(prev => prev.filter(x => x !== d))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 16, lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Set as</label>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input type="radio" checked={!isAvailable} onChange={() => setIsAvailable(false)} />
            Blocked
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input type="radio" checked={isAvailable} onChange={() => setIsAvailable(true)} />
            Available
          </label>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving || selectedDates.length === 0} className="btn btn-primary">
        {saving ? 'Saving...' : `Update ${selectedDates.length} Date${selectedDates.length !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
};

export default EditListingPage;
