use crate::export_engine::preset::{ExportPreset, load_all_presets, load_preset_file};
use crate::export_engine::renderer::{render_export, AudioSource, ExportProgress};
use crate::export_engine::validator::{validate_for_export, ValidationResult};
use crate::models::telop::SubtitleCue;
use crate::telop_engine::parser::parse_srt_file;
use crate::telop_engine::template::load_template_file;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportProgressEvent {
    pub current_frame: u64,
    pub total_frames: u64,
    pub percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioSourceParam {
    pub path: String,
    pub start_ms: u64,
    pub end_ms: u64,
}

#[tauri::command]
pub fn get_presets(presets_dir: Option<String>) -> Result<Vec<ExportPreset>, String> {
    let dir = presets_dir.unwrap_or_else(|| {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        format!("{manifest_dir}/resources/presets")
    });
    load_all_presets(&dir)
}

#[tauri::command]
pub fn get_preset(preset_path: String) -> Result<ExportPreset, String> {
    load_preset_file(&preset_path)
}

#[tauri::command]
pub fn validate_export(
    duration_ms: u64,
    width: u32,
    height: u32,
    platform: String,
    presets_dir: Option<String>,
) -> Result<ValidationResult, String> {
    let dir = presets_dir.unwrap_or_else(|| {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        format!("{manifest_dir}/resources/presets")
    });
    let presets = load_all_presets(&dir)?;
    let preset = presets
        .iter()
        .find(|p| p.platform == platform)
        .ok_or_else(|| format!("Preset not found: {platform}"))?;

    Ok(validate_for_export(duration_ms, width, height, preset))
}

#[tauri::command]
pub fn export_video(
    app: AppHandle,
    input_video: String,
    output_path: String,
    srt_file: Option<String>,
    template_path: Option<String>,
    platform: String,
    presets_dir: Option<String>,
    audio_sources: Option<Vec<AudioSourceParam>>,
) -> Result<String, String> {
    let dir = presets_dir.unwrap_or_else(|| {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        format!("{manifest_dir}/resources/presets")
    });
    let presets = load_all_presets(&dir)?;
    let preset = presets
        .into_iter()
        .find(|p| p.platform == platform)
        .ok_or_else(|| format!("Preset not found: {platform}"))?;

    let cues: Vec<SubtitleCue> = if let Some(srt) = &srt_file {
        parse_srt_file(srt)?
    } else {
        Vec::new()
    };

    let template = if let Some(tp) = &template_path {
        load_template_file(tp)?
    } else {
        crate::telop_engine::template::TelopTemplate::default()
    };

    let sources: Vec<AudioSource> = audio_sources
        .unwrap_or_default()
        .into_iter()
        .map(|s| AudioSource {
            path: s.path,
            start_ms: s.start_ms,
            end_ms: s.end_ms,
        })
        .collect();

    let progress_cb = move |progress: ExportProgress| {
        let _ = app.emit(
            "export-progress",
            ExportProgressEvent {
                current_frame: progress.current_frame,
                total_frames: progress.total_frames,
                percent: progress.percent,
            },
        );
    };

    render_export(
        &input_video,
        &output_path,
        &cues,
        &template,
        &preset,
        &sources,
        Some(&progress_cb),
    )?;

    Ok(output_path)
}
