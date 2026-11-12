-- Wijnkelder: basisschema voor Cloudflare D1
-- user_id is het e-mailadres van de ingelogde gebruiker (via Cloudflare Access).

CREATE TABLE IF NOT EXISTS wines (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  grapes TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  country TEXT,
  region TEXT,
  type TEXT NOT NULL,
  best_before TEXT,
  taste_profile TEXT,
  pairing_advice TEXT,
  fun_fact TEXT,
  notes TEXT,
  rating INTEGER,
  location TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS wines_user ON wines (user_id, created_at);

CREATE TABLE IF NOT EXISTS wine_locations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  ai_provider TEXT NOT NULL DEFAULT 'openai',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
