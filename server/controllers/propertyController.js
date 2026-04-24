const pool = require('../config/db');

const createProperty = async (req, res, next) => {
  try {
    const {
      title, description, property_type, address, city, country,
      latitude, longitude, price_per_night, max_guests, bedrooms,
      bathrooms, amenities, photos
    } = req.body;

    if (!title || !address || !city || !country || !price_per_night || !max_guests) {
      return res.status(400).json({ error: 'Title, address, city, country, price, and max guests are required' });
    }

    if (price_per_night <= 0) {
      return res.status(400).json({ error: 'Price must be greater than 0' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO properties
         (host_id, title, description, property_type, address, city, country,
          latitude, longitude, price_per_night, max_guests, bedrooms, bathrooms, amenities)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [
          req.user.id, title, description,
          property_type || 'apartment', address, city, country,
          latitude || null, longitude || null,
          price_per_night, max_guests,
          bedrooms || 1, bathrooms || 1,
          amenities || []
        ]
      );

      const property = result.rows[0];

      if (photos && photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          await client.query(
            `INSERT INTO property_photos (property_id, url, caption, is_primary, display_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [property.id, photo.url, photo.caption || null, i === 0, i]
          );
        }
      }

      await client.query('COMMIT');

      const propertyWithPhotos = await pool.query(
        `SELECT p.*, array_agg(
           json_build_object('id', pp.id, 'url', pp.url, 'caption', pp.caption, 'is_primary', pp.is_primary, 'display_order', pp.display_order)
           ORDER BY pp.display_order
         ) FILTER (WHERE pp.id IS NOT NULL) as photos
         FROM properties p
         LEFT JOIN property_photos pp ON pp.property_id = p.id
         WHERE p.id = $1
         GROUP BY p.id`,
        [property.id]
      );

      res.status(201).json(propertyWithPhotos.rows[0]);
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

const getProperties = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT p.*,
         COALESCE(
           json_agg(
             json_build_object('id', pp.id, 'url', pp.url, 'is_primary', pp.is_primary)
             ORDER BY pp.display_order
           ) FILTER (WHERE pp.id IS NOT NULL),
           '[]'
         ) as photos,
         ROUND(AVG(r.rating), 1) as avg_rating,
         COUNT(DISTINCT r.id) as review_count,
         COUNT(DISTINCT b.id) FILTER (WHERE b.status IN ('confirmed','pending')) as active_bookings
       FROM properties p
       LEFT JOIN property_photos pp ON pp.property_id = p.id
       LEFT JOIN reviews r ON r.property_id = p.id
       LEFT JOIN bookings b ON b.property_id = p.id
       WHERE p.host_id = $1 AND p.status != 'deleted'
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM properties WHERE host_id = $1 AND status != $2',
      [req.user.id, 'deleted']
    );

    res.json({
      properties: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
};

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

const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title, description, property_type, address, city, country,
      latitude, longitude, price_per_night, max_guests, bedrooms,
      bathrooms, amenities, status, is_featured,
    } = req.body;

    const check = await pool.query(
      'SELECT host_id FROM properties WHERE id = $1 AND status != $2',
      [id, 'deleted']
    );

    if (!check.rows[0]) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (check.rows[0].host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this property' });
    }

    // Only admins may change is_featured
    const featuredValue = req.user.role === 'admin' ? is_featured : undefined;

    const result = await pool.query(
      `UPDATE properties
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           property_type = COALESCE($3, property_type),
           address = COALESCE($4, address),
           city = COALESCE($5, city),
           country = COALESCE($6, country),
           latitude = COALESCE($7, latitude),
           longitude = COALESCE($8, longitude),
           price_per_night = COALESCE($9, price_per_night),
           max_guests = COALESCE($10, max_guests),
           bedrooms = COALESCE($11, bedrooms),
           bathrooms = COALESCE($12, bathrooms),
           amenities = COALESCE($13, amenities),
           status = COALESCE($14, status),
           is_featured = COALESCE($15, is_featured),
           updated_at = NOW()
       WHERE id = $16
       RETURNING *`,
      [title, description, property_type, address, city, country,
       latitude, longitude, price_per_night, max_guests, bedrooms,
       bathrooms, amenities, status, featuredValue, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;

    const check = await pool.query(
      'SELECT host_id FROM properties WHERE id = $1 AND status != $2',
      [id, 'deleted']
    );

    if (!check.rows[0]) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (check.rows[0].host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this property' });
    }

    await pool.query(
      "UPDATE properties SET status = 'deleted', updated_at = NOW() WHERE id = $1",
      [id]
    );

    res.json({ message: 'Property deleted successfully' });
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

const addPropertyPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { url, caption, is_primary } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Photo URL is required' });
    }

    const check = await pool.query(
      'SELECT host_id FROM properties WHERE id = $1 AND status != $2',
      [id, 'deleted']
    );

    if (!check.rows[0]) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (check.rows[0].host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const orderResult = await pool.query(
      'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM property_photos WHERE property_id = $1',
      [id]
    );
    const display_order = orderResult.rows[0].next_order;

    if (is_primary) {
      await pool.query(
        'UPDATE property_photos SET is_primary = FALSE WHERE property_id = $1',
        [id]
      );
    }

    const result = await pool.query(
      `INSERT INTO property_photos (property_id, url, caption, is_primary, display_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, url, caption || null, is_primary || false, display_order]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deletePropertyPhoto = async (req, res, next) => {
  try {
    const { id, photoId } = req.params;

    const check = await pool.query(
      'SELECT p.host_id FROM properties p JOIN property_photos pp ON pp.property_id = p.id WHERE pp.id = $1 AND pp.property_id = $2',
      [photoId, id]
    );

    if (!check.rows[0]) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (check.rows[0].host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query('DELETE FROM property_photos WHERE id = $1', [photoId]);

    res.json({ message: 'Photo deleted successfully' });
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
       ORDER BY p.is_featured DESC, avg_rating DESC NULLS LAST, p.created_at DESC
       LIMIT 12`
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getPropertyPhotos,
  addPropertyPhoto,
  deletePropertyPhoto,
  getFeaturedProperties,
};
