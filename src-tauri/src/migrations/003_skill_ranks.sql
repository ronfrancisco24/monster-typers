PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS skill_ranks (
  skill_id TEXT PRIMARY KEY,
  rank INTEGER NOT NULL DEFAULT 0 CHECK (rank >= 0)
);