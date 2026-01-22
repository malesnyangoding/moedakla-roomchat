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
      SELECT balance, last_reset FROM daily_balances
      WHERE user_id = ${decoded.userId} AND room_type = ${room}
    `;

    let balance = 20;
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      const lastReset = new Date(row.last_reset);
      const now = new Date();
      const hoursPassed = (now - lastReset) / (1000 * 60 * 60);

      if (hoursPassed >= 24) {
        await sql`
          UPDATE daily_balances
          SET balance = 20, last_reset = CURRENT_TIMESTAMP
          WHERE user_id = ${decoded.userId} AND room_type = ${room}
        `;
        balance = 20;
      } else {
        balance = row.balance;
      }
    }

    return res.status(200).json({
      success: true,
      balance
    });

  } catch (error) {
    console.error('Get balance error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}