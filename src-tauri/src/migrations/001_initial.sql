PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS player_progress (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  hunter_level INTEGER NOT NULL DEFAULT 1 CHECK (hunter_level >= 1),
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  unspent_skill_points INTEGER NOT NULL DEFAULT 0 CHECK (unspent_skill_points >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL
);