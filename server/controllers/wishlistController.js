const pool = require('../config/db');

const listWishlists = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT w.*,
         COUNT(wi.id)::int as item_count
       FROM wishlists w
       LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
       WHERE w.user_id = $1
       GROUP BY w.id
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const createWishlist = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Wishlist name is required' });
    }
    const result = await pool.query(
      'INSERT INTO wishlists (user_id, name) VALUES ($1, $2) RETURNING *',
      [req.user.id, name.trim().slice(0, 100)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const renameWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Wishlist name is required' });
    }
    const result = await pool.query(
      'UPDATE wishlists SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [name.trim().slice(0, 100), id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Wishlist not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM wishlists WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Wishlist not found' });
    res.json({ message: 'Wishlist deleted' });
  } catch (err) {
    next(err);
  }
};

const getWishlistDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const owner = await pool.query(
      'SELECT * FROM wishlists WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!owner.rows[0]) return res.status(404).json({ error: 'Wishlist not found' });

    const items = await pool.query(
      `SELECT wi.id as item_id, wi.added_at,
         p.id, p.title, p.city, p.country, p.price_per_night,
         COALESCE(
           (SELECT url FROM property_photos WHERE property_id = p.id AND is_primary = TRUE LIMIT 1),
           (SELECT url FROM property_photos WHERE property_id = p.id ORDER BY display_order LIMIT 1)
         ) as primary_photo,
         ROUND(AVG(r.rating), 1) as avg_rating,
         COUNT(DISTINCT r.id)::int as review_count
       FROM wishlist_items wi
       JOIN properties p ON p.id = wi.property_id
       LEFT JOIN reviews r ON r.property_id = p.id
       WHERE wi.wishlist_id = $1
       GROUP BY wi.id, wi.added_at, p.id
       ORDER BY wi.added_at DESC`,
      [id]
    );
    res.json({ wishlist: owner.rows[0], items: items.rows });
  } catch (err) {
    next(err);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { property_id } = req.body;
    if (!property_id) return res.status(400).json({ error: 'property_id is required' });

    const owner = await pool.query(
      'SELECT id FROM wishlists WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!owner.rows[0]) return res.status(404).json({ error: 'Wishlist not found' });

    const property = await pool.query(
      "SELECT id FROM properties WHERE id = $1 AND status = 'active'",
      [property_id]
    );
    if (!property.rows[0]) return res.status(404).json({ error: 'Property not found' });

    try {
      const result = await pool.query(
        'INSERT INTO wishlist_items (wishlist_id, property_id) VALUES ($1, $2) RETURNING *',
        [id, property_id]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Property already in this wishlist' });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const result = await pool.query(
      `DELETE FROM wishlist_items wi
       USING wishlists w
       WHERE wi.wishlist_id = w.id
         AND wi.id = $1 AND w.id = $2 AND w.user_id = $3
       RETURNING wi.id`,
      [itemId, id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    next(err);
  }
};

// Returns which of the user's wishlists already contain this property
const propertySaveStatus = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const result = await pool.query(
      `SELECT w.id, w.name,
         EXISTS (
           SELECT 1 FROM wishlist_items wi
           WHERE wi.wishlist_id = w.id AND wi.property_id = $2
         ) as saved
       FROM wishlists w
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id, propertyId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listWishlists,
  createWishlist,
  renameWishlist,
  deleteWishlist,
  getWishlistDetail,
  addItem,
  removeItem,
  propertySaveStatus,
};
