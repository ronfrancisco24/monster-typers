use crate::db::{self, Db, GameSave, FinalizeHuntInput, FinalizedHunt};

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
    Ok(GameSave { profile, settings, inventory })
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