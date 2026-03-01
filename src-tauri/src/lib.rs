mod commands;
mod errors;
mod models;
mod telop_engine;
mod video_core;
mod export_engine;
mod beat_sync;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::telop::get_templates,
            commands::telop::burn_telop,
            commands::telop::parse_srt,
            commands::project::create_project,
            commands::project::save_project,
            commands::project::load_project,
            commands::project::probe_media,
            commands::project::import_media,
            commands::preview::extract_frame,
            commands::export::get_presets,
            commands::export::get_preset,
            commands::export::validate_export,
            commands::export::export_video,
            commands::beat_sync::detect_beats,
            commands::beat_sync::get_waveform,
            commands::beat_sync::snap_time_to_beat,
            commands::font::list_system_fonts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
