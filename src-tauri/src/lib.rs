mod commands;
mod db;

use commands::{finalize_hunt, load_game_save, set_setting};
use db::Db;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;
            let db_path = data_dir.join("monster_typers.db");
            let conn = rusqlite::Connection::open(&db_path)?;
            db::migrate(&conn)?;
            db::seed(&conn)?;
            app.manage(Db {
                conn: std::sync::Mutex::new(conn),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![finalize_hunt, load_game_save, set_setting])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}