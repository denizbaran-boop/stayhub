const pool = require('../config/db');

const createPromotion = async (req, res, next) => {
  try {
    const {
      property_id, code, description, discount_type,
      discount_value, max_uses, valid_from, valid_until
    } = req.body;

    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ error: 'Code, discount type, and discount value are required' });
    }

    if (!['percentage', 'fixed'].includes(discount_type)) {
      return res.status(400).json({ error: 'Discount type must be percentage or fixed' });
    }

    if (discount_type === 'percentage' && (discount_value <= 0 || discount_value > 100)) {
      return res.status(400).json({ error: 'Percentage discount must be between 1 and 100' });
    }

    if (discount_type === 'fixed' && discount_value <= 0) {
      return res.status(400).json({ error: 'Fixed discount must be greater than 0' });
    }

    // Verify property belongs to this host if property_id is provided
    if (property_id) {
      const check = await pool.query(
        "SELECT id FROM properties WHERE id = $1 AND host_id = $2 AND status != 'deleted'",
        [property_id, req.user.id]
      );
      if (!check.rows[0]) {
        return res.status(404).json({ error: 'Property not found or not owned by you' });
      }
    }

    const result = await pool.query(
      `INSERT INTO promotions
       (host_id, property_id, code, description, discount_type, discount_value, max_uses, valid_from, valid_until)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.user.id, property_id || null, code.toUpperCase(), description || null,
        discount_type, discount_value,
        max_uses || null, valid_from || null, valid_until || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Promotion code already exists' });
    }
    next(err);
  }
};

const getHostPromotions = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT pr.*, p.title as property_title
       FROM promotions pr
       LEFT JOIN properties p ON p.id = pr.property_id
       WHERE pr.host_id = $1
       ORDER BY pr.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const validatePromotion = async (req, res, next) => {
  try {
    const { code, property_id, total_price } = req.body;

    if (!code || !property_id || !total_price) {
      return res.status(400).json({ error: 'Code, property ID, and total price are required' });
    }

    const result = await pool.query(
      `SELECT * FROM promotions
       WHERE code = $1
       AND is_active = TRUE
       AND (property_id IS NULL OR property_id = $2)
       AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
       AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
       AND (max_uses IS NULL OR uses_count < max_uses)`,
      [code.toUpperCase(), property_id]
    );

    if (!result.rows[0]) {
      return res.status(400).json({ error: 'Invalid or expired promotion code' });
    }

    const promo = result.rows[0];
    let discount_amount = 0;

    if (promo.discount_type === 'percentage') {
      discount_amount = parseFloat(total_price) * (parseFloat(promo.discount_value) / 100);
    } else {
      discount_amount = Math.min(parseFloat(promo.discount_value), parseFloat(total_price));
    }

    const final_price = parseFloat(total_price) - discount_amount;

    res.json({
      valid: true,
      promo: {
        id: promo.id,
        code: promo.code,
        description: promo.description,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
      },
      discount_amount: parseFloat(discount_amount.toFixed(2)),
      final_price: parseFloat(final_price.toFixed(2)),
    });
  } catch (err) {
    next(err);
  }
};

const updatePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active, valid_until, max_uses, description } = req.body;

    const check = await pool.query(
      'SELECT id FROM promotions WHERE id = $1 AND host_id = $2',
      [id, req.user.id]
    );

    if (!check.rows[0]) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    const result = await pool.query(
      `UPDATE promotions
       SET is_active = COALESCE($1, is_active),
           valid_until = COALESCE($2, valid_until),
           max_uses = COALESCE($3, max_uses),
           description = COALESCE($4, description)
       WHERE id = $5
       RETURNING *`,
      [is_active, valid_until, max_uses, description, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deletePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const check = await pool.query(
      'SELECT id FROM promotions WHERE id = $1 AND host_id = $2',
      [id, req.user.id]
    );

    if (!check.rows[0]) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    await pool.query(
      'UPDATE promotions SET is_active = FALSE WHERE id = $1',
      [id]
    );

    res.json({ message: 'Promotion deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPromotion, getHostPromotions, validatePromotion, updatePromotion, deletePromotion };
