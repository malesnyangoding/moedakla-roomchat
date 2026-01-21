import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';

const ADMIN_KEY = process.env.ADMIN_KEY || 'your-admin-key-here';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password, kelas, adminKey } = req.body;

    // Verify admin key
    if (adminKey !== ADMIN_KEY) {
      return res.status(403).json({ error: 'Unauthorized - Invalid admin key' });
    }

    if (!username || !password || !kelas) {
      return res.status(400).json({ error: 'Semua field harus diisi' });
    }

    if (!['X', 'XI', 'XII'].includes(kelas)) {
      return res.status(400).json({ error: 'Kelas tidak valid' });
    }

    // Check if username already exists
    const existing = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await sql`
      INSERT INTO users (username, password, kelas)
      VALUES (${username}, ${hashedPassword}, ${kelas})
      RETURNING id, username, kelas, created_at
    `;

    return res.status(201).json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}