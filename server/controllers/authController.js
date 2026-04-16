const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, role, phone } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const allowedRoles = ['guest', 'host'];
    const userRole = allowedRoles.includes(role) ? role : 'guest';

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, avatar_url, phone, created_at`,
      [email.toLowerCase(), password_hash, first_name, last_name, userRole, phone || null]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register };
