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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decoded = verifyToken(req);
    const { room } = req.query;

    if (!room) {
      return res.status(400).json({ error: 'Room parameter required' });
    }

    const result = await sql`
      SELECT m.id, m.username, m.message_text, m.is_voice, 
             m.voice_duration, m.created_at, m.user_id,
             u.avatar
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.room_type = ${room}
      ORDER BY m.created_at ASC
      LIMIT 100
    `;

    return res.status(200).json({
      success: true,
      messages: result.rows,
      currentUserId: decoded.userId
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
