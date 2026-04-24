const pool = require('../config/db');

const search = async (req, res, next) => {
  try {
    const {
      location,
      check_in,
      check_out,
      guests,
      min_price,
      max_price,
      property_type,
      amenities,
      bedrooms,
      featured,
      // Map viewport bounds (for "search as map moves")
      ne_lat, ne_lng, sw_lat, sw_lng,
      page = 1,
      limit = 20,
      sort = 'relevance',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let paramIdx = 1;

    let whereClause = `WHERE p.status = 'active'`;

    if (location) {
      params.push(`%${location.toLowerCase()}%`);
      whereClause += ` AND (LOWER(p.city) LIKE $${paramIdx} OR LOWER(p.country) LIKE $${paramIdx} OR LOWER(p.address) LIKE $${paramIdx})`;
      paramIdx++;
    }

    if (guests) {
      params.push(parseInt(guests));
      whereClause += ` AND p.max_guests >= $${paramIdx}`;
      paramIdx++;
    }

    if (min_price) {
      params.push(parseFloat(min_price));
      whereClause += ` AND p.price_per_night >= $${paramIdx}`;
      paramIdx++;
    }

    if (max_price) {
      params.push(parseFloat(max_price));
      whereClause += ` AND p.price_per_night <= $${paramIdx}`;
      paramIdx++;
    }

    if (property_type) {
      const types = property_type.split(',').map(t => t.trim());
      params.push(types);
      whereClause += ` AND p.property_type = ANY($${paramIdx}::varchar[])`;
      paramIdx++;
    }

    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim());
      params.push(amenityList);
      whereClause += ` AND p.amenities @> $${paramIdx}::text[]`;
      paramIdx++;
    }

    if (bedrooms) {
      params.push(parseInt(bedrooms));
      whereClause += ` AND p.bedrooms >= $${paramIdx}`;
      paramIdx++;
    }

    if (featured === 'true') {
      whereClause += ` AND p.is_featured = TRUE`;
    }

    // Map viewport bounding box
    if (ne_lat && ne_lng && sw_lat && sw_lng) {
      params.push(parseFloat(sw_lat));
      params.push(parseFloat(ne_lat));
      params.push(parseFloat(sw_lng));
      params.push(parseFloat(ne_lng));
      whereClause += ` AND p.latitude BETWEEN $${paramIdx} AND $${paramIdx + 1}
                       AND p.longitude BETWEEN $${paramIdx + 2} AND $${paramIdx + 3}`;
      paramIdx += 4;
    }

    // Exclude properties with overlapping bookings
    if (check_in && check_out) {
      params.push(check_in);
      params.push(check_out);
      whereClause += ` AND p.id NOT IN (
        SELECT DISTINCT property_id FROM bookings
        WHERE status IN ('confirmed', 'pending')
        AND check_in < $${paramIdx + 1}
        AND check_out > $${paramIdx}
      )`;
      paramIdx += 2;
    }

    let orderClause = 'ORDER BY p.created_at DESC';
    if (sort === 'price_asc') orderClause = 'ORDER BY p.price_per_night ASC';
    else if (sort === 'price_desc') orderClause = 'ORDER BY p.price_per_night DESC';
    else if (sort === 'rating') orderClause = 'ORDER BY avg_rating DESC NULLS LAST';

    const query = `
      SELECT p.*,
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
      ${whereClause}
      GROUP BY p.id, u.first_name, u.last_name
      ${orderClause}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Count query (without LIMIT/OFFSET)
    const countParams = params.slice(0, -2);
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM properties p
      LEFT JOIN users u ON u.id = p.host_id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      properties: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { search };
