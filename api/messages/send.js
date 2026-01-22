import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

function verifyToken(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('No token provided');
  return jwt.verify(token, JWT_SECRET);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decoded = verifyToken(req);
    const userId = decoded.userId;

    const { roomType, messageText, isVoice, voiceDuration } = req.body;

    if (!roomType || (!messageText && !isVoice)) {
      return res.status(400).json({ error: 'Invalid message data' });
    }

    // Check balance
    const userKelas = decoded.kelas.toLowerCase();
    const isOwnClass = roomType === `kelas-${userKelas}`;

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
        await sql`
          INSERT INTO daily_balances (user_id, room_type, balance)
          VALUES (${userId}, ${roomType}, 20)
        `;
      }

      if (balance <= 0) {
        return res.status(429).json({ error: 'Daily message limit reached' });
      }

      await sql`
        UPDATE daily_balances
        SET balance = balance - 1
        WHERE user_id = ${userId} AND room_type = ${roomType}
      `;
    }

    // Insert message
    const result = await sql`
      INSERT INTO messages (user_id, username, room_type, message_text, is_voice, voice_duration)
      VALUES (${userId}, ${decoded.username}, ${roomType}, ${messageText || null}, ${isVoice || false}, ${voiceDuration || null})
      RETURNING id, created_at
    `;

    // Delete old messages (keep last 100)
    await sql`
      DELETE FROM messages
      WHERE room_type = ${roomType}
      AND id NOT IN (
        SELECT id FROM messages
        WHERE room_type = ${roomType}
        ORDER BY created_at DESC
        LIMIT 100
      )
    `;

    return res.status(201).json({
      success: true,
      message: result.rows[0]
    });

  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
