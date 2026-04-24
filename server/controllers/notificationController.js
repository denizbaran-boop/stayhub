const pool = require('../config/db');

const listNotifications = async (req, res, next) => {
  try {
    const { unread_only } = req.query;
    const filter = unread_only === 'true' ? 'AND is_read = FALSE' : '';
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1 ${filter}
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id]
    );
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json({
      notifications: result.rows,
      unread_count: parseInt(countResult.rows[0].count),
    });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listNotifications, markAsRead, markAllAsRead, deleteNotification };
