import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Middleware to verify JWT
function verifyToken(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('No token provided');
  return jwt.verify(token, JWT_SECRET);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const decoded = verifyToken(req);
    const userId = decoded.userId;

    const { roomType, messageText, isVoice, voiceDuration } = req.body;

    if (!roomType || (!messageText && !isVoice)) {
      return res.status(400).json({ error: 'Invalid message data' });
    }

    // Check if user is in their own class room
    const userKelas = decoded.kelas.toLowerCase();
    const isOwnClass = roomType === `kelas-${userKelas}`;

    // Check balance if not in own class
    if (!isOwnClass) {
      const balanceResult = await sql`
        SELECT balance, last_reset FROM daily_balances
        WHERE user_id = ${userId} AND room_type = ${roomType}
      `;

      let balance = 20;
      
      if (balanceResult.rows.length > 0) {
        const row = balanceResult.rows[0];
        const lastReset = new Date(row.last_reset);
        const now = new Date();
        const hoursPassed = (now - lastReset) / (1000 * 60 * 60);

        // Reset balance if 24 hours passed
        if (hoursPassed >= 24) {
          await sql`
            UPDATE daily_balances
            SET balance = 20, last_reset = CURRENT_TIMESTAMP
            WHERE user_id = ${userId} AND room_type = ${roomType}
          `;
          balance = 20;
        } else {
          balance = row.balance;
        }
      } else {
        // Create initial balance
        await sql`
          INSERT INTO daily_balances (user_id, room_type, balance)
          VALUES (${userId}, ${roomType}, 20)
        `;
      }

      if (balance <= 0) {
        return res.status(429).json({ error: 'Daily message limit reached' });
      }

      // Decrease balance
      await sql`
        UPDATE daily_balances
        SET balance = balance - 1
        WHERE user_id = ${userId} AND room_type = ${roomType}
      `;
    }

    // Insert message
    const result = await sql`
      INSERT INTO messages (user_id, username, room_type, message_text, is_voice, voice_duration)
      VALUES (${userId}, ${decoded.username}, ${roomType}, ${messageText}, ${isVoice || false}, ${voiceDuration})
      RETURNING id, created_at
    `;

    // Get last 100 messages for this room
    const messages = await sql`
      SELECT m.*, u.avatar
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.room_type = ${roomType}
      ORDER BY m.created_at DESC
      LIMIT 100
    `;

    // Delete old messages (keep only last 100)
    if (messages.rows.length >= 100) {
      const oldestId = messages.rows[99].id;
      await sql`
        DELETE FROM messages
        WHERE room_type = ${roomType} AND id < ${oldestId}
      `;
    }

    return res.status(201).json({
      success: true,
      message: result.rows[0]
    });

  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}