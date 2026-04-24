const pool = require('../config/db');
const { createNotification } = require('../services/notifier');

// Get or create a conversation between guest and host about a property
async function findOrCreateConversation(client, { guest_id, host_id, property_id, subject }) {
  const existing = await client.query(
    `SELECT * FROM conversations
     WHERE guest_id = $1 AND host_id = $2 AND (
       (property_id = $3 AND $3 IS NOT NULL) OR
       (property_id IS NULL AND $3 IS NULL)
     )
     LIMIT 1`,
    [guest_id, host_id, property_id || null]
  );
  if (existing.rows[0]) return existing.rows[0];

  const created = await client.query(
    `INSERT INTO conversations (guest_id, host_id, property_id, subject)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [guest_id, host_id, property_id || null, subject || null]
  );
  return created.rows[0];
}

const listConversations = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
         g.first_name as guest_first_name, g.last_name as guest_last_name, g.avatar_url as guest_avatar,
         h.first_name as host_first_name, h.last_name as host_last_name, h.avatar_url as host_avatar,
         p.title as property_title,
         COALESCE(
           (SELECT url FROM property_photos WHERE property_id = p.id AND is_primary = TRUE LIMIT 1),
           (SELECT url FROM property_photos WHERE property_id = p.id ORDER BY display_order LIMIT 1)
         ) as property_photo,
         (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
         (SELECT sender_id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_sender_id,
         (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND is_read = FALSE AND sender_id != $1) as unread_count
       FROM conversations c
       JOIN users g ON g.id = c.guest_id
       JOIN users h ON h.id = c.host_id
       LEFT JOIN properties p ON p.id = c.property_id
       WHERE c.guest_id = $1 OR c.host_id = $1
       ORDER BY c.last_message_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const convoResult = await pool.query(
      `SELECT c.*,
         g.first_name as guest_first_name, g.last_name as guest_last_name, g.avatar_url as guest_avatar, g.email as guest_email,
         h.first_name as host_first_name, h.last_name as host_last_name, h.avatar_url as host_avatar, h.email as host_email,
         p.title as property_title, p.id as property_id
       FROM conversations c
       JOIN users g ON g.id = c.guest_id
       JOIN users h ON h.id = c.host_id
       LEFT JOIN properties p ON p.id = c.property_id
       WHERE c.id = $1`,
      [id]
    );
    const convo = convoResult.rows[0];
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });

    if (convo.guest_id !== req.user.id && convo.host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const messagesResult = await pool.query(
      `SELECT m.*, u.first_name, u.last_name, u.avatar_url
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );

    // Mark messages from the other user as read
    await pool.query(
      `UPDATE messages SET is_read = TRUE
       WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE`,
      [id, req.user.id]
    );

    res.json({ conversation: convo, messages: messagesResult.rows });
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { conversation_id, content, recipient_id, property_id, subject } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let conversation;
      if (conversation_id) {
        const r = await client.query('SELECT * FROM conversations WHERE id = $1', [conversation_id]);
        conversation = r.rows[0];
        if (!conversation) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Conversation not found' });
        }
        if (conversation.guest_id !== req.user.id && conversation.host_id !== req.user.id) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Not authorized' });
        }
      } else {
        if (!recipient_id) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'recipient_id is required for a new conversation' });
        }
        // Determine guest/host from roles: current user is guest unless they're a host; use property host otherwise
        let guest_id = req.user.id;
        let host_id = recipient_id;
        if (req.user.role === 'host') {
          guest_id = recipient_id;
          host_id = req.user.id;
        }
        if (property_id) {
          const prop = await client.query('SELECT host_id FROM properties WHERE id = $1', [property_id]);
          if (prop.rows[0]) {
            host_id = prop.rows[0].host_id;
            guest_id = req.user.id === host_id ? recipient_id : req.user.id;
          }
        }
        conversation = await findOrCreateConversation(client, { guest_id, host_id, property_id, subject });
      }

      const msgResult = await client.query(
        `INSERT INTO messages (conversation_id, sender_id, content)
         VALUES ($1, $2, $3) RETURNING *`,
        [conversation.id, req.user.id, content.trim()]
      );

      await client.query(
        'UPDATE conversations SET last_message_at = NOW() WHERE id = $1',
        [conversation.id]
      );

      const recipient = conversation.guest_id === req.user.id ? conversation.host_id : conversation.guest_id;
      await createNotification(
        {
          user_id: recipient,
          type: 'message',
          title: 'New message',
          message: `${req.user.first_name}: ${content.slice(0, 80)}`,
          link: `/inbox/${conversation.id}`,
        },
        client
      );

      await client.query('COMMIT');

      res.status(201).json({
        conversation_id: conversation.id,
        message: msgResult.rows[0],
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

// Pre-booking inquiry endpoint — syntactic sugar over sendMessage
const createInquiry = async (req, res, next) => {
  try {
    const { property_id, content } = req.body;
    if (!property_id || !content) {
      return res.status(400).json({ error: 'property_id and content are required' });
    }

    const prop = await pool.query(
      "SELECT id, host_id, title FROM properties WHERE id = $1 AND status = 'active'",
      [property_id]
    );
    if (!prop.rows[0]) return res.status(404).json({ error: 'Property not found' });
    if (prop.rows[0].host_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot send an inquiry on your own listing' });
    }

    req.body = {
      recipient_id: prop.rows[0].host_id,
      property_id,
      content,
      subject: `Inquiry about ${prop.rows[0].title}`,
    };
    return sendMessage(req, res, next);
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT COUNT(*) FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE (c.guest_id = $1 OR c.host_id = $1)
       AND m.sender_id != $1 AND m.is_read = FALSE`,
      [req.user.id]
    );
    res.json({ unread_count: parseInt(r.rows[0].count) });
  } catch (err) {
    next(err);
  }
};

module.exports = { listConversations, getConversation, sendMessage, createInquiry, getUnreadCount };
