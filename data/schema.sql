-- Schéma PostgreSQL — CDM 2026 Tracker
-- Exécuter une fois : psql -d cdm2026 -f schema.sql
-- (ou laisser le serveur Node.js l'initialiser automatiquement au démarrage)

CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  username     VARCHAR(50)  UNIQUE NOT NULL,
  display_name VARCHAR(100),
  password_hash TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Un utilisateur peut parier une fois par match (UNIQUE user_id + match_id).
-- En cas de nouveau pari, ON CONFLICT UPDATE met à jour le score.
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

-- Index pour accélérer la récupération des paris par match
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
