import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';

const ADMIN_KEY = process.env.ADMIN_KEY || 'default-admin-key';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password, kelas, adminKey } = req.body;

    // Verify admin key
    if (adminKey !== ADMIN_KEY) {
      return res.status(403).json({ error: 'Admin key salah! Akses ditolak.' });
    }

    if (!username || !password || !kelas) {
      return res.status(400).json({ error: 'Semua field harus diisi' });
    }

    if (!['X', 'XI', 'XII'].includes(kelas)) {
      return res.status(400).json({ error: 'Kelas tidak valid' });
    }

    // Check if username exists
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
      message: 'User berhasil didaftarkan!',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
