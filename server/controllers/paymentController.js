const pool = require('../config/db');
const { createNotification } = require('../services/notifier');
const { bookingConfirmationEmail } = require('../services/mailer');

const COMMISSION_RATE = 0.10; // platform keeps 10%

// Luhn algorithm — just enough validation for demo
function luhnValid(number) {
  const digits = String(number).replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function brandFrom(number) {
  const s = String(number).replace(/\s+/g, '');
  if (/^4/.test(s)) return 'Visa';
  if (/^5[1-5]/.test(s)) return 'Mastercard';
  if (/^3[47]/.test(s)) return 'Amex';
  if (/^6/.test(s)) return 'Discover';
  return 'Card';
}

const processPayment = async (req, res, next) => {
  try {
    const {
      booking_id,
      cardholder_name,
      card_number,
      expiry_month,
      expiry_year,
      cvv,
    } = req.body;

    if (!booking_id || !cardholder_name || !card_number || !expiry_month || !expiry_year || !cvv) {
      return res.status(400).json({ error: 'All payment fields are required' });
    }

    const digits = String(card_number).replace(/\s+/g, '');
    if (!luhnValid(digits)) return res.status(400).json({ error: 'Invalid card number' });
    if (!/^\d{3,4}$/.test(String(cvv))) return res.status(400).json({ error: 'Invalid CVV' });
    const m = parseInt(expiry_month, 10);
    const y = parseInt(expiry_year, 10);
    if (!(m >= 1 && m <= 12)) return res.status(400).json({ error: 'Invalid expiry month' });
    const now = new Date();
    const fullY = y < 100 ? 2000 + y : y;
    const expiry = new Date(fullY, m, 0);
    if (expiry < now) return res.status(400).json({ error: 'Card has expired' });

    const bResult = await pool.query(
      `SELECT b.*, p.host_id, p.title as property_title,
         u.first_name as host_first_name, u.last_name as host_last_name,
         g.first_name as guest_first_name, g.last_name as guest_last_name, g.email as guest_email
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       JOIN users u ON u.id = p.host_id
       JOIN users g ON g.id = b.guest_id
       WHERE b.id = $1`,
      [booking_id]
    );
    const booking = bResult.rows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.guest_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ error: `Cannot pay for a ${booking.status} booking` });
    }

    const existing = await pool.query(
      "SELECT id FROM payments WHERE booking_id = $1 AND status = 'succeeded'",
      [booking_id]
    );
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'This booking has already been paid' });
    }

    const last4 = digits.slice(-4);
    const brand = brandFrom(digits);
    const amount = parseFloat(booking.final_price);
    const commission = +(amount * COMMISSION_RATE).toFixed(2);
    const hostAmount = +(amount - commission).toFixed(2);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const payResult = await client.query(
        `INSERT INTO payments (booking_id, amount, cardholder_name, card_last4, card_brand, status)
         VALUES ($1, $2, $3, $4, $5, 'succeeded')
         RETURNING *`,
        [booking_id, amount, cardholder_name, last4, brand]
      );

      // Auto-confirm booking on successful payment
      if (booking.status === 'pending') {
        await client.query(
          "UPDATE bookings SET status = 'confirmed', updated_at = NOW() WHERE id = $1",
          [booking_id]
        );
      }

      // Queue payout
      await client.query(
        `INSERT INTO payouts (host_id, booking_id, amount, commission, status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [booking.host_id, booking_id, hostAmount, commission]
      );

      // Notifications
      await createNotification({
        user_id: booking.guest_id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: `Your stay at ${booking.property_title} is confirmed.`,
        link: `/dashboard/guest`,
      }, client);

      await createNotification({
        user_id: booking.host_id,
        type: 'payment_received',
        title: 'Payment received',
        message: `You received a payment of $${hostAmount.toFixed(2)} for ${booking.property_title}.`,
        link: `/dashboard/host`,
      }, client);

      await client.query('COMMIT');

      // Send mock confirmation email (outside transaction)
      await bookingConfirmationEmail({
        guestEmail: booking.guest_email,
        guestName: `${booking.guest_first_name} ${booking.guest_last_name}`,
        hostName: `${booking.host_first_name} ${booking.host_last_name}`,
        propertyTitle: booking.property_title,
        bookingId: booking.id,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        totalPrice: amount,
      });

      res.status(201).json({
        payment: payResult.rows[0],
        booking_status: 'confirmed',
        message: 'Payment successful. Booking confirmed.',
      });
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

const getPaymentForBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const auth = await pool.query(
      `SELECT b.guest_id, p.host_id FROM bookings b
       JOIN properties p ON p.id = b.property_id WHERE b.id = $1`,
      [bookingId]
    );
    if (!auth.rows[0]) return res.status(404).json({ error: 'Booking not found' });
    const { guest_id, host_id } = auth.rows[0];
    if (req.user.id !== guest_id && req.user.id !== host_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const r = await pool.query(
      'SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC',
      [bookingId]
    );
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { processPayment, getPaymentForBooking };
