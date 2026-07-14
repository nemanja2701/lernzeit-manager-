import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL fehlt. Bitte Umgebungsvariable setzen.');
}

// Render will SSL, lokales Postgres nicht. Sonst gibt es Verbindungsfehler.
const useSSL = process.env.DATABASE_URL?.includes('render.com')
  || process.env.PGSSL === 'true';

export const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

// Wir hatten die Queries ursprünglich mit ? geschrieben (SQLite).
// Postgres will $1, $2. Umschreiben war weniger Arbeit als alle Queries anfassen.
function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export async function run(sql, params = []) {
  return pool.query(toPg(sql), params);
}

export async function all(sql, params = []) {
  const res = await pool.query(toPg(sql), params);
  return res.rows;
}

export async function get(sql, params = []) {
  const res = await pool.query(toPg(sql), params);
  return res.rows[0] || null;
}

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      target_hours REAL NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS milestones (
      id SERIAL PRIMARY KEY,
      goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      due_date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      note TEXT DEFAULT '',
      date TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plan_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      planned_date TEXT NOT NULL,
      planned_hours REAL NOT NULL DEFAULT 1,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log('Datenbank bereit (PostgreSQL)');
}
