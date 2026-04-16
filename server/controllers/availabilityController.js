const pool = require('../config/db');

const setAvailability = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { dates, is_available } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Dates array is required' });
    }

    const check = await pool.query(
      "SELECT id FROM properties WHERE id = $1 AND host_id = $2 AND status != 'deleted'",
      [propertyId, req.user.id]
    );

    if (!check.rows[0]) {
      return res.status(404).json({ error: 'Property not found or not owned by you' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const date of dates) {
        await client.query(
          `INSERT INTO availability (property_id, date, is_available)
           VALUES ($1, $2, $3)
           ON CONFLICT (property_id, date)
           DO UPDATE SET is_available = $3`,
          [propertyId, date, is_available !== undefined ? is_available : true]
        );
      }

      await client.query('COMMIT');
      res.json({ message: 'Availability updated successfully', dates_updated: dates.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

const getAvailability = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { month, year } = req.query;

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    const result = await pool.query(
      `SELECT date, is_available FROM availability
       WHERE property_id = $1
       AND date >= $2 AND date <= $3
       ORDER BY date`,
      [propertyId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    // Also get booked dates from bookings
    const bookedDates = await pool.query(
      `SELECT check_in, check_out FROM bookings
       WHERE property_id = $1
       AND status IN ('confirmed', 'pending')
       AND check_out >= $2 AND check_in <= $3`,
      [propertyId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    const blockedFromBookings = new Set();
    bookedDates.rows.forEach(booking => {
      const start = new Date(booking.check_in);
      const end = new Date(booking.check_out);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        blockedFromBookings.add(d.toISOString().split('T')[0]);
      }
    });

    const availabilityMap = {};
    result.rows.forEach(row => {
      availabilityMap[row.date.toISOString().split('T')[0]] = row.is_available;
    });

    res.json({
      property_id: propertyId,
      year: currentYear,
      month: currentMonth,
      availability: availabilityMap,
      booked_dates: Array.from(blockedFromBookings),
    });
  } catch (err) {
    next(err);
  }
};

const getBlockedDates = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { start_date, end_date } = req.query;

    const start = start_date || new Date().toISOString().split('T')[0];
    const end = end_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get manually blocked dates
    const blockedResult = await pool.query(
      `SELECT date FROM availability
       WHERE property_id = $1 AND is_available = FALSE
       AND date >= $2 AND date <= $3
       ORDER BY date`,
      [propertyId, start, end]
    );

    // Get booked dates
    const bookedResult = await pool.query(
      `SELECT check_in, check_out FROM bookings
       WHERE property_id = $1
       AND status IN ('confirmed', 'pending')
       AND check_out >= $2 AND check_in <= $3`,
      [propertyId, start, end]
    );

    const blockedDates = new Set(
      blockedResult.rows.map(r => r.date.toISOString().split('T')[0])
    );

    bookedResult.rows.forEach(booking => {
      const startD = new Date(booking.check_in);
      const endD = new Date(booking.check_out);
      for (let d = new Date(startD); d < endD; d.setDate(d.getDate() + 1)) {
        blockedDates.add(d.toISOString().split('T')[0]);
      }
    });

    res.json({
      property_id: propertyId,
      blocked_dates: Array.from(blockedDates).sort(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { setAvailability, getAvailability, getBlockedDates };
