// Script de migration — à lancer une fois (et à chaque évolution du schéma)
// avec les identifiants propriétaires (PG_USER/DATABASE_URL), jamais par l'app au runtime.
//   npm run db:migrate
import { Pool } from 'pg';
import { config } from './lib/config';

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

  CREATE TABLE IF NOT EXISTS favorites (
    id         SERIAL  PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    team       VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, team)
  );

  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites (user_id);
`;

const APP_ROLE = 'cdm_app';

async function ensureAppRole(pool: Pool): Promise<void> {
  const appPassword = process.env.PG_APP_PASSWORD;
  if (!appPassword) {
    console.warn(
      `PG_APP_PASSWORD non défini — rôle applicatif restreint "${APP_ROLE}" non configuré ` +
      `(l'app continuera d'utiliser le rôle propriétaire tant que ce n'est pas fait).`,
    );
    return;
  }

  const existing = await pool.query(
    'SELECT 1 FROM pg_roles WHERE rolname = $1',
    [APP_ROLE],
  );

  // CREATE/ALTER ROLE n'acceptent pas les paramètres liés ($1) — littéral échappé à la main.
  const escapedPassword = appPassword.replace(/'/g, "''");

  if (existing.rows.length === 0) {
    await pool.query(`CREATE ROLE ${APP_ROLE} WITH LOGIN PASSWORD '${escapedPassword}'`);
    console.log(`Rôle "${APP_ROLE}" créé.`);
  } else {
    await pool.query(`ALTER ROLE ${APP_ROLE} WITH LOGIN PASSWORD '${escapedPassword}'`);
    console.log(`Rôle "${APP_ROLE}" déjà présent — mot de passe mis à jour.`);
  }

  const { rows } = await pool.query('SELECT current_database() AS name');
  const dbName = rows[0].name;

  await pool.query(`GRANT CONNECT ON DATABASE "${dbName}" TO ${APP_ROLE}`);
  await pool.query(`GRANT USAGE ON SCHEMA public TO ${APP_ROLE}`);
  await pool.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_ROLE}`);
  await pool.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_ROLE}`);
  await pool.query(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_ROLE}`,
  );
  await pool.query(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${APP_ROLE}`,
  );
  console.log(`Droits SELECT/INSERT/UPDATE/DELETE accordés à "${APP_ROLE}" (tables actuelles et futures).`);
}

async function main(): Promise<void> {
  if (!config.databaseUrl) {
    console.error('DATABASE_URL / PG_* non configurés — impossible de migrer.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: config.databaseUrl });
  try {
    await pool.query(SCHEMA_SQL);
    console.log('Schéma appliqué.');
    await ensureAppRole(pool);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Erreur de migration :', err);
  process.exit(1);
});
