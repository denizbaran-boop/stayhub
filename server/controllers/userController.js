const pool = require('../config/db');

// Public profile — viewable by any authenticated or anonymous user
const getPublicProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      `SELECT id, first_name, last_name, role, avatar_url, created_at
       FROM users WHERE id = $1 AND is_active = TRUE`,
      [id]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const payload = { user };

    if (user.role === 'host' || user.role === 'admin') {
      const propertiesResult = await pool.query(
        `SELECT p.id, p.title, p.city, p.country, p.price_per_night, p.property_type,
           COALESCE(
             (SELECT url FROM property_photos WHERE property_id = p.id AND is_primary = TRUE LIMIT 1),
             (SELECT url FROM property_photos WHERE property_id = p.id ORDER BY display_order LIMIT 1)
           ) as primary_photo,
           ROUND(AVG(r.rating), 1) as avg_rating,
           COUNT(DISTINCT r.id) as review_count
         FROM properties p
         LEFT JOIN reviews r ON r.property_id = p.id
         WHERE p.host_id = $1 AND p.status = 'active'
         GROUP BY p.id
         ORDER BY p.created_at DESC`,
        [id]
      );
      payload.properties = propertiesResult.rows;

      const ratingResult = await pool.query(
        `SELECT ROUND(AVG(r.rating), 1) as avg_rating, COUNT(r.id) as review_count
         FROM reviews r
         JOIN properties p ON p.id = r.property_id
         WHERE p.host_id = $1`,
        [id]
      );
      payload.host_rating = {
        avg_rating: parseFloat(ratingResult.rows[0].avg_rating) || 0,
        review_count: parseInt(ratingResult.rows[0].review_count),
      };
    }

    if (user.role === 'guest' || user.role === 'admin') {
      const bookingsResult = await pool.query(
        `SELECT COUNT(*) FILTER (WHERE status = 'completed') as completed_stays,
           COUNT(*) FILTER (WHERE status IN ('pending','confirmed')) as upcoming_stays
         FROM bookings WHERE guest_id = $1`,
        [id]
      );
      payload.guest_stats = {
        completed_stays: parseInt(bookingsResult.rows[0].completed_stays),
        upcoming_stays: parseInt(bookingsResult.rows[0].upcoming_stays),
      };

      const guestReviewSummary = await pool.query(
        'SELECT COUNT(*) as count, ROUND(AVG(rating), 1) as avg_rating FROM host_reviews WHERE guest_id = $1',
        [id]
      );
      payload.guest_rating = {
        avg_rating: parseFloat(guestReviewSummary.rows[0].avg_rating) || 0,
        review_count: parseInt(guestReviewSummary.rows[0].count),
      };
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
};

module.exports = { getPublicProfile };
