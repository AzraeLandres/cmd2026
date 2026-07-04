import { Pool } from 'pg';
import { config } from './config';

const pool: Pool | null = config.databaseUrl
  ? new Pool({ connectionString: config.databaseUrl })
  : null;

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id           SERIAL PRIMARY KEY,
    username     VARCHAR(50)  UNIQUE NOT NULL,
    display_name VARCHAR(100),
    password_hash TEXT        NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS bets (
    id         SERIAL  PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    match_id   TEXT    NOT NULL,
    home_score INTEGER NOT NULL CHECK (home_score >= 0),
    away_score INTEGER NOT NULL CHECK (away_score >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, match_id)
  );

  CREATE INDEX IF NOT EXISTS idx_bets_match_id ON bets (match_id);

  CREATE TABLE IF NOT EXISTS friends (
    id           SERIAL  PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    addressee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status       VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (requester_id, addressee_id)
  );

  CREATE INDEX IF NOT EXISTS idx_friends_addressee ON friends (addressee_id, status);
`;

export async function initDb(): Promise<void> {
  if (!pool) {
    console.warn('DATABASE_URL non configurée — fonctionnalités BDD désactivées');
    return;
  }
  await pool.query(SCHEMA_SQL);
}

export const db = pool;
