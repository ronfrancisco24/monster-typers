use rusqlite::{Connection, params};
use std::collections::HashMap;
use std::sync::Mutex;

pub struct Db {
    pub conn: Mutex<Connection>,
}

#[derive(serde::Serialize)]
pub struct PlayerProfile {
    pub hunter_level: i64,
    pub total_xp: i64,
    pub unspent_skill_points: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(serde::Serialize)]
pub struct GameSave {
    pub profile: PlayerProfile,
    pub settings: HashMap<String, String>,
}

pub fn migrate(conn: &Connection) -> rusqlite::Result<()> {
    let version: i64 = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;
    if version < 1 {
        conn.execute_batch(include_str!("migrations/001_initial.sql"))?;
        conn.pragma_update(None, "user_version", 1)?;
    }
    Ok(())
}

pub fn seed(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT INTO player_progress (id, hunter_level, total_xp, unspent_skill_points, created_at, updated_at) \
         SELECT 1, 1, 0, 0, strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now') \
         WHERE NOT EXISTS (SELECT 1 FROM player_progress WHERE id = 1)",
        [],
    )?;
    Ok(())
}

pub fn load_profile(conn: &Connection) -> rusqlite::Result<PlayerProfile> {
    conn.query_row(
        "SELECT hunter_level, total_xp, unspent_skill_points, created_at, updated_at \
         FROM player_progress WHERE id = 1",
        [],
        |row| {
            Ok(PlayerProfile {
                hunter_level: row.get(0)?,
                total_xp: row.get(1)?,
                unspent_skill_points: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    )
}

pub fn load_settings(conn: &Connection) -> rusqlite::Result<HashMap<String, String>> {
    let mut stmt = conn.prepare("SELECT setting_key, setting_value FROM app_settings")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;
    let mut map = HashMap::new();
    for row in rows {
        let (k, v) = row?;
        map.insert(k, v);
    }
    Ok(map)
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT INTO app_settings (setting_key, setting_value) VALUES (?1, ?2) \
         ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value",
        params![key, value],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migration_and_seed_are_idempotent() {
        let conn = Connection::open_in_memory().unwrap();
        migrate(&conn).unwrap();
        seed(&conn).unwrap();
        seed(&conn).unwrap();
        migrate(&conn).unwrap();

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM player_progress", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 1);

        let version: i64 = conn
            .pragma_query_value(None, "user_version", |r| r.get(0))
            .unwrap();
        assert_eq!(version, 1);
    }
}