const pool = require('../config/db');
const { hashToken } = require('../services/sessions');

const listMySessions = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    const currentHash = token ? hashToken(token) : null;

    const result = await pool.query(
      `SELECT id, device_label, user_agent, ip_address,
         last_active_at, created_at, revoked, token_hash
       FROM user_sessions
       WHERE user_id = $1
       ORDER BY revoked ASC, last_active_at DESC`,
      [req.user.id]
    );

    const sessions = result.rows.map(row => ({
      id: row.id,
      device_label: row.device_label,
      user_agent: row.user_agent,
      ip_address: row.ip_address,
      last_active_at: row.last_active_at,
      created_at: row.created_at,
      revoked: row.revoked,
      is_current: row.token_hash === currentHash,
    }));

    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    const currentHash = token ? hashToken(token) : null;

    const session = await pool.query(
      'SELECT id, token_hash FROM user_sessions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!session.rows[0]) return res.status(404).json({ error: 'Session not found' });

    if (session.rows[0].token_hash === currentHash) {
      return res.status(400).json({ error: 'Use the logout endpoint to revoke the current session' });
    }

    await pool.query(
      'UPDATE user_sessions SET revoked = TRUE WHERE id = $1',
      [id]
    );
    res.json({ message: 'Session signed out' });
  } catch (err) {
    next(err);
  }
};

const revokeAllOthers = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    const currentHash = token ? hashToken(token) : null;

    const result = await pool.query(
      `UPDATE user_sessions
       SET revoked = TRUE
       WHERE user_id = $1 AND revoked = FALSE
         AND token_hash <> COALESCE($2, '')
       RETURNING id`,
      [req.user.id, currentHash]
    );
    res.json({ revoked_count: result.rows.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { listMySessions, revokeSession, revokeAllOthers };
