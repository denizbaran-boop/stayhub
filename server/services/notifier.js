const pool = require('../config/db');

async function createNotification({ user_id, type, title, message, link }, client) {
  const q = client || pool;
  try {
    await q.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [user_id, type, title, message || null, link || null]
    );
  } catch (err) {
    console.error('[notifier] Failed to create notification:', err.message);
  }
}

module.exports = { createNotification };
