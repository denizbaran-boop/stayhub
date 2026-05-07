const pool = require('../config/db');
const { createNotification } = require('../services/notifier');

const ALLOWED_REASONS = [
  'cleanliness',
  'misrepresentation',
  'no_show',
  'property_damage',
  'safety',
  'payment_issue',
  'other',
];

// Guest or host opens a dispute against one of their bookings
const createDispute = async (req, res, next) => {
  try {
    const { booking_id, reason, description } = req.body;
    if (!booking_id || !reason || !description) {
      return res.status(400).json({ error: 'booking_id, reason and description are required' });
    }
    if (!ALLOWED_REASONS.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason' });
    }
    if (description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters' });
    }

    const booking = await pool.query(
      `SELECT b.*, p.host_id FROM bookings b
       JOIN properties p ON p.id = b.property_id
       WHERE b.id = $1`,
      [booking_id]
    );
    if (!booking.rows[0]) return res.status(404).json({ error: 'Booking not found' });

    const b = booking.rows[0];
    if (b.guest_id !== req.user.id && b.host_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the guest or host can report this booking' });
    }

    // One open dispute per booking per reporter
    const existing = await pool.query(
      `SELECT id FROM disputes
       WHERE booking_id = $1 AND reporter_id = $2 AND status IN ('open','investigating')`,
      [booking_id, req.user.id]
    );
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'You already have an open dispute for this booking' });
    }

    const result = await pool.query(
      `INSERT INTO disputes (booking_id, reporter_id, reason, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [booking_id, req.user.id, reason, description.trim()]
    );

    // Notify all admins
    const admins = await pool.query("SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE");
    for (const admin of admins.rows) {
      try {
        await createNotification({
          user_id: admin.id,
          type: 'dispute_opened',
          title: 'New dispute filed',
          message: `A user reported a booking issue (${reason}).`,
          link: '/admin/disputes',
        });
      } catch (err) {
        console.error('[dispute] failed admin notification:', err.message);
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Reporter can see their own disputes
const listMyDisputes = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT d.*,
         b.check_in, b.check_out, b.final_price,
         p.title as property_title
       FROM disputes d
       JOIN bookings b ON b.id = d.booking_id
       JOIN properties p ON p.id = b.property_id
       WHERE d.reporter_id = $1
       ORDER BY d.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// Admin: list all disputes (with optional status filter)
const listAllDisputes = async (req, res, next) => {
  try {
    const { status } = req.query;
    const params = [];
    let where = '';
    if (status) {
      params.push(status);
      where = `WHERE d.status = $1`;
    }
    const result = await pool.query(
      `SELECT d.*,
         b.check_in, b.check_out, b.final_price, b.status as booking_status,
         p.id as property_id, p.title as property_title,
         reporter.first_name as reporter_first, reporter.last_name as reporter_last,
         reporter.email as reporter_email,
         host.first_name as host_first, host.last_name as host_last,
         guest.first_name as guest_first, guest.last_name as guest_last
       FROM disputes d
       JOIN bookings b ON b.id = d.booking_id
       JOIN properties p ON p.id = b.property_id
       JOIN users reporter ON reporter.id = d.reporter_id
       JOIN users host ON host.id = p.host_id
       JOIN users guest ON guest.id = b.guest_id
       ${where}
       ORDER BY
         CASE d.status WHEN 'open' THEN 0 WHEN 'investigating' THEN 1 ELSE 2 END,
         d.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// Admin: change status / add resolution notes
const updateDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;
    const allowed = ['open', 'investigating', 'resolved', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existing = await pool.query(
      `SELECT d.*, b.guest_id, p.host_id
       FROM disputes d
       JOIN bookings b ON b.id = d.booking_id
       JOIN properties p ON p.id = b.property_id
       WHERE d.id = $1`,
      [id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Dispute not found' });

    const isClosing = status === 'resolved' || status === 'rejected';
    const result = await pool.query(
      `UPDATE disputes
       SET status = $1,
           resolution_notes = COALESCE($2, resolution_notes),
           resolved_by = CASE WHEN $3::boolean THEN $4 ELSE resolved_by END,
           resolved_at = CASE WHEN $3::boolean THEN NOW() ELSE resolved_at END,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [status, resolution_notes || null, isClosing, req.user.id, id]
    );

    // Notify the reporter
    try {
      const titleMap = {
        investigating: 'Dispute under review',
        resolved: 'Dispute resolved',
        rejected: 'Dispute closed',
        open: 'Dispute reopened',
      };
      await createNotification({
        user_id: existing.rows[0].reporter_id,
        type: `dispute_${status}`,
        title: titleMap[status] || 'Dispute updated',
        message: resolution_notes ? resolution_notes.slice(0, 200) : `Status: ${status}`,
        link: '/disputes',
      });
    } catch (err) {
      console.error('[dispute] failed to notify reporter:', err.message);
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createDispute,
  listMyDisputes,
  listAllDisputes,
  updateDispute,
  ALLOWED_REASONS,
};
