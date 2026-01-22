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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const decoded = verifyToken(req);

    if (req.method === 'GET') {
      const result = await sql`
        SELECT id, username, kelas, avatar, created_at
        FROM users WHERE id = ${decoded.userId}
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        user: result.rows[0]
      });
    }

    if (req.method === 'PUT') {
      const { username, avatar } = req.body;

      await sql`
        UPDATE users
        SET username = ${username}, avatar = ${avatar}
        WHERE id = ${decoded.userId}
      `;

      return res.status(200).json({
        success: true,
        message: 'Profile updated'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}