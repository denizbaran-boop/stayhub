const pool = require('../config/db');
const { createNotification } = require('../services/notifier');
const { bookingConfirmationEmail } = require('../services/mailer');

// Long-stay discount: 10% for 7+ nights, 20% for 30+ nights
function longStayDiscountRate(nights) {
  if (nights >= 30) return 0.20;
  if (nights >= 7) return 0.10;
  return 0;
}

const previewPrice = async (req, res, next) => {
  try {
    const { property_id, check_in, check_out, promotion_code } = req.body;
    if (!property_id || !check_in || !check_out) {
      return res.status(400).json({ error: 'property_id, check_in, and check_out are required' });
    }
    const p = await pool.query(
      "SELECT price_per_night FROM properties WHERE id = $1 AND status = 'active'",
      [property_id]
    );
    if (!p.rows[0]) return res.status(404).json({ error: 'Property not found' });

    const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / 86400000);
    if (nights <= 0) return res.status(400).json({ error: 'Check-out must be after check-in' });

    const perNight = parseFloat(p.rows[0].price_per_night);
    const subtotal = perNight * nights;
    const stayRate = longStayDiscountRate(nights);
    const stayDiscount = +(subtotal * stayRate).toFixed(2);

    let promoDiscount = 0;
    let promoInfo = null;
    if (promotion_code) {
      const promoRes = await pool.query(
        `SELECT * FROM promotions
         WHERE code = $1 AND is_active = TRUE
         AND (property_id IS NULL OR property_id = $2)
         AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
         AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
         AND (max_uses IS NULL OR uses_count < max_uses)`,
        [promotion_code.toUpperCase(), property_id]
      );
      if (promoRes.rows[0]) {
        const promo = promoRes.rows[0];
        if (promo.discount_type === 'percentage') {
          promoDiscount = +((subtotal - stayDiscount) * (parseFloat(promo.discount_value) / 100)).toFixed(2);
        } else {
          promoDiscount = Math.min(parseFloat(promo.discount_value), subtotal - stayDiscount);
        }
        promoInfo = { code: promo.code, discount_type: promo.discount_type, discount_value: promo.discount_value };
      }
    }

    const discount_amount = +(stayDiscount + promoDiscount).toFixed(2);
    const final_price = +(subtotal - discount_amount).toFixed(2);

    res.json({
      nights,
      per_night: perNight,
      subtotal: +subtotal.toFixed(2),
      long_stay_rate: stayRate,
      long_stay_discount: stayDiscount,
      promo_discount: promoDiscount,
      promo: promoInfo,
      discount_amount,
      final_price,
    });
  } catch (err) {
    next(err);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const { property_id, check_in, check_out, num_guests, promotion_code, special_requests } = req.body;

    if (!property_id || !check_in || !check_out || !num_guests) {
      return res.status(400).json({ error: 'Property, check-in, check-out, and number of guests are required' });
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ error: 'Check-out must be after check-in' });
    }

    if (checkInDate < new Date()) {
      return res.status(400).json({ error: 'Check-in date cannot be in the past' });
    }

    const propertyResult = await pool.query(
      "SELECT * FROM properties WHERE id = $1 AND status = 'active'",
      [property_id]
    );

    if (!propertyResult.rows[0]) {
      return res.status(404).json({ error: 'Property not found or not available' });
    }

    const property = propertyResult.rows[0];

    if (num_guests > property.max_guests) {
      return res.status(400).json({ error: `Property accommodates max ${property.max_guests} guests` });
    }

    if (property.host_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot book your own property' });
    }

    // Check for overlapping bookings
    const overlap = await pool.query(
      `SELECT id FROM bookings
       WHERE property_id = $1
       AND status IN ('confirmed', 'pending')
       AND check_in < $3 AND check_out > $2`,
      [property_id, check_in, check_out]
    );

    if (overlap.rows.length > 0) {
      return res.status(409).json({ error: 'Property is not available for the selected dates' });
    }

    // Calculate price
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const subtotal = parseFloat(property.price_per_night) * nights;

    // Long-stay discount (7+ nights 10%, 30+ nights 20%)
    const stayRate = longStayDiscountRate(nights);
    const stay_discount = +(subtotal * stayRate).toFixed(2);

    let promo_discount = 0;
    let promotion_id = null;

    // Apply promotion if provided
    if (promotion_code) {
      const promoResult = await pool.query(
        `SELECT * FROM promotions
         WHERE code = $1
         AND is_active = TRUE
         AND (property_id IS NULL OR property_id = $2)
         AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
         AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
         AND (max_uses IS NULL OR uses_count < max_uses)`,
        [promotion_code.toUpperCase(), property_id]
      );

      if (promoResult.rows[0]) {
        const promo = promoResult.rows[0];
        promotion_id = promo.id;
        const base = subtotal - stay_discount;
        if (promo.discount_type === 'percentage') {
          promo_discount = +(base * (parseFloat(promo.discount_value) / 100)).toFixed(2);
        } else {
          promo_discount = Math.min(parseFloat(promo.discount_value), base);
        }
      } else {
        return res.status(400).json({ error: 'Invalid or expired promotion code' });
      }
    }

    const total_price = subtotal;
    const discount_amount = +(stay_discount + promo_discount).toFixed(2);
    const final_price = +(total_price - discount_amount).toFixed(2);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const bookingResult = await client.query(
        `INSERT INTO bookings
         (property_id, guest_id, check_in, check_out, num_guests, total_price,
          discount_amount, final_price, promotion_id, special_requests)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [property_id, req.user.id, check_in, check_out, num_guests,
         total_price, discount_amount, final_price, promotion_id, special_requests || null]
      );

      if (promotion_id) {
        await client.query(
          'UPDATE promotions SET uses_count = uses_count + 1 WHERE id = $1',
          [promotion_id]
        );
      }

      await createNotification({
        user_id: property.host_id,
        type: 'booking_request',
        title: 'New booking request',
        message: `${req.user.first_name} ${req.user.last_name} requested to book ${property.title}.`,
        link: '/dashboard/host',
      }, client);

      await client.query('COMMIT');

      const booking = bookingResult.rows[0];

      // Fetch full booking details
      const fullBooking = await pool.query(
        `SELECT b.*,
           p.title as property_title, p.address as property_address, p.city as property_city,
           p.price_per_night,
           COALESCE(
             (SELECT url FROM property_photos WHERE property_id = p.id AND is_primary = TRUE LIMIT 1),
             (SELECT url FROM property_photos WHERE property_id = p.id ORDER BY display_order LIMIT 1)
           ) as property_photo,
           u.first_name as host_first_name, u.last_name as host_last_name
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
         JOIN users u ON u.id = p.host_id
         WHERE b.id = $1`,
        [booking.id]
      );

      res.status(201).json(fullBooking.rows[0]);
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

const getGuestBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.id];
    let statusFilter = '';

    if (status) {
      params.push(status);
      statusFilter = `AND b.status = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT b.*,
         p.title as property_title, p.address as property_address,
         p.city as property_city, p.country as property_country,
         p.price_per_night,
         COALESCE(
           (SELECT url FROM property_photos WHERE property_id = p.id AND is_primary = TRUE LIMIT 1),
           (SELECT url FROM property_photos WHERE property_id = p.id ORDER BY display_order LIMIT 1)
         ) as property_photo,
         u.first_name as host_first_name, u.last_name as host_last_name,
         r.id as review_id, r.rating as review_rating
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       JOIN users u ON u.id = p.host_id
       LEFT JOIN reviews r ON r.booking_id = b.id
       WHERE b.guest_id = $1 ${statusFilter}
       ORDER BY b.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getHostBookings = async (req, res, next) => {
  try {
    const { status, property_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.id];
    let filters = '';

    if (status) {
      params.push(status);
      filters += ` AND b.status = $${params.length}`;
    }

    if (property_id) {
      params.push(property_id);
      filters += ` AND b.property_id = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT b.*,
         p.title as property_title, p.city as property_city,
         COALESCE(
           (SELECT url FROM property_photos WHERE property_id = p.id AND is_primary = TRUE LIMIT 1),
           (SELECT url FROM property_photos WHERE property_id = p.id ORDER BY display_order LIMIT 1)
         ) as property_photo,
         g.first_name as guest_first_name, g.last_name as guest_last_name,
         g.email as guest_email, g.phone as guest_phone, g.avatar_url as guest_avatar,
         hr.id as host_review_id, hr.rating as host_review_rating
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       JOIN users g ON g.id = b.guest_id
       LEFT JOIN host_reviews hr ON hr.booking_id = b.id
       WHERE p.host_id = $1 ${filters}
       ORDER BY b.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT b.*,
         p.title as property_title, p.address as property_address,
         p.city as property_city, p.country as property_country,
         p.latitude, p.longitude, p.price_per_night,
         p.host_id,
         COALESCE(
           (SELECT url FROM property_photos WHERE property_id = p.id AND is_primary = TRUE LIMIT 1),
           (SELECT url FROM property_photos WHERE property_id = p.id ORDER BY display_order LIMIT 1)
         ) as property_photo,
         u.first_name as host_first_name, u.last_name as host_last_name,
         g.first_name as guest_first_name, g.last_name as guest_last_name, g.email as guest_email,
         pr.code as promo_code, pr.discount_type, pr.discount_value
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       JOIN users u ON u.id = p.host_id
       JOIN users g ON g.id = b.guest_id
       LEFT JOIN promotions pr ON pr.id = b.promotion_id
       WHERE b.id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = result.rows[0];

    // Check authorization: guest, host, or admin
    if (
      booking.guest_id !== req.user.id &&
      booking.host_id !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (err) {
    next(err);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['confirmed', 'rejected', 'cancelled', 'completed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const bookingResult = await pool.query(
      `SELECT b.*, p.host_id FROM bookings b
       JOIN properties p ON p.id = b.property_id
       WHERE b.id = $1`,
      [id]
    );

    if (!bookingResult.rows[0]) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Authorization checks
    if (status === 'confirmed' || status === 'rejected') {
      if (booking.host_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only the host can confirm or reject bookings' });
      }
      if (booking.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending bookings can be confirmed or rejected' });
      }
    }

    if (status === 'cancelled') {
      if (booking.guest_id !== req.user.id && booking.host_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to cancel this booking' });
      }
      if (!['pending', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({ error: 'Booking cannot be cancelled in its current state' });
      }
    }

    const client = await pool.connect();
    let result;
    try {
      await client.query('BEGIN');

      result = await client.query(
        'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, id]
      );

      // Side-effects on payments/payouts
      if (status === 'confirmed') {
        // Release held payouts (they become available to the host)
        await client.query(
          "UPDATE payouts SET status = 'pending' WHERE booking_id = $1 AND status = 'on_hold'",
          [id]
        );
      } else if (status === 'rejected' || status === 'cancelled') {
        // Refund any successful payment and cancel the held payout
        await client.query(
          "UPDATE payments SET status = 'refunded' WHERE booking_id = $1 AND status = 'succeeded'",
          [id]
        );
        await client.query(
          "DELETE FROM payouts WHERE booking_id = $1 AND status = 'on_hold'",
          [id]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // Notify the counterparty
    const titles = {
      confirmed: 'Booking confirmed',
      rejected: 'Booking declined',
      cancelled: 'Booking cancelled',
      completed: 'Stay completed',
    };
    const recipient = status === 'confirmed' || status === 'rejected'
      ? booking.guest_id
      : (req.user.id === booking.guest_id ? booking.host_id : booking.guest_id);
    await createNotification({
      user_id: recipient,
      type: `booking_${status}`,
      title: titles[status] || 'Booking updated',
      message: `Booking #${id.slice(0, 8)} is now ${status}.`,
      link: recipient === booking.host_id ? '/dashboard/host' : '/dashboard/guest',
    });

    // Confirmation email on approval
    if (status === 'confirmed') {
      try {
        const details = await pool.query(
          `SELECT g.email as guest_email, g.first_name as g_first, g.last_name as g_last,
             h.first_name as h_first, h.last_name as h_last,
             p.title as property_title
           FROM bookings b
           JOIN users g ON g.id = b.guest_id
           JOIN properties p ON p.id = b.property_id
           JOIN users h ON h.id = p.host_id
           WHERE b.id = $1`,
          [id]
        );
        const d = details.rows[0];
        if (d) {
          await bookingConfirmationEmail({
            guestEmail: d.guest_email,
            guestName: `${d.g_first} ${d.g_last}`,
            hostName: `${d.h_first} ${d.h_last}`,
            propertyTitle: d.property_title,
            bookingId: id,
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            totalPrice: booking.final_price,
          });
        }
      } catch (err) {
        console.error('[booking] confirmation email failed:', err.message);
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  req.body.status = 'cancelled';
  return updateBookingStatus(req, res, next);
};

module.exports = {
  createBooking,
  getGuestBookings,
  getHostBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  previewPrice,
};
