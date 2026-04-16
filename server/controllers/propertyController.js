const pool = require('../config/db');

const getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*,
         u.first_name as host_first_name, u.last_name as host_last_name,
         u.avatar_url as host_avatar, u.created_at as host_joined,
         COALESCE(
           json_agg(
             json_build_object('id', pp.id, 'url', pp.url, 'caption', pp.caption,
               'is_primary', pp.is_primary, 'display_order', pp.display_order)
             ORDER BY pp.display_order
           ) FILTER (WHERE pp.id IS NOT NULL),
           '[]'
         ) as photos,
         ROUND(AVG(r.rating), 1) as avg_rating,
         COUNT(DISTINCT r.id) as review_count
       FROM properties p
       LEFT JOIN users u ON u.id = p.host_id
       LEFT JOIN property_photos pp ON pp.property_id = p.id
       LEFT JOIN reviews r ON r.property_id = p.id
       WHERE p.id = $1 AND p.status != 'deleted'
       GROUP BY p.id, u.first_name, u.last_name, u.avatar_url, u.created_at`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getPropertyPhotos = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM property_photos WHERE property_id = $1 ORDER BY display_order',
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getFeaturedProperties = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
         u.first_name as host_first_name, u.last_name as host_last_name,
         COALESCE(
           (SELECT url FROM property_photos WHERE property_id = p.id AND is_primary = TRUE LIMIT 1),
           (SELECT url FROM property_photos WHERE property_id = p.id ORDER BY display_order LIMIT 1)
         ) as primary_photo,
         ROUND(AVG(r.rating), 1) as avg_rating,
         COUNT(DISTINCT r.id) as review_count
       FROM properties p
       LEFT JOIN users u ON u.id = p.host_id
       LEFT JOIN reviews r ON r.property_id = p.id
       WHERE p.status = 'active'
       GROUP BY p.id, u.first_name, u.last_name
       ORDER BY avg_rating DESC NULLS LAST, p.created_at DESC
       LIMIT 12`
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPropertyById,
  getPropertyPhotos,
  getFeaturedProperties,
};
