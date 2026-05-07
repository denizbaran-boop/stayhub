const pool = require('../config/db');

// Returns occupancy data for the calling host:
// - Per-property: total nights booked vs. window length, % occupied
// - Aggregate: monthly rate over the last 12 months
const getHostOccupancy = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    // Default window = last 90 days
    const today = new Date();
    const defaultFrom = new Date(today.getTime() - 90 * 86400000).toISOString().slice(0, 10);
    const defaultTo = today.toISOString().slice(0, 10);
    const fromDate = from || defaultFrom;
    const toDate = to || defaultTo;

    // Per-property occupancy in window
    const perProperty = await pool.query(
      `WITH window_days AS (
         SELECT ($1::date) AS w_start, ($2::date) AS w_end
       ),
       host_props AS (
         SELECT id, title, city, country, status, created_at
         FROM properties WHERE host_id = $3
       )
       SELECT hp.id,
         hp.title,
         hp.city,
         hp.country,
         hp.status,
         (SELECT (w_end - w_start) FROM window_days)::int AS window_nights,
         COALESCE(SUM(
           GREATEST(0,
             LEAST(b.check_out, (SELECT w_end FROM window_days))
             - GREATEST(b.check_in, (SELECT w_start FROM window_days))
           )
         ), 0)::int AS booked_nights,
         COUNT(b.id) FILTER (WHERE b.status IN ('confirmed','completed')) ::int AS booking_count
       FROM host_props hp
       LEFT JOIN bookings b ON b.property_id = hp.id
         AND b.status IN ('confirmed','completed')
         AND b.check_in < (SELECT w_end FROM window_days)
         AND b.check_out > (SELECT w_start FROM window_days)
       GROUP BY hp.id, hp.title, hp.city, hp.country, hp.status
       ORDER BY hp.title`,
      [fromDate, toDate, req.user.id]
    );

    const properties = perProperty.rows.map(p => {
      const window_nights = p.window_nights || 1;
      const occupancy_rate = window_nights > 0
        ? +(((p.booked_nights / window_nights) * 100).toFixed(1))
        : 0;
      return {
        id: p.id,
        title: p.title,
        city: p.city,
        country: p.country,
        status: p.status,
        window_nights,
        booked_nights: p.booked_nights,
        booking_count: p.booking_count,
        occupancy_rate,
      };
    });

    // Monthly occupancy rate over last 12 months
    const monthly = await pool.query(
      `WITH months AS (
         SELECT generate_series(
           date_trunc('month', NOW() - INTERVAL '11 months'),
           date_trunc('month', NOW()),
           INTERVAL '1 month'
         )::date AS month_start
       ),
       host_props AS (
         SELECT id FROM properties WHERE host_id = $1 AND status != 'deleted'
       )
       SELECT
         to_char(m.month_start, 'YYYY-MM') AS month,
         (SELECT COUNT(*) FROM host_props)::int AS property_count,
         EXTRACT(DAY FROM (m.month_start + INTERVAL '1 month' - INTERVAL '1 day'))::int AS days_in_month,
         COALESCE(SUM(
           GREATEST(0,
             LEAST(b.check_out, (m.month_start + INTERVAL '1 month')::date)
             - GREATEST(b.check_in, m.month_start)
           )
         ), 0)::int AS booked_nights
       FROM months m
       LEFT JOIN bookings b ON b.status IN ('confirmed','completed')
         AND b.property_id IN (SELECT id FROM host_props)
         AND b.check_in < (m.month_start + INTERVAL '1 month')::date
         AND b.check_out > m.month_start
       GROUP BY m.month_start
       ORDER BY m.month_start`,
      [req.user.id]
    );

    const monthly_series = monthly.rows.map(r => {
      const total = (r.property_count || 0) * (r.days_in_month || 0);
      const rate = total > 0 ? +(((r.booked_nights / total) * 100).toFixed(1)) : 0;
      return {
        month: r.month,
        booked_nights: r.booked_nights,
        capacity_nights: total,
        occupancy_rate: rate,
      };
    });

    // Overall numbers across the window
    const totalBooked = properties.reduce((s, p) => s + p.booked_nights, 0);
    const totalCapacity = properties.reduce((s, p) => s + p.window_nights, 0);
    const overall_rate = totalCapacity > 0
      ? +(((totalBooked / totalCapacity) * 100).toFixed(1))
      : 0;

    res.json({
      window: { from: fromDate, to: toDate },
      overall: {
        property_count: properties.length,
        booked_nights: totalBooked,
        capacity_nights: totalCapacity,
        occupancy_rate: overall_rate,
      },
      properties,
      monthly: monthly_series,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getHostOccupancy };
