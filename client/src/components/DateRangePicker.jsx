import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiCalendar } from 'react-icons/fi';

const DateRangePicker = ({ checkIn, checkOut, onCheckInChange, onCheckOutChange, blockedDates = [] }) => {
  const isDateBlocked = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return blockedDates.includes(dateStr);
  };

  return (
    <div className="date-range-picker">
      <div className="date-field">
        <label className="date-label">
          <FiCalendar size={14} />
          Check-in
        </label>
        <DatePicker
          selected={checkIn}
          onChange={(date) => {
            onCheckInChange(date);
            if (checkOut && date >= checkOut) onCheckOutChange(null);
          }}
          placeholderText="Add date"
          minDate={new Date()}
          selectsStart
          startDate={checkIn}
          endDate={checkOut}
          filterDate={(date) => !isDateBlocked(date)}
          dateFormat="MMM d, yyyy"
          className="date-input"
        />
      </div>
      <div className="date-divider" />
      <div className="date-field">
        <label className="date-label">
          <FiCalendar size={14} />
          Check-out
        </label>
        <DatePicker
          selected={checkOut}
          onChange={onCheckOutChange}
          placeholderText="Add date"
          minDate={checkIn ? new Date(checkIn.getTime() + 86400000) : new Date()}
          selectsEnd
          startDate={checkIn}
          endDate={checkOut}
          filterDate={(date) => !isDateBlocked(date)}
          dateFormat="MMM d, yyyy"
          className="date-input"
        />
      </div>

      <style>{`
        .date-range-picker {
          display: flex;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }
        .date-field {
          flex: 1;
          padding: 10px 14px;
        }
        .date-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-dark);
          margin-bottom: 4px;
          cursor: pointer;
        }
        .date-input {
          border: none !important;
          outline: none;
          font-size: 14px;
          color: var(--text-dark);
          background: none;
          padding: 0 !important;
          width: 100%;
          cursor: pointer;
        }
        .date-input::placeholder {
          color: var(--text-medium);
        }
        .date-divider {
          width: 1px;
          background: var(--border);
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
};

export default DateRangePicker;
