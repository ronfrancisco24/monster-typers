use crate::db::{self, Db, GameSave, FinalizeHuntInput, FinalizedHunt, CraftInput};

fn valid_key(key: &str) -> bool {
    !key.is_empty()
        && key.len() <= 64
        && key
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '_' || c == '-')
}

fn valid_value(value: &str) -> bool {
    !value.is_empty() && value.len() <= 512
}

#[tauri::command]
pub fn load_game_save(state: tauri::State<Db>) -> Result<GameSave, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::migrate(&conn).map_err(|e| e.to_string())?;
    db::seed(&conn).map_err(|e| e.to_string())?;
    let profile = db::load_profile(&conn).map_err(|e| e.to_string())?;
    let settings = db::load_settings(&conn).map_err(|e| e.to_string())?;
    let inventory = db::load_inventory(&conn).map_err(|e| e.to_string())?;
    let skill_ranks = db::load_skill_ranks(&conn).map_err(|e| e.to_string())?;
    let owned_equipment = db::load_owned_equipment(&conn).map_err(|e| e.to_string())?;
    let equipment_loadout = db::load_equipment_loadout(&conn).map_err(|e| e.to_string())?;
    let unlocked_maps = db::load_unlocked_maps(&conn).map_err(|e| e.to_string())?;
    Ok(GameSave { profile, settings, inventory, skill_ranks, owned_equipment, equipment_loadout, unlocked_maps })
}

#[tauri::command]
pub fn set_setting(state: tauri::State<Db>, key: String, value: String) -> Result<(), String> {
    if !valid_key(&key) {
        return Err("invalid setting key".to_string());
    }
    if !valid_value(&value) {
        return Err("invalid value".to_string());
    }
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::set_setting(&conn, &key, &value).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn finalize_hunt(state: tauri::State<Db>, input: FinalizeHuntInput) -> Result<FinalizedHunt, String> {
    let mut conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::migrate(&conn).map_err(|e| e.to_string())?;
    db::seed(&conn).map_err(|e| e.to_string())?;
    db::finalize_hunt(&mut conn, &input)
}

#[tauri::command]
pub fn purchase_skill_rank(
    state: tauri::State<Db>,
    skill_id: String,
    cost: i64,
) -> Result<(i64, std::collections::HashMap<String, i64>), String> {
    let mut conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::migrate(&conn).map_err(|e| e.to_string())?;
    db::seed(&conn).map_err(|e| e.to_string())?;
    db::purchase_skill_rank(&mut conn, &skill_id, cost)
}

#[tauri::command]
pub fn reconcile_progression(
    state: tauri::State<Db>,
    hunter_level: i64,
    unspent_skill_points: i64,
) -> Result<(i64, i64), String> {
    let mut conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::migrate(&conn).map_err(|e| e.to_string())?;
    db::seed(&conn).map_err(|e| e.to_string())?;
    db::reconcile_progression(&mut conn, hunter_level, unspent_skill_points)
}

#[tauri::command]
pub fn craft_equipment(
    state: tauri::State<Db>,
    input: CraftInput,
) -> Result<(Vec<db::InventoryEntry>, Vec<String>), String> {
    let mut conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::migrate(&conn).map_err(|e| e.to_string())?;
    db::seed(&conn).map_err(|e| e.to_string())?;
    db::craft_equipment(&mut conn, &input)
}

#[tauri::command]
pub fn set_equipment(
    state: tauri::State<Db>,
    slot: String,
    equipment_id: Option<String>,
) -> Result<std::collections::HashMap<String, String>, String> {
    let mut conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::migrate(&conn).map_err(|e| e.to_string())?;
    db::seed(&conn).map_err(|e| e.to_string())?;
    db::set_equipment(&mut conn, &slot, equipment_id.as_deref())
}

#[tauri::command]
pub fn unlock_map(state: tauri::State<Db>, map_id: String) -> Result<(), String> {
    let mut conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::migrate(&conn).map_err(|e| e.to_string())?;
    db::seed(&conn).map_err(|e| e.to_string())?;
    db::unlock_map(&mut conn, &map_id)
}