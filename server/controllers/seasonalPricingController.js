const pool = require('../config/db');

const assertHostOwnsProperty = async (propertyId, userId, userRole) => {
  const result = await pool.query(
    'SELECT host_id FROM properties WHERE id = $1',
    [propertyId]
  );
  if (!result.rows[0]) return { error: { status: 404, message: 'Property not found' } };
  if (result.rows[0].host_id !== userId && userRole !== 'admin') {
    return { error: { status: 403, message: 'Not authorized to manage this property' } };
  }
  return { ok: true };
};

const listForProperty = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const result = await pool.query(
      `SELECT * FROM seasonal_pricing
       WHERE property_id = $1
       ORDER BY start_date ASC`,
      [propertyId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const createSeasonalPrice = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { name, start_date, end_date, price_per_night } = req.body;

    if (!name || !start_date || !end_date || price_per_night == null) {
      return res.status(400).json({ error: 'name, start_date, end_date, and price_per_night are required' });
    }
    const price = parseFloat(price_per_night);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'price_per_night must be a positive number' });
    }
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'end_date must be on or after start_date' });
    }

    const auth = await assertHostOwnsProperty(propertyId, req.user.id, req.user.role);
    if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

    // Disallow overlapping ranges for the same property
    const overlap = await pool.query(
      `SELECT id FROM seasonal_pricing
       WHERE property_id = $1
         AND start_date <= $3 AND end_date >= $2`,
      [propertyId, start_date, end_date]
    );
    if (overlap.rows.length > 0) {
      return res.status(409).json({ error: 'This range overlaps an existing seasonal rate' });
    }

    const result = await pool.query(
      `INSERT INTO seasonal_pricing (property_id, name, start_date, end_date, price_per_night)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [propertyId, name.slice(0, 100), start_date, end_date, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteSeasonalPrice = async (req, res, next) => {
  try {
    const { propertyId, id } = req.params;
    const auth = await assertHostOwnsProperty(propertyId, req.user.id, req.user.role);
    if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

    const result = await pool.query(
      'DELETE FROM seasonal_pricing WHERE id = $1 AND property_id = $2 RETURNING id',
      [id, propertyId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Seasonal rate not found' });
    res.json({ message: 'Seasonal rate removed' });
  } catch (err) {
    next(err);
  }
};

// Public price calculation: compute total for a stay using seasonal overrides
const calculatePrice = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { check_in, check_out } = req.query;
    if (!check_in || !check_out) {
      return res.status(400).json({ error: 'check_in and check_out are required' });
    }

    const propertyRes = await pool.query(
      'SELECT price_per_night FROM properties WHERE id = $1',
      [propertyId]
    );
    if (!propertyRes.rows[0]) return res.status(404).json({ error: 'Property not found' });
    const basePrice = parseFloat(propertyRes.rows[0].price_per_night);

    const seasonalRes = await pool.query(
      `SELECT start_date, end_date, price_per_night, name
       FROM seasonal_pricing
       WHERE property_id = $1
         AND start_date <= $3 AND end_date >= $2`,
      [propertyId, check_in, check_out]
    );
    const ranges = seasonalRes.rows;

    const start = new Date(check_in);
    const end = new Date(check_out);
    let total = 0;
    const breakdown = [];

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dayStr = d.toISOString().slice(0, 10);
      const match = ranges.find(r =>
        dayStr >= r.start_date.toISOString().slice(0, 10) &&
        dayStr <= r.end_date.toISOString().slice(0, 10)
      );
      const nightPrice = match ? parseFloat(match.price_per_night) : basePrice;
      total += nightPrice;
      breakdown.push({
        date: dayStr,
        price: nightPrice,
        seasonal: !!match,
        season_name: match ? match.name : null,
      });
    }

    res.json({
      base_price: basePrice,
      nights: breakdown.length,
      total: +total.toFixed(2),
      breakdown,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listForProperty,
  createSeasonalPrice,
  deleteSeasonalPrice,
  calculatePrice,
};
