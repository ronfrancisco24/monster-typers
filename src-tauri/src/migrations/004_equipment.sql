CREATE TABLE IF NOT EXISTS owned_equipment (
    equipment_id TEXT PRIMARY KEY,
    crafted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS equipment_loadout (
    slot TEXT PRIMARY KEY,
    equipment_id TEXT NOT NULL
);
