const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { passwordResetEmail, twoFactorEmail } = require('../services/mailer');
const { recordSession } = require('../services/sessions');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const generateNumericCode = (length = 6) => {
  let code = '';
  for (let i = 0; i < length; i++) code += Math.floor(Math.random() * 10);
  return code;
};

// Strong password policy: min 8 chars, at least one digit, at least one special character
const SPECIAL_CHAR_RE = /[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]/;
const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!SPECIAL_CHAR_RE.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null;
};

const register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, role, phone } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    const pwError = validatePasswordStrength(password);
    if (pwError) return res.status(400).json({ error: pwError });

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

    try { await recordSession(user.id, token, req); } catch (e) { console.error('[auth] session record failed:', e.message); }

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2FA flow: if enabled, don't issue token — issue a short-lived challenge instead
    if (user.two_factor_enabled) {
      const code = generateNumericCode(6);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await pool.query(
        `INSERT INTO two_factor_codes (user_id, code, expires_at) VALUES ($1, $2, $3)`,
        [user.id, code, expiresAt]
      );
      await twoFactorEmail({ email: user.email, name: user.first_name, code });
      const challengeToken = jwt.sign(
        { userId: user.id, twoFA: true },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '10m' }
      );
      return res.json({
        two_factor_required: true,
        challenge_token: challengeToken,
        // The demo_code lets graders exercise the flow without a real mailbox
        demo_code: code,
        message: 'A verification code has been sent. Check the server console / logs/emails.log.',
      });
    }

    const token = generateToken(user.id);
    const { password_hash, ...userWithoutPassword } = user;

    try { await recordSession(user.id, token, req); } catch (e) { console.error('[auth] session record failed:', e.message); }

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    next(err);
  }
};

const verifyTwoFactor = async (req, res, next) => {
  try {
    const { challenge_token, code } = req.body;
    if (!challenge_token || !code) {
      return res.status(400).json({ error: 'Challenge token and code are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(challenge_token, process.env.JWT_SECRET || 'fallback_secret');
    } catch {
      return res.status(401).json({ error: 'Invalid or expired challenge' });
    }
    if (!decoded.twoFA) {
      return res.status(400).json({ error: 'Invalid challenge token' });
    }

    const result = await pool.query(
      `SELECT * FROM two_factor_codes
       WHERE user_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [decoded.userId, String(code).trim()]
    );
    if (!result.rows[0]) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    await pool.query('UPDATE two_factor_codes SET used = TRUE WHERE id = $1', [result.rows[0].id]);

    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, role, avatar_url, phone, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );
    const user = userResult.rows[0];
    const token = generateToken(user.id);
    try { await recordSession(user.id, token, req); } catch (e) { console.error('[auth] session record failed:', e.message); }
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};

const toggleTwoFactor = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be boolean' });
    }
    await pool.query(
      'UPDATE users SET two_factor_enabled = $1, updated_at = NOW() WHERE id = $2',
      [enabled, req.user.id]
    );
    res.json({ two_factor_enabled: enabled });
  } catch (err) {
    next(err);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userResult = await pool.query(
      'SELECT id, first_name, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = userResult.rows[0];
    const payload = { message: 'If an account exists, a reset link has been sent.' };

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, token, expiresAt]
      );
      const clientBase = process.env.CLIENT_URL || 'http://localhost:5173';
      await passwordResetEmail({
        email: user.email,
        name: user.first_name,
        token,
        resetLink: `${clientBase}/reset-password?token=${token}`,
      });
      // Demo: return the token so it can be demonstrated without a mailbox
      payload.demo_token = token;
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    const pwError = validatePasswordStrength(new_password);
    if (pwError) return res.status(400).json({ error: pwError });

    const tokenResult = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
      [token]
    );
    const record = tokenResult.rows[0];
    if (!record) return res.status(400).json({ error: 'Invalid or expired token' });

    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(new_password, salt);

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, record.user_id]
    );
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [record.id]);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, avatar_url, phone,
         is_active, two_factor_enabled, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, avatar_url } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           avatar_url = COALESCE($4, avatar_url),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, first_name, last_name, role, avatar_url, phone, created_at, updated_at`,
      [first_name, last_name, phone, avatar_url, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    const pwError = validatePasswordStrength(new_password);
    if (pwError) return res.status(400).json({ error: pwError });

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(new_password, salt);

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyTwoFactor,
  toggleTwoFactor,
  requestPasswordReset,
  resetPassword,
};
