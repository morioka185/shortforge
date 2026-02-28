mod commands;
mod models;
mod telop_engine;
mod video_core;
// mod beat_sync;
// mod export_engine;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::telop::get_templates,
            commands::telop::burn_telop,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
