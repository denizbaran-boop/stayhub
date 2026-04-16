const pool = require('../config/db');

const createReview = async (req, res, next) => {
  try {
    const { booking_id, rating, comment } = req.body;

    if (!booking_id || !rating) {
      return res.status(400).json({ error: 'Booking ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify the booking belongs to this guest and is completed or confirmed
    const bookingResult = await pool.query(
      `SELECT b.*, p.id as property_id FROM bookings b
       JOIN properties p ON p.id = b.property_id
       WHERE b.id = $1 AND b.guest_id = $2`,
      [booking_id, req.user.id]
    );

    if (!bookingResult.rows[0]) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    if (!['completed', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ error: 'You can only review completed or confirmed bookings' });
    }

    // Check if review already exists for this booking
    const existing = await pool.query(
      'SELECT id FROM reviews WHERE booking_id = $1',
      [booking_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this booking' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (booking_id, property_id, guest_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [booking_id, booking.property_id, req.user.id, rating, comment || null]
    );

    const review = result.rows[0];

    // Fetch with user info
    const fullReview = await pool.query(
      `SELECT r.*, u.first_name, u.last_name, u.avatar_url
       FROM reviews r
       JOIN users u ON u.id = r.guest_id
       WHERE r.id = $1`,
      [review.id]
    );

    res.status(201).json(fullReview.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getPropertyReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT r.*, u.first_name, u.last_name, u.avatar_url
       FROM reviews r
       JOIN users u ON u.id = r.guest_id
       WHERE r.property_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*), ROUND(AVG(rating), 1) as avg_rating FROM reviews WHERE property_id = $1',
      [id]
    );

    res.json({
      reviews: result.rows,
      total: parseInt(countResult.rows[0].count),
      avg_rating: parseFloat(countResult.rows[0].avg_rating) || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
};

const getUserReviews = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT r.*, p.title as property_title, p.city as property_city,
         COALESCE(
           (SELECT url FROM property_photos WHERE property_id = p.id AND is_primary = TRUE LIMIT 1),
           (SELECT url FROM property_photos WHERE property_id = p.id ORDER BY display_order LIMIT 1)
         ) as property_photo
       FROM reviews r
       JOIN properties p ON p.id = r.property_id
       WHERE r.guest_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { createReview, getPropertyReviews, getUserReviews };
