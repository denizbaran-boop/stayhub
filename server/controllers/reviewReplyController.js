const pool = require('../config/db');
const { createNotification } = require('../services/notifier');

// Host posts a public reply to a review of one of their properties
const upsertReply = async (req, res, next) => {
  try {
    const { review_id, reply } = req.body;
    if (!review_id || !reply || !reply.trim()) {
      return res.status(400).json({ error: 'review_id and reply are required' });
    }
    if (reply.trim().length < 3) {
      return res.status(400).json({ error: 'Reply is too short' });
    }

    const review = await pool.query(
      `SELECT r.*, p.host_id, p.title as property_title
       FROM reviews r
       JOIN properties p ON p.id = r.property_id
       WHERE r.id = $1`,
      [review_id]
    );
    if (!review.rows[0]) return res.status(404).json({ error: 'Review not found' });
    if (review.rows[0].host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the property host can reply' });
    }

    const result = await pool.query(
      `INSERT INTO review_replies (review_id, host_id, reply)
       VALUES ($1, $2, $3)
       ON CONFLICT (review_id) DO UPDATE
         SET reply = EXCLUDED.reply, updated_at = NOW()
       RETURNING *`,
      [review_id, req.user.id, reply.trim()]
    );

    // Notify the guest who left the review
    try {
      await createNotification({
        user_id: review.rows[0].guest_id,
        type: 'review_reply',
        title: 'Your host replied to your review',
        message: `${review.rows[0].property_title}: ${reply.trim().slice(0, 120)}`,
        link: `/properties/${review.rows[0].property_id}`,
      });
    } catch (err) {
      console.error('[review_reply] notification failed:', err.message);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reply = await pool.query('SELECT * FROM review_replies WHERE id = $1', [id]);
    if (!reply.rows[0]) return res.status(404).json({ error: 'Reply not found' });
    if (reply.rows[0].host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await pool.query('DELETE FROM review_replies WHERE id = $1', [id]);
    res.json({ message: 'Reply removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = { upsertReply, deleteReply };
