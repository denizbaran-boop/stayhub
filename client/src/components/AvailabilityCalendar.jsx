import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../api/axios';

const AvailabilityCalendar = ({ propertyId }) => {
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;
    const fetchBlocked = async () => {
      try {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 90);
        const res = await api.get(`/availability/${propertyId}/blocked`, {
          params: {
            start_date: new Date().toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
          },
        });
        setBlockedDates(res.data.blocked_dates || []);
      } catch {
        setBlockedDates([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBlocked();
  }, [propertyId]);

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    const dateStr = date.toISOString().split('T')[0];
    if (blockedDates.includes(dateStr)) return 'blocked-date';
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return 'past-date';
    return 'available-date';
  };

  const tileDisabled = ({ date }) => {
    const dateStr = date.toISOString().split('T')[0];
    return blockedDates.includes(dateStr) || date < new Date(new Date().setHours(0, 0, 0, 0));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="availability-calendar">
      <Calendar
        tileClassName={tileClassName}
        tileDisabled={tileDisabled}
        minDate={new Date()}
        showDoubleView={false}
        view="month"
        locale="en-US"
      />
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot available" />
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot unavailable" />
          <span>Unavailable</span>
        </div>
      </div>
      <style>{`
        .availability-calendar {
          width: 100%;
        }
        .availability-calendar .react-calendar {
          width: 100%;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          font-family: inherit;
          padding: 12px;
        }
        .availability-calendar .react-calendar__navigation {
          margin-bottom: 12px;
        }
        .availability-calendar .react-calendar__navigation button {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-dark);
          border-radius: var(--radius-sm);
        }
        .availability-calendar .react-calendar__navigation button:hover {
          background: var(--bg-light);
        }
        .availability-calendar .react-calendar__tile {
          border-radius: var(--radius-sm);
          font-size: 13px;
          padding: 8px 4px;
        }
        .availability-calendar .blocked-date {
          background: #FEE2E2 !important;
          color: #9B1C1C !important;
          text-decoration: line-through;
        }
        .availability-calendar .available-date {
          background: #F0FDF4 !important;
          color: #166534;
        }
        .availability-calendar .past-date {
          opacity: 0.4;
        }
        .calendar-legend {
          display: flex;
          gap: 16px;
          margin-top: 12px;
          font-size: 13px;
          color: var(--text-medium);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .legend-dot.available { background: #86EFAC; }
        .legend-dot.unavailable { background: #FCA5A5; }
      `}</style>
    </div>
  );
};

export default AvailabilityCalendar;
