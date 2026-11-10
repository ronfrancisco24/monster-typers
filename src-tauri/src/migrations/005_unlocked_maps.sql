CREATE TABLE IF NOT EXISTS unlocked_maps (
    map_id TEXT PRIMARY KEY
);

INSERT OR IGNORE INTO unlocked_maps (map_id) VALUES ('map.verdant_forest');
