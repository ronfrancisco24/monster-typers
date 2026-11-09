PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS hunt_history (
  hunt_id TEXT PRIMARY KEY,
  map_id TEXT NOT NULL,
  monster_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (
    outcome IN ('victory', 'defeat', 'abandoned')
  ),
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  correct_keystrokes INTEGER NOT NULL DEFAULT 0 CHECK (correct_keystrokes >= 0),
  incorrect_keystrokes INTEGER NOT NULL DEFAULT 0 CHECK (incorrect_keystrokes >= 0),
  words_completed INTEGER NOT NULL DEFAULT 0 CHECK (words_completed >= 0),
  xp_awarded INTEGER NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
  loot_json TEXT NOT NULL DEFAULT '[]',
  broken_part_ids_json TEXT NOT NULL DEFAULT '[]',
  completed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hunt_history_monster_outcome
  ON hunt_history (monster_id, outcome);

CREATE INDEX IF NOT EXISTS idx_hunt_history_completed_at
  ON hunt_history (completed_at);

CREATE TABLE IF NOT EXISTS inventory_materials (
  material_id TEXT PRIMARY KEY,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0)
);