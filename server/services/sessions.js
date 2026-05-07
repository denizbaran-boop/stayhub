const crypto = require('crypto');
const pool = require('../config/db');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Best-effort device label from the user agent string.
const deviceLabelFor = (ua = '') => {
  const s = ua.toLowerCase();
  let device = 'Unknown device';
  if (/iphone/.test(s)) device = 'iPhone';
  else if (/ipad/.test(s)) device = 'iPad';
  else if (/android/.test(s)) device = 'Android';
  else if (/macintosh|mac os x/.test(s)) device = 'Mac';
  else if (/windows/.test(s)) device = 'Windows';
  else if (/linux/.test(s)) device = 'Linux';

  let browser = '';
  if (/edg\//.test(s)) browser = 'Edge';
  else if (/chrome\//.test(s) && !/chromium/.test(s)) browser = 'Chrome';
  else if (/safari\//.test(s) && !/chrome\//.test(s)) browser = 'Safari';
  else if (/firefox\//.test(s)) browser = 'Firefox';
  return browser ? `${device} · ${browser}` : device;
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || '';
};

const recordSession = async (userId, token, req) => {
  const tokenHash = hashToken(token);
  const userAgent = req.headers['user-agent'] || '';
  const ip = getClientIp(req);
  const label = deviceLabelFor(userAgent);
  await pool.query(
    `INSERT INTO user_sessions (user_id, token_hash, user_agent, ip_address, device_label)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (token_hash) DO UPDATE
       SET last_active_at = NOW(), revoked = FALSE`,
    [userId, tokenHash, userAgent.slice(0, 500), ip.slice(0, 64), label.slice(0, 120)]
  );
};

const touchSession = async (token) => {
  if (!token) return;
  const tokenHash = hashToken(token);
  // Don't fail the request on session bookkeeping errors
  try {
    await pool.query(
      `UPDATE user_sessions SET last_active_at = NOW()
       WHERE token_hash = $1 AND revoked = FALSE`,
      [tokenHash]
    );
  } catch (err) {
    console.error('[sessions] touch failed:', err.message);
  }
};

const isRevoked = async (token) => {
  if (!token) return false;
  const tokenHash = hashToken(token);
  const result = await pool.query(
    'SELECT revoked FROM user_sessions WHERE token_hash = $1',
    [tokenHash]
  );
  return !!(result.rows[0] && result.rows[0].revoked);
};

module.exports = {
  hashToken,
  deviceLabelFor,
  recordSession,
  touchSession,
  isRevoked,
};
