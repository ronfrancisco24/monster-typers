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
pub struct InventoryEntry {
    pub material_id: String,
    pub quantity: i64,
}

#[derive(serde::Serialize)]
pub struct GameSave {
    pub profile: PlayerProfile,
    pub settings: HashMap<String, String>,
    pub inventory: Vec<InventoryEntry>,
}

#[derive(serde::Deserialize, serde::Serialize, Clone)]
pub struct MaterialDropInput {
    pub material_id: String,
    pub quantity: i64,
}

#[derive(serde::Deserialize)]
pub struct FinalizeHuntInput {
    pub hunt_id: String,
    pub map_id: String,
    pub monster_id: String,
    pub outcome: String,
    pub duration_ms: i64,
    pub correct_keystrokes: i64,
    pub incorrect_keystrokes: i64,
    pub words_completed: i64,
    pub xp_awarded: i64,
    pub loot: Vec<MaterialDropInput>,
    pub broken_part_ids: Vec<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct MaterialDropOutput {
    pub material_id: String,
    pub quantity: i64,
}

#[derive(serde::Serialize)]
pub struct FinalizedHunt {
    pub hunt_id: String,
    pub outcome: String,
    pub xp_awarded: i64,
    pub loot: Vec<MaterialDropOutput>,
    pub broken_part_ids: Vec<String>,
    pub total_xp: i64,
    pub completed_at: String,
}

pub fn migrate(conn: &Connection) -> rusqlite::Result<()> {
    let version: i64 = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;
    if version < 1 {
        conn.execute_batch(include_str!("migrations/001_initial.sql"))?;
        conn.pragma_update(None, "user_version", 1)?;
    }
    if version < 2 {
        conn.execute_batch(include_str!("migrations/002_hunt_history.sql"))?;
        conn.pragma_update(None, "user_version", 2)?;
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

pub fn load_inventory(conn: &Connection) -> rusqlite::Result<Vec<InventoryEntry>> {
    let mut stmt = conn.prepare("SELECT material_id, quantity FROM inventory_materials ORDER BY material_id")?;
    let rows = stmt.query_map([], |row| {
        Ok(InventoryEntry {
            material_id: row.get(0)?,
            quantity: row.get(1)?,
        })
    })?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row?);
    }
    Ok(out)
}

pub fn finalize_hunt(conn: &mut Connection, input: &FinalizeHuntInput) -> Result<FinalizedHunt, String> {
    // Validate.
    if input.hunt_id.trim().is_empty() {
        return Err("invalid hunt_id".to_string());
    }
    if input.map_id.trim().is_empty() {
        return Err("invalid map_id".to_string());
    }
    if input.monster_id.trim().is_empty() {
        return Err("invalid monster_id".to_string());
    }
    if !["victory", "defeat", "abandoned"].contains(&input.outcome.as_str()) {
        return Err("invalid outcome".to_string());
    }
    if input.duration_ms < 0 {
        return Err("invalid duration_ms".to_string());
    }
    if input.correct_keystrokes < 0 || input.incorrect_keystrokes < 0 || input.words_completed < 0 {
        return Err("invalid keystroke counts".to_string());
    }
    if input.xp_awarded < 0 {
        return Err("invalid xp_awarded".to_string());
    }
    for drop in &input.loot {
        if drop.material_id.trim().is_empty() || drop.quantity <= 0 {
            return Err("invalid loot entry".to_string());
        }
    }

    // Only victories pay rewards.
    let (xp_awarded, loot) = if input.outcome != "victory" {
        (0_i64, Vec::new())
    } else {
        (input.xp_awarded, input.loot.clone())
    };

    let broken_part_ids = if input.outcome == "victory" {
        input.broken_part_ids.clone()
    } else {
        Vec::new()
    };

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Idempotency: if this hunt was already settled, return the stored result.
    let existing: Option<(String, i64, String, String, String)> = tx
        .query_row(
            "SELECT outcome, xp_awarded, loot_json, broken_part_ids_json, completed_at \
             FROM hunt_history WHERE hunt_id = ?1",
            params![input.hunt_id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                ))
            },
        )
        .ok();

    if let Some((outcome, xp, loot_json, broken_json, completed_at)) = existing {
        let loot: Vec<MaterialDropOutput> =
            serde_json::from_str(&loot_json).unwrap_or_default();
        let broken: Vec<String> = serde_json::from_str(&broken_json).unwrap_or_default();
        let total_xp: i64 = tx
            .query_row("SELECT total_xp FROM player_progress WHERE id = 1", [], |r| r.get(0))
            .unwrap_or(0);
        tx.commit().map_err(|e| e.to_string())?;
        return Ok(FinalizedHunt {
            hunt_id: input.hunt_id.clone(),
            outcome,
            xp_awarded: xp,
            loot,
            broken_part_ids: broken,
            total_xp,
            completed_at,
        });
    }

    // Insert history row. completed_at generated by SQLite.
    let loot_json = serde_json::to_string(&loot).map_err(|e| e.to_string())?;
    let broken_json = serde_json::to_string(&broken_part_ids).map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO hunt_history (hunt_id, map_id, monster_id, outcome, duration_ms, \
         correct_keystrokes, incorrect_keystrokes, words_completed, xp_awarded, \
         loot_json, broken_part_ids_json, completed_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, \
         strftime('%Y-%m-%dT%H:%M:%SZ','now'))",
        params![
            input.hunt_id,
            input.map_id,
            input.monster_id,
            input.outcome,
            input.duration_ms,
            input.correct_keystrokes,
            input.incorrect_keystrokes,
            input.words_completed,
            xp_awarded,
            loot_json,
            broken_json,
        ],
    )
    .map_err(|e| e.to_string())?;

    let completed_at: String = tx
        .query_row(
            "SELECT completed_at FROM hunt_history WHERE hunt_id = ?1",
            params![input.hunt_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    if input.outcome == "victory" {
        tx.execute(
            "UPDATE player_progress SET total_xp = total_xp + ?1, \
             updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = 1",
            params![xp_awarded],
        )
        .map_err(|e| e.to_string())?;

        for drop in &loot {
            tx.execute(
                "INSERT INTO inventory_materials (material_id, quantity) VALUES (?1, ?2) \
                 ON CONFLICT(material_id) DO UPDATE SET quantity = quantity + excluded.quantity",
                params![drop.material_id, drop.quantity],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    let total_xp: i64 = tx
        .query_row("SELECT total_xp FROM player_progress WHERE id = 1", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    let loot_out: Vec<MaterialDropOutput> = loot
        .iter()
        .map(|d| MaterialDropOutput {
            material_id: d.material_id.clone(),
            quantity: d.quantity,
        })
        .collect();

    Ok(FinalizedHunt {
        hunt_id: input.hunt_id.clone(),
        outcome: input.outcome.clone(),
        xp_awarded,
        loot: loot_out,
        broken_part_ids,
        total_xp,
        completed_at,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        migrate(&conn).unwrap();
        seed(&conn).unwrap();
        conn
    }

    fn base_input(outcome: &str) -> FinalizeHuntInput {
        FinalizeHuntInput {
            hunt_id: "hunt-1".to_string(),
            map_id: "map.verdant_forest".to_string(),
            monster_id: "monster.moss_slime".to_string(),
            outcome: outcome.to_string(),
            duration_ms: 12000,
            correct_keystrokes: 10,
            incorrect_keystrokes: 2,
            words_completed: 3,
            xp_awarded: 20,
            loot: vec![MaterialDropInput {
                material_id: "material.moss_gel".to_string(),
                quantity: 2,
            }],
            broken_part_ids: vec!["part.moss_crown".to_string()],
        }
    }

    #[test]
    fn migration_reaches_version_2() {
        let conn = Connection::open_in_memory().unwrap();
        migrate(&conn).unwrap();
        seed(&conn).unwrap();
        migrate(&conn).unwrap();
        let version: i64 = conn
            .pragma_query_value(None, "user_version", |r| r.get(0))
            .unwrap();
        assert_eq!(version, 2);
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM hunt_history", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 0);
        let inv: i64 = conn
            .query_row("SELECT COUNT(*) FROM inventory_materials", [], |r| r.get(0))
            .unwrap();
        assert_eq!(inv, 0);
    }

    #[test]
    fn finalize_victory_pays_once() {
        let mut conn = setup();
        let input = base_input("victory");
        let first = finalize_hunt(&mut conn, &input).unwrap();
        assert_eq!(first.xp_awarded, 20);
        assert_eq!(first.loot.len(), 1);
        assert_eq!(first.loot[0].quantity, 2);

        // duplicate pays nothing extra
        let second = finalize_hunt(&mut conn, &input).unwrap();
        assert_eq!(second.xp_awarded, 20);
        assert_eq!(second.loot.len(), 1);

        let total_xp: i64 = conn
            .query_row("SELECT total_xp FROM player_progress WHERE id = 1", [], |r| r.get(0))
            .unwrap();
        assert_eq!(total_xp, 20);

        let qty: i64 = conn
            .query_row(
                "SELECT quantity FROM inventory_materials WHERE material_id = 'material.moss_gel'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(qty, 2);

        let history_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM hunt_history", [], |r| r.get(0))
            .unwrap();
        assert_eq!(history_count, 1);
    }

    #[test]
    fn finalize_defeat_pays_nothing() {
        let mut conn = setup();
        let mut input = base_input("defeat");
        input.xp_awarded = 0;
        input.loot.clear();
        input.broken_part_ids.clear();
        let result = finalize_hunt(&mut conn, &input).unwrap();
        assert_eq!(result.xp_awarded, 0);
        assert!(result.loot.is_empty());
        assert!(result.broken_part_ids.is_empty());

        let total_xp: i64 = conn
            .query_row("SELECT total_xp FROM player_progress WHERE id = 1", [], |r| r.get(0))
            .unwrap();
        assert_eq!(total_xp, 0);

        let inv_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM inventory_materials", [], |r| r.get(0))
            .unwrap();
        assert_eq!(inv_count, 0);
    }

    #[test]
    fn finalize_rejects_invalid_input() {
        let mut conn = setup();
        let mut input = base_input("victory");
        input.duration_ms = -1;
        let err = finalize_hunt(&mut conn, &input);
        assert!(err.is_err());

        let history_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM hunt_history", [], |r| r.get(0))
            .unwrap();
        assert_eq!(history_count, 0);
    }
}