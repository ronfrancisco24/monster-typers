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
    pub skill_ranks: HashMap<String, i64>,
    pub owned_equipment: Vec<String>,
    pub equipment_loadout: HashMap<String, String>,
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
    pub hunter_level: i64,
    pub unspent_skill_points: i64,
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
    pub hunter_level: i64,
    pub total_xp: i64,
    pub unspent_skill_points: i64,
    pub loot: Vec<MaterialDropOutput>,
    pub broken_part_ids: Vec<String>,
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
    if version < 3 {
        conn.execute_batch(include_str!("migrations/003_skill_ranks.sql"))?;
        conn.pragma_update(None, "user_version", 3)?;
    }
    if version < 4 {
        conn.execute_batch(include_str!("migrations/004_equipment.sql"))?;
        conn.pragma_update(None, "user_version", 4)?;
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
    if input.hunter_level < 1 {
        return Err("invalid hunter_level".to_string());
    }
    if input.unspent_skill_points < 0 {
        return Err("invalid unspent_skill_points".to_string());
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
        let (hunter_level, total_xp, unspent_skill_points): (i64, i64, i64) = tx
            .query_row(
                "SELECT hunter_level, total_xp, unspent_skill_points FROM player_progress WHERE id = 1",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap_or((1, 0, 0));
        tx.commit().map_err(|e| e.to_string())?;
        return Ok(FinalizedHunt {
            hunt_id: input.hunt_id.clone(),
            outcome,
            xp_awarded: xp,
            hunter_level,
            total_xp,
            unspent_skill_points,
            loot,
            broken_part_ids: broken,
            completed_at,
        });
    }

    // Load current progression to validate level/point changes.
    let (current_level, current_points, current_total_xp): (i64, i64, i64) = tx
        .query_row(
            "SELECT hunter_level, unspent_skill_points, total_xp FROM player_progress WHERE id = 1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .map_err(|e| e.to_string())?;

    if input.outcome == "victory" {
        if input.hunter_level < current_level {
            return Err("hunter_level cannot decrease".to_string());
        }
        if input.unspent_skill_points < current_points {
            return Err("skill points cannot decrease".to_string());
        }
        if (input.unspent_skill_points - current_points) != (input.hunter_level - current_level) {
            return Err("skill points must match levels gained".to_string());
        }
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
            "UPDATE player_progress SET hunter_level = ?1, total_xp = total_xp + ?2, \
             unspent_skill_points = ?3, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = 1",
            params![input.hunter_level, xp_awarded, input.unspent_skill_points],
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

    let (committed_level, committed_points): (i64, i64) = if input.outcome == "victory" {
        (input.hunter_level, input.unspent_skill_points)
    } else {
        (current_level, current_points)
    };

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
        hunter_level: committed_level,
        total_xp,
        unspent_skill_points: committed_points,
        loot: loot_out,
        broken_part_ids,
        completed_at,
    })
}

pub fn load_skill_ranks(conn: &Connection) -> rusqlite::Result<HashMap<String, i64>> {
    let mut stmt = conn.prepare("SELECT skill_id, rank FROM skill_ranks")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    })?;
    let mut map = HashMap::new();
    for row in rows {
        let (k, v) = row?;
        map.insert(k, v);
    }
    Ok(map)
}

pub fn load_owned_equipment(conn: &Connection) -> rusqlite::Result<Vec<String>> {
    let mut stmt = conn.prepare("SELECT equipment_id FROM owned_equipment ORDER BY equipment_id")?;
    let rows = stmt.query_map([], |row| row.get::<_, String>(0))?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row?);
    }
    Ok(out)
}

pub fn load_equipment_loadout(conn: &Connection) -> rusqlite::Result<HashMap<String, String>> {
    let mut stmt = conn.prepare("SELECT slot, equipment_id FROM equipment_loadout")?;
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

pub fn purchase_skill_rank(
    conn: &mut Connection,
    skill_id: &str,
    cost: i64,
) -> Result<(i64, HashMap<String, i64>), String> {
    if skill_id.trim().is_empty() {
        return Err("invalid skill_id".to_string());
    }
    if cost < 1 {
        return Err("invalid cost".to_string());
    }
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let current_points: i64 = tx
        .query_row("SELECT unspent_skill_points FROM player_progress WHERE id = 1", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    if current_points < cost {
        return Err("insufficient skill points".to_string());
    }

    let old_rank: i64 = tx
        .query_row(
            "SELECT rank FROM skill_ranks WHERE skill_id = ?1",
            params![skill_id],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let new_rank = old_rank + 1;

    tx.execute(
        "INSERT INTO skill_ranks (skill_id, rank) VALUES (?1, ?2) \
         ON CONFLICT(skill_id) DO UPDATE SET rank = excluded.rank",
        params![skill_id, new_rank],
    )
    .map_err(|e| e.to_string())?;

    tx.execute(
        "UPDATE player_progress SET unspent_skill_points = unspent_skill_points - ?1, \
         updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = 1",
        params![cost],
    )
    .map_err(|e| e.to_string())?;

    let new_points: i64 = tx
        .query_row("SELECT unspent_skill_points FROM player_progress WHERE id = 1", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let mut ranks = HashMap::new();
    {
        let mut stmt = tx.prepare("SELECT skill_id, rank FROM skill_ranks").map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        }).map_err(|e| e.to_string())?;
        for row in rows {
            let (k, v) = row.map_err(|e| e.to_string())?;
            ranks.insert(k, v);
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok((new_points, ranks))
}

pub fn reconcile_progression(
    conn: &mut Connection,
    hunter_level: i64,
    unspent_skill_points: i64,
) -> Result<(i64, i64), String> {
    if hunter_level < 1 {
        return Err("invalid hunter_level".to_string());
    }
    if unspent_skill_points < 0 {
        return Err("invalid unspent_skill_points".to_string());
    }
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let (current_level, current_points): (i64, i64) = tx
        .query_row(
            "SELECT hunter_level, unspent_skill_points FROM player_progress WHERE id = 1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .map_err(|e| e.to_string())?;

    if hunter_level < current_level {
        return Err("hunter_level cannot decrease".to_string());
    }
    if unspent_skill_points < current_points {
        return Err("skill points cannot decrease".to_string());
    }
    if (unspent_skill_points - current_points) != (hunter_level - current_level) {
        return Err("skill points must match levels gained".to_string());
    }

    if hunter_level != current_level || unspent_skill_points != current_points {
        tx.execute(
            "UPDATE player_progress SET hunter_level = ?1, unspent_skill_points = ?2, \
             updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = 1",
            params![hunter_level, unspent_skill_points],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok((hunter_level, unspent_skill_points))
}

#[derive(serde::Deserialize, Clone)]
pub struct CraftRequirement {
    pub material_id: String,
    pub quantity: i64,
}

#[derive(serde::Deserialize)]
pub struct CraftInput {
    pub equipment_id: String,
    pub requirements: Vec<CraftRequirement>,
}

pub fn craft_equipment(
    conn: &mut Connection,
    input: &CraftInput,
) -> Result<(Vec<InventoryEntry>, Vec<String>), String> {
    if input.equipment_id.trim().is_empty() {
        return Err("invalid equipment_id".to_string());
    }
    if input.requirements.is_empty() {
        return Err("invalid requirements".to_string());
    }

    // Validate requirements.
    let mut consolidated: HashMap<String, i64> = HashMap::new();
    for r in &input.requirements {
        if r.material_id.trim().is_empty() {
            return Err("invalid material_id".to_string());
        }
        if r.quantity < 1 {
            return Err("invalid quantity".to_string());
        }
        *consolidated.entry(r.material_id.clone()).or_insert(0) += r.quantity;
    }

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Duplicate check.
    let already: i64 = tx
        .query_row(
            "SELECT COUNT(*) FROM owned_equipment WHERE equipment_id = ?1",
            params![input.equipment_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if already > 0 {
        return Err("equipment already owned".to_string());
    }

    // Check sufficiency.
    let mut missing: Vec<String> = Vec::new();
    for (material_id, required) in &consolidated {
        let have: i64 = tx
            .query_row(
                "SELECT COALESCE((SELECT quantity FROM inventory_materials WHERE material_id = ?1), 0)",
                params![material_id],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        if have < *required {
            missing.push(material_id.clone());
        }
    }
    if !missing.is_empty() {
        return Err("insufficient materials".to_string());
    }

    // Deduct.
    for (material_id, required) in &consolidated {
        tx.execute(
            "UPDATE inventory_materials SET quantity = quantity - ?1 WHERE material_id = ?2",
            params![required, material_id],
        )
        .map_err(|e| e.to_string())?;
        tx.execute(
            "DELETE FROM inventory_materials WHERE material_id = ?1 AND quantity <= 0",
            params![material_id],
        )
        .map_err(|e| e.to_string())?;
    }

    // Grant ownership.
    tx.execute(
        "INSERT INTO owned_equipment (equipment_id, crafted_at) VALUES (?1, strftime('%Y-%m-%dT%H:%M:%SZ','now'))",
        params![input.equipment_id],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    // Reload updated inventory + owned.
    let inventory = load_inventory(conn).map_err(|e| e.to_string())?;
    let owned = load_owned_equipment(conn).map_err(|e| e.to_string())?;
    Ok((inventory, owned))
}

pub fn set_equipment(
    conn: &mut Connection,
    slot: &str,
    equipment_id: Option<&str>,
) -> Result<HashMap<String, String>, String> {
    if !matches!(slot, "head" | "chest" | "feet") {
        return Err("invalid slot".to_string());
    }
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    if let Some(id) = equipment_id {
        if id.trim().is_empty() {
            return Err("invalid equipment_id".to_string());
        }
        let owned: i64 = tx
            .query_row(
                "SELECT COUNT(*) FROM owned_equipment WHERE equipment_id = ?1",
                params![id],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        if owned == 0 {
            return Err("equipment not owned".to_string());
        }
        let already: i64 = tx
            .query_row(
                "SELECT COUNT(*) FROM equipment_loadout WHERE equipment_id = ?1 AND slot != ?2",
                params![id, slot],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        if already > 0 {
            return Err("equipment already equipped".to_string());
        }
        tx.execute(
            "INSERT INTO equipment_loadout (slot, equipment_id) VALUES (?1, ?2) \
             ON CONFLICT(slot) DO UPDATE SET equipment_id = excluded.equipment_id",
            params![slot, id],
        )
        .map_err(|e| e.to_string())?;
    } else {
        tx.execute("DELETE FROM equipment_loadout WHERE slot = ?1", params![slot])
            .map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    load_equipment_loadout(conn).map_err(|e| e.to_string())
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
            hunter_level: 1,
            unspent_skill_points: 0,
            loot: vec![MaterialDropInput {
                material_id: "material.moss_gel".to_string(),
                quantity: 2,
            }],
            broken_part_ids: vec!["part.moss_crown".to_string()],
        }
    }

    #[test]
    fn migration_v2_to_v4_preserves_data() {
        let conn = Connection::open_in_memory().unwrap();
        // Simulate an old Phase 02 (v2) database.
        conn.execute_batch(include_str!("migrations/001_initial.sql")).unwrap();
        conn.execute_batch(include_str!("migrations/002_hunt_history.sql")).unwrap();
        seed(&conn).unwrap();
        conn.execute(
            "INSERT INTO hunt_history (hunt_id, map_id, monster_id, outcome, duration_ms, correct_keystrokes, incorrect_keystrokes, words_completed, xp_awarded, loot_json, broken_part_ids_json, completed_at) \
             VALUES ('h-old', 'map.verdant_forest', 'monster.moss_slime', 'victory', 10000, 5, 1, 2, 20, '[]', '[]', strftime('%Y-%m-%dT%H:%M:%SZ','now'))",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO inventory_materials (material_id, quantity) VALUES ('material.moss_gel', 7)",
            [],
        )
        .unwrap();
        conn.pragma_update(None, "user_version", 2).unwrap();

        // Migrate to current.
        migrate(&conn).unwrap();
        seed(&conn).unwrap();

        let version: i64 = conn
            .pragma_query_value(None, "user_version", |r| r.get(0))
            .unwrap();
        assert_eq!(version, 4);

        let history: i64 = conn
            .query_row("SELECT COUNT(*) FROM hunt_history", [], |r| r.get(0))
            .unwrap();
        assert_eq!(history, 1);

        let qty: i64 = conn
            .query_row(
                "SELECT quantity FROM inventory_materials WHERE material_id = 'material.moss_gel'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(qty, 7);

        // New tables exist and are empty.
        let skills: i64 = conn
            .query_row("SELECT COUNT(*) FROM skill_ranks", [], |r| r.get(0))
            .unwrap();
        assert_eq!(skills, 0);
        let owned: i64 = conn
            .query_row("SELECT COUNT(*) FROM owned_equipment", [], |r| r.get(0))
            .unwrap();
        assert_eq!(owned, 0);
        let loadout: i64 = conn
            .query_row("SELECT COUNT(*) FROM equipment_loadout", [], |r| r.get(0))
            .unwrap();
        assert_eq!(loadout, 0);
    }

    #[test]
    fn migration_reaches_latest_version() {
        let conn = Connection::open_in_memory().unwrap();
        migrate(&conn).unwrap();
        seed(&conn).unwrap();
        migrate(&conn).unwrap();
        let version: i64 = conn
            .pragma_query_value(None, "user_version", |r| r.get(0))
            .unwrap();
        assert_eq!(version, 4);
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
        assert_eq!(first.hunter_level, 1);
        assert_eq!(first.unspent_skill_points, 0);

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
    fn finalize_victory_grants_level() {
        let mut conn = setup();
        let mut input = base_input("victory");
        input.xp_awarded = 100;
        input.hunter_level = 2;
        input.unspent_skill_points = 1;
        let result = finalize_hunt(&mut conn, &input).unwrap();
        assert_eq!(result.xp_awarded, 100);
        assert_eq!(result.hunter_level, 2);
        assert_eq!(result.unspent_skill_points, 1);
        assert_eq!(result.total_xp, 100);

        let level: i64 = conn
            .query_row("SELECT hunter_level FROM player_progress WHERE id = 1", [], |r| r.get(0))
            .unwrap();
        assert_eq!(level, 2);
        let points: i64 = conn
            .query_row("SELECT unspent_skill_points FROM player_progress WHERE id = 1", [], |r| r.get(0))
            .unwrap();
        assert_eq!(points, 1);
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
        input.hunter_level = 0;
        let err = finalize_hunt(&mut conn, &input);
        assert!(err.is_err());

        let history_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM hunt_history", [], |r| r.get(0))
            .unwrap();
        assert_eq!(history_count, 0);
    }

    #[test]
    fn finalize_rejects_level_decrease() {
        let mut conn = setup();
        // First settle a level-2 victory.
        let mut input = base_input("victory");
        input.xp_awarded = 100;
        input.hunter_level = 2;
        input.unspent_skill_points = 1;
        finalize_hunt(&mut conn, &input).unwrap();

        // Now attempt a victory that claims level 1.
        let mut input2 = base_input("victory");
        input2.hunt_id = "hunt-2".to_string();
        input2.hunter_level = 1;
        input2.unspent_skill_points = 1;
        let err = finalize_hunt(&mut conn, &input2);
        assert!(err.is_err());
    }

    fn craft_input() -> CraftInput {
        CraftInput {
            equipment_id: "equipment.mossweave_vest".to_string(),
            requirements: vec![CraftRequirement {
                material_id: "material.moss_gel".to_string(),
                quantity: 2,
            }],
        }
    }

    #[test]
    fn craft_success_deducts_and_grants() {
        let mut conn = setup();
        // Seed inventory.
        conn.execute(
            "INSERT INTO inventory_materials (material_id, quantity) VALUES ('material.moss_gel', 3)",
            [],
        )
        .unwrap();
        let (inventory, owned) = craft_equipment(&mut conn, &craft_input()).unwrap();
        assert!(owned.contains(&"equipment.mossweave_vest".to_string()));
        let qty: i64 = inventory
            .iter()
            .find(|e| e.material_id == "material.moss_gel")
            .map(|e| e.quantity)
            .unwrap_or(0);
        assert_eq!(qty, 1);
    }

    #[test]
    fn craft_duplicate_fails_without_deducting() {
        let mut conn = setup();
        conn.execute(
            "INSERT INTO inventory_materials (material_id, quantity) VALUES ('material.moss_gel', 3)",
            [],
        )
        .unwrap();
        craft_equipment(&mut conn, &craft_input()).unwrap();
        // Add more material.
        conn.execute(
            "UPDATE inventory_materials SET quantity = 3 WHERE material_id = 'material.moss_gel'",
            [],
        )
        .unwrap();
        let err = craft_equipment(&mut conn, &craft_input());
        assert!(err.is_err());
        // Inventory unchanged.
        let qty: i64 = conn
            .query_row(
                "SELECT quantity FROM inventory_materials WHERE material_id = 'material.moss_gel'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(qty, 3);
    }

    #[test]
    fn craft_insufficient_fails_without_granting() {
        let mut conn = setup();
        conn.execute(
            "INSERT INTO inventory_materials (material_id, quantity) VALUES ('material.moss_gel', 1)",
            [],
        )
        .unwrap();
        let err = craft_equipment(&mut conn, &craft_input());
        assert!(err.is_err());
        let owned: i64 = conn
            .query_row("SELECT COUNT(*) FROM owned_equipment", [], |r| r.get(0))
            .unwrap();
        assert_eq!(owned, 0);
        // Inventory unchanged.
        let qty: i64 = conn
            .query_row(
                "SELECT quantity FROM inventory_materials WHERE material_id = 'material.moss_gel'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(qty, 1);
    }

    #[test]
    fn equip_requires_ownership() {
        let mut conn = setup();
        let err = set_equipment(&mut conn, "chest", Some("equipment.mossweave_vest"));
        assert!(err.is_err());
    }

    #[test]
    fn equip_and_unequip_persist() {
        let mut conn = setup();
        conn.execute(
            "INSERT INTO owned_equipment (equipment_id, crafted_at) VALUES ('equipment.mossweave_vest', strftime('%Y-%m-%dT%H:%M:%SZ','now'))",
            [],
        )
        .unwrap();
        let loadout = set_equipment(&mut conn, "chest", Some("equipment.mossweave_vest")).unwrap();
        assert_eq!(loadout.get("chest").map(String::as_str), Some("equipment.mossweave_vest"));

        let loadout = set_equipment(&mut conn, "chest", None).unwrap();
        assert!(loadout.get("chest").is_none());
    }

    #[test]
    fn equip_rejects_same_item_in_two_slots() {
        let mut conn = setup();
        conn.execute(
            "INSERT INTO owned_equipment (equipment_id, crafted_at) VALUES ('equipment.mossweave_vest', strftime('%Y-%m-%dT%H:%M:%SZ','now'))",
            [],
        )
        .unwrap();
        set_equipment(&mut conn, "chest", Some("equipment.mossweave_vest")).unwrap();
        let err = set_equipment(&mut conn, "head", Some("equipment.mossweave_vest"));
        assert!(err.is_err());
    }

    #[test]
    fn equip_replaces_same_slot() {
        let mut conn = setup();
        conn.execute(
            "INSERT INTO owned_equipment (equipment_id, crafted_at) VALUES ('equipment.moss_hood', strftime('%Y-%m-%dT%H:%M:%SZ','now'))",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO owned_equipment (equipment_id, crafted_at) VALUES ('equipment.mossweave_vest', strftime('%Y-%m-%dT%H:%M:%SZ','now'))",
            [],
        )
        .unwrap();
        set_equipment(&mut conn, "head", Some("equipment.moss_hood")).unwrap();
        set_equipment(&mut conn, "head", Some("equipment.mossweave_vest")).unwrap();
        let loadout = set_equipment(&mut conn, "head", None).unwrap();
        // after unequip, head is empty
        assert!(loadout.get("head").is_none());
    }

    #[test]
    fn purchase_skill_rank_insufficient_rolls_back() {
        let mut conn = setup();
        let err = purchase_skill_rank(&mut conn, "skill.power_strike", 1);
        assert!(err.is_err());
        let points: i64 = conn
            .query_row("SELECT unspent_skill_points FROM player_progress WHERE id = 1", [], |r| r.get(0))
            .unwrap();
        assert_eq!(points, 0);
        let ranks: i64 = conn
            .query_row("SELECT COUNT(*) FROM skill_ranks", [], |r| r.get(0))
            .unwrap();
        assert_eq!(ranks, 0);
    }

    #[test]
    fn purchase_skill_rank_success_persists() {
        let mut conn = setup();
        // Grant one point via a level-2 victory.
        let mut input = base_input("victory");
        input.xp_awarded = 100;
        input.hunter_level = 2;
        input.unspent_skill_points = 1;
        finalize_hunt(&mut conn, &input).unwrap();

        let (points, ranks) = purchase_skill_rank(&mut conn, "skill.power_strike", 1).unwrap();
        assert_eq!(points, 0);
        assert_eq!(ranks.get("skill.power_strike").copied(), Some(1));

        // Restore check: reload from the same connection.
        let stored_points: i64 = conn
            .query_row("SELECT unspent_skill_points FROM player_progress WHERE id = 1", [], |r| r.get(0))
            .unwrap();
        assert_eq!(stored_points, 0);
        let stored_rank: i64 = conn
            .query_row("SELECT rank FROM skill_ranks WHERE skill_id = 'skill.power_strike'", [], |r| r.get(0))
            .unwrap();
        assert_eq!(stored_rank, 1);
    }

    #[test]
    fn craft_failure_does_not_partial_write() {
        let mut conn = setup();
        conn.execute(
            "INSERT INTO inventory_materials (material_id, quantity) VALUES ('material.moss_gel', 1)",
            [],
        )
        .unwrap();
        // Requirement is 2; should fail without deducting or granting.
        let input = CraftInput {
            equipment_id: "equipment.mossweave_vest".to_string(),
            requirements: vec![CraftRequirement {
                material_id: "material.moss_gel".to_string(),
                quantity: 2,
            }],
        };
        let err = craft_equipment(&mut conn, &input);
        assert!(err.is_err());
        let owned: i64 = conn
            .query_row("SELECT COUNT(*) FROM owned_equipment", [], |r| r.get(0))
            .unwrap();
        assert_eq!(owned, 0);
        let qty: i64 = conn
            .query_row(
                "SELECT quantity FROM inventory_materials WHERE material_id = 'material.moss_gel'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(qty, 1);
    }

    #[test]
    fn equip_restore_after_reload() {
        let mut conn = setup();
        conn.execute(
            "INSERT INTO owned_equipment (equipment_id, crafted_at) VALUES ('equipment.moss_hood', strftime('%Y-%m-%dT%H:%M:%SZ','now'))",
            [],
        )
        .unwrap();
        set_equipment(&mut conn, "head", Some("equipment.moss_hood")).unwrap();
        let loadout = load_equipment_loadout(&conn).unwrap();
        assert_eq!(loadout.get("head").map(String::as_str), Some("equipment.moss_hood"));
    }
}