const pool = require('../config/db');
const { createNotification } = require('../services/notifier');

const createHostReview = async (req, res, next) => {
  try {
    const { booking_id, rating, comment } = req.body;
    if (!booking_id || !rating) {
      return res.status(400).json({ error: 'Booking ID and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const b = await pool.query(
      `SELECT b.*, p.host_id FROM bookings b
       JOIN properties p ON p.id = b.property_id
       WHERE b.id = $1`,
      [booking_id]
    );
    const booking = b.rows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.host_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the host can review this guest' });
    }
    if (!['completed', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ error: 'You can only review completed or confirmed bookings' });
    }

    const existing = await pool.query(
      'SELECT id FROM host_reviews WHERE booking_id = $1',
      [booking_id]
    );
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'You have already reviewed this guest' });
    }

    const result = await pool.query(
      `INSERT INTO host_reviews (booking_id, host_id, guest_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [booking_id, req.user.id, booking.guest_id, rating, comment || null]
    );

    await createNotification({
      user_id: booking.guest_id,
      type: 'host_review',
      title: 'You received a review',
      message: `Your host left you a ${rating}-star review.`,
      link: `/users/${booking.guest_id}`,
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getGuestReviews = async (req, res, next) => {
  try {
    const { guestId } = req.params;
    const result = await pool.query(
      `SELECT hr.*,
         u.first_name as host_first_name, u.last_name as host_last_name, u.avatar_url as host_avatar,
         p.title as property_title
       FROM host_reviews hr
       JOIN users u ON u.id = hr.host_id
       JOIN bookings b ON b.id = hr.booking_id
       JOIN properties p ON p.id = b.property_id
       WHERE hr.guest_id = $1
       ORDER BY hr.created_at DESC`,
      [guestId]
    );

    const summary = await pool.query(
      'SELECT COUNT(*) as count, ROUND(AVG(rating), 1) as avg_rating FROM host_reviews WHERE guest_id = $1',
      [guestId]
    );

    res.json({
      reviews: result.rows,
      total: parseInt(summary.rows[0].count),
      avg_rating: parseFloat(summary.rows[0].avg_rating) || 0,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createHostReview, getGuestReviews };
