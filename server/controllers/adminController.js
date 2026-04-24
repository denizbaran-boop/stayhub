const pool = require('../config/db');

const listUsers = async (req, res, next) => {
  try {
    const { role, q, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';

    if (role) {
      params.push(role);
      where += ` AND role = $${params.length}`;
    }
    if (status === 'active') where += ' AND is_active = TRUE';
    if (status === 'inactive') where += ' AND is_active = FALSE';
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      where += ` AND (LOWER(email) LIKE $${params.length} OR LOWER(first_name) LIKE $${params.length} OR LOWER(last_name) LIKE $${params.length})`;
    }

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, is_active, two_factor_enabled,
         avatar_url, phone, created_at,
         (SELECT COUNT(*) FROM bookings WHERE guest_id = users.id) as booking_count,
         (SELECT COUNT(*) FROM properties WHERE host_id = users.id AND status != 'deleted') as property_count
       FROM users
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await pool.query(`SELECT COUNT(*) FROM users ${where}`, params.slice(0, -2));

    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
};

const setUserActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be boolean' });
    }
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot deactivate your own admin account' });
    }
    const result = await pool.query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, is_active',
      [is_active, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account' });
    }
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted', id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
};

const getRevenueReport = async (req, res, next) => {
  try {
    const COMMISSION_RATE = 0.10;

    const overall = await pool.query(
      `SELECT
         COALESCE(SUM(final_price), 0) as gross_revenue,
         COUNT(*) as total_bookings,
         COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings
       FROM bookings
       WHERE status IN ('confirmed','completed')`
    );

    const commission = await pool.query(
      `SELECT COALESCE(SUM(commission), 0) as commission_revenue FROM payouts`
    );

    const monthly = await pool.query(
      `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
         COUNT(*) as bookings,
         COALESCE(SUM(final_price), 0) as revenue,
         COALESCE(SUM(final_price) * $1, 0) as commission
       FROM bookings
       WHERE status IN ('confirmed','completed')
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`,
      [COMMISSION_RATE]
    );

    const recentTx = await pool.query(
      `SELECT b.id, b.final_price, b.status, b.created_at,
         p.title as property_title, p.city,
         g.first_name as guest_first_name, g.last_name as guest_last_name,
         h.first_name as host_first_name, h.last_name as host_last_name
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       JOIN users g ON g.id = b.guest_id
       JOIN users h ON h.id = p.host_id
       ORDER BY b.created_at DESC
       LIMIT 20`
    );

    const topHosts = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email,
         COUNT(b.id) as bookings,
         COALESCE(SUM(b.final_price), 0) as revenue
       FROM users u
       JOIN properties p ON p.host_id = u.id
       JOIN bookings b ON b.property_id = p.id
       WHERE u.role = 'host' AND b.status IN ('confirmed','completed')
       GROUP BY u.id
       ORDER BY revenue DESC
       LIMIT 10`
    );

    const counts = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users) as user_count,
         (SELECT COUNT(*) FROM users WHERE role = 'host') as host_count,
         (SELECT COUNT(*) FROM users WHERE role = 'guest') as guest_count,
         (SELECT COUNT(*) FROM properties WHERE status = 'active') as active_properties`
    );

    res.json({
      overall: {
        gross_revenue: parseFloat(overall.rows[0].gross_revenue),
        commission_revenue: parseFloat(commission.rows[0].commission_revenue),
        total_bookings: parseInt(overall.rows[0].total_bookings),
        confirmed_bookings: parseInt(overall.rows[0].confirmed_bookings),
        completed_bookings: parseInt(overall.rows[0].completed_bookings),
        cancelled_bookings: parseInt(overall.rows[0].cancelled_bookings),
      },
      counts: {
        users: parseInt(counts.rows[0].user_count),
        hosts: parseInt(counts.rows[0].host_count),
        guests: parseInt(counts.rows[0].guest_count),
        active_properties: parseInt(counts.rows[0].active_properties),
      },
      monthly: monthly.rows,
      recent_transactions: recentTx.rows,
      top_hosts: topHosts.rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, setUserActive, deleteUser, getRevenueReport };
