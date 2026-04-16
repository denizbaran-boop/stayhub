import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiSearch, FiMapPin, FiCalendar, FiUsers } from 'react-icons/fi';

const SearchBar = ({ initialValues = {}, compact = false }) => {
  const navigate = useNavigate();
  const [location, setLocation] = useState(initialValues.location || '');
  const [checkIn, setCheckIn] = useState(initialValues.check_in ? new Date(initialValues.check_in) : null);
  const [checkOut, setCheckOut] = useState(initialValues.check_out ? new Date(initialValues.check_out) : null);
  const [guests, setGuests] = useState(initialValues.guests || 1);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (checkIn) params.set('check_in', checkIn.toISOString().split('T')[0]);
    if (checkOut) params.set('check_out', checkOut.toISOString().split('T')[0]);
    if (guests) params.set('guests', guests);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className={`search-bar ${compact ? 'compact' : ''}`}>
      <div className="search-field">
        <FiMapPin className="search-field-icon" size={16} />
        <input
          type="text"
          placeholder="Where are you going?"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="search-divider" />

      <div className="search-field">
        <FiCalendar className="search-field-icon" size={16} />
        <DatePicker
          selected={checkIn}
          onChange={(date) => {
            setCheckIn(date);
            if (checkOut && date >= checkOut) setCheckOut(null);
          }}
          placeholderText="Check in"
          minDate={new Date()}
          selectsStart
          startDate={checkIn}
          endDate={checkOut}
          dateFormat="MMM d, yyyy"
          className="search-datepicker"
        />
      </div>

      <div className="search-divider" />

      <div className="search-field">
        <FiCalendar className="search-field-icon" size={16} />
        <DatePicker
          selected={checkOut}
          onChange={(date) => setCheckOut(date)}
          placeholderText="Check out"
          minDate={checkIn ? new Date(checkIn.getTime() + 86400000) : new Date()}
          selectsEnd
          startDate={checkIn}
          endDate={checkOut}
          dateFormat="MMM d, yyyy"
          className="search-datepicker"
        />
      </div>

      <div className="search-divider" />

      <div className="search-field search-field-guests">
        <FiUsers className="search-field-icon" size={16} />
        <input
          type="number"
          placeholder="Guests"
          value={guests}
          min={1}
          max={20}
          onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
          className="search-input search-input-guests"
        />
      </div>

      <button type="submit" className="search-btn">
        <FiSearch size={18} />
        {!compact && <span>Search</span>}
      </button>

      <style>{`
        .search-bar {
          display: flex;
          align-items: center;
          background: white;
          border-radius: var(--radius-full);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
          padding: 6px 6px 6px 20px;
          gap: 0;
          max-width: 860px;
          width: 100%;
        }
        .search-bar.compact {
          padding: 4px 4px 4px 16px;
          max-width: 640px;
        }
        .search-field {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
          position: relative;
        }
        .search-field-icon {
          color: var(--text-medium);
          flex-shrink: 0;
        }
        .search-input {
          border: none;
          outline: none;
          font-size: 14px;
          color: var(--text-dark);
          background: none;
          width: 100%;
          min-width: 0;
        }
        .search-input::placeholder {
          color: var(--text-light);
        }
        .search-input-guests {
          width: 70px;
        }
        .search-datepicker {
          border: none !important;
          outline: none;
          font-size: 14px;
          color: var(--text-dark);
          background: none;
          padding: 0 !important;
          width: 100%;
          cursor: pointer;
        }
        .search-divider {
          width: 1px;
          height: 24px;
          background: var(--border);
          margin: 0 12px;
          flex-shrink: 0;
        }
        .search-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius-full);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          flex-shrink: 0;
        }
        .search-btn:hover {
          background: var(--primary-dark);
        }
        .compact .search-btn {
          padding: 10px 16px;
        }
        @media (max-width: 640px) {
          .search-bar {
            flex-direction: column;
            border-radius: var(--radius-lg);
            padding: 12px;
            gap: 8px;
          }
          .search-divider { display: none; }
          .search-field { width: 100%; }
          .search-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </form>
  );
};

export default SearchBar;
