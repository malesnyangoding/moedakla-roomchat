import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        kelas VARCHAR(10) NOT NULL CHECK (kelas IN ('X', 'XI', 'XII')),
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(50) NOT NULL,
        room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('all-class', 'kelas-x', 'kelas-xi', 'kelas-xii')),
        message_text TEXT,
        is_voice BOOLEAN DEFAULT FALSE,
        voice_duration VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS daily_balances (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        room_type VARCHAR(20) NOT NULL,
        balance INTEGER DEFAULT 20,
        last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, room_type)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS login_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_type, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON login_sessions(session_token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user ON login_sessions(user_id)`;

    return res.status(200).json({ 
      success: true,
      message: 'Database tables created!' 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
