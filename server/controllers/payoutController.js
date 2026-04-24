const pool = require('../config/db');
const { createNotification } = require('../services/notifier');

const listHostPayouts = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT po.*,
         b.check_in, b.check_out, b.final_price as booking_total,
         p.title as property_title,
         g.first_name as guest_first_name, g.last_name as guest_last_name
       FROM payouts po
       JOIN bookings b ON b.id = po.booking_id
       JOIN properties p ON p.id = b.property_id
       JOIN users g ON g.id = b.guest_id
       WHERE po.host_id = $1
       ORDER BY po.created_at DESC`,
      [req.user.id]
    );

    const summary = await pool.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_total,
         COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as paid_total,
         COALESCE(SUM(amount), 0) as lifetime_total,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
         COUNT(*) FILTER (WHERE status = 'paid') as paid_count
       FROM payouts WHERE host_id = $1`,
      [req.user.id]
    );

    res.json({
      payouts: result.rows,
      summary: {
        pending_total: parseFloat(summary.rows[0].pending_total),
        paid_total: parseFloat(summary.rows[0].paid_total),
        lifetime_total: parseFloat(summary.rows[0].lifetime_total),
        pending_count: parseInt(summary.rows[0].pending_count),
        paid_count: parseInt(summary.rows[0].paid_count),
      },
    });
  } catch (err) {
    next(err);
  }
};

const requestPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const r = await pool.query(
      'SELECT * FROM payouts WHERE id = $1 AND host_id = $2',
      [id, req.user.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Payout not found' });
    if (r.rows[0].status !== 'pending') return res.status(400).json({ error: 'Payout is not pending' });

    const upd = await pool.query(
      `UPDATE payouts
       SET status = 'paid', payout_date = CURRENT_DATE
       WHERE id = $1 RETURNING *`,
      [id]
    );

    await createNotification({
      user_id: req.user.id,
      type: 'payout_paid',
      title: 'Payout released',
      message: `Your payout of $${parseFloat(upd.rows[0].amount).toFixed(2)} has been processed.`,
      link: '/dashboard/host/payouts',
    });

    res.json(upd.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getHostEarnings = async (req, res, next) => {
  try {
    const overall = await pool.query(
      `SELECT
         COALESCE(SUM(b.final_price) FILTER (WHERE b.status IN ('confirmed','completed')), 0) as gross_revenue,
         COUNT(*) FILTER (WHERE b.status IN ('confirmed','completed')) as completed_bookings,
         COUNT(*) FILTER (WHERE b.status = 'pending') as pending_bookings,
         COALESCE(AVG(b.final_price) FILTER (WHERE b.status IN ('confirmed','completed')), 0) as avg_booking_value
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       WHERE p.host_id = $1`,
      [req.user.id]
    );

    const monthly = await pool.query(
      `SELECT to_char(date_trunc('month', b.created_at), 'YYYY-MM') as month,
         COUNT(*) as bookings,
         COALESCE(SUM(b.final_price), 0) as revenue
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       WHERE p.host_id = $1 AND b.status IN ('confirmed','completed')
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`,
      [req.user.id]
    );

    const payouts = await pool.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_payout,
         COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as paid_payout
       FROM payouts WHERE host_id = $1`,
      [req.user.id]
    );

    const byProperty = await pool.query(
      `SELECT p.id, p.title,
         COUNT(b.id) FILTER (WHERE b.status IN ('confirmed','completed')) as bookings,
         COALESCE(SUM(b.final_price) FILTER (WHERE b.status IN ('confirmed','completed')), 0) as revenue
       FROM properties p
       LEFT JOIN bookings b ON b.property_id = p.id
       WHERE p.host_id = $1 AND p.status != 'deleted'
       GROUP BY p.id
       ORDER BY revenue DESC
       LIMIT 20`,
      [req.user.id]
    );

    res.json({
      overall: {
        gross_revenue: parseFloat(overall.rows[0].gross_revenue),
        completed_bookings: parseInt(overall.rows[0].completed_bookings),
        pending_bookings: parseInt(overall.rows[0].pending_bookings),
        avg_booking_value: parseFloat(overall.rows[0].avg_booking_value),
        pending_payout: parseFloat(payouts.rows[0].pending_payout),
        paid_payout: parseFloat(payouts.rows[0].paid_payout),
      },
      monthly: monthly.rows,
      by_property: byProperty.rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listHostPayouts, requestPayout, getHostEarnings };
