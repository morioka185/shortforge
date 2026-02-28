use crate::beat_sync::analyzer::{analyze_beats, generate_waveform, BeatAnalysis};
use crate::beat_sync::detector::snap_to_beat;

#[tauri::command]
pub fn detect_beats(audio_path: String) -> Result<BeatAnalysis, String> {
    analyze_beats(&audio_path)
}

#[tauri::command]
pub fn get_waveform(audio_path: String, num_points: Option<usize>) -> Result<Vec<f32>, String> {
    let points = num_points.unwrap_or(500);
    generate_waveform(&audio_path, points)
}

#[tauri::command]
pub fn snap_time_to_beat(
    beats: Vec<crate::beat_sync::analyzer::BeatInfo>,
    time_ms: u64,
    threshold_ms: Option<u64>,
) -> u64 {
    let threshold = threshold_ms.unwrap_or(100);
    snap_to_beat(&beats, time_ms, threshold)
}
