use crate::models::telop::SubtitleCue;
use crate::telop_engine::parser;
use crate::telop_engine::renderer;
use crate::telop_engine::template;
use crate::video_core::decoder::VideoDecoder;
use crate::video_core::encoder::VideoEncoder;
use tauri::command;

#[command]
pub fn parse_srt(path: String) -> Result<Vec<SubtitleCue>, String> {
    parser::parse_srt_file(&path)
}

#[command]
pub fn get_templates(templates_dir: Option<String>) -> Result<Vec<template::TelopTemplate>, String> {
    let dir = templates_dir.unwrap_or_else(|| {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        format!("{manifest_dir}/../templates")
    });
    template::load_templates_from_dir(&dir)
}

#[command]
pub fn burn_telop(
    input_video: String,
    srt_file: String,
    template_id: String,
    templates_dir: Option<String>,
    output_path: String,
    bitrate: Option<usize>,
) -> Result<String, String> {
    // Load templates and find the selected one
    let dir = templates_dir.unwrap_or_else(|| {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        format!("{manifest_dir}/../templates")
    });
    let templates = template::load_templates_from_dir(&dir)?;
    let tmpl = templates
        .iter()
        .find(|t| t.id == template_id)
        .ok_or_else(|| format!("Template '{template_id}' not found"))?;

    // Parse SRT
    let cues = parser::parse_srt_file(&srt_file)?;

    // Open input video
    let mut decoder = VideoDecoder::open(&input_video)?;
    let width = decoder.width();
    let height = decoder.height();
    let fps = decoder.fps();
    let bitrate = bitrate.unwrap_or(6_000_000);

    // Create encoder
    let mut encoder = VideoEncoder::new(&output_path, width, height, fps, bitrate)?;

    // Process each frame
    let tmpl_clone = tmpl.clone();
    let cues_clone = cues.clone();

    decoder.decode_frames(|mut frame| {
        let current_time_ms = frame.pts_ms;
        renderer::render_telop_on_frame(&mut frame, &cues_clone, &tmpl_clone, current_time_ms);
        encoder.write_frame(&frame)?;
        Ok(())
    })?;

    encoder.finish()?;

    Ok(output_path)
}
