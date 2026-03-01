use crate::export_engine::preset::ExportPreset;
use crate::models::telop::SubtitleCue;
use crate::telop_engine::renderer::render_telop_on_frame;
use crate::telop_engine::template::TelopTemplate;
use crate::video_core::decoder::VideoDecoder;
use crate::video_core::encoder::VideoEncoder;
use std::process::Command;

pub struct ExportProgress {
    pub current_frame: u64,
    pub total_frames: u64,
    pub percent: f64,
}

/// Audio source for mixing into the exported video
#[derive(Debug, Clone)]
pub struct AudioSource {
    pub path: String,
    pub start_ms: u64,
    pub end_ms: u64,
}

/// Render a video with telop overlay for a specific platform preset
pub fn render_export(
    input_video: &str,
    output_path: &str,
    cues: &[SubtitleCue],
    template: &TelopTemplate,
    preset: &ExportPreset,
    audio_sources: &[AudioSource],
    progress_callback: Option<&dyn Fn(ExportProgress)>,
) -> Result<(), String> {
    // If we have audio sources, render video-only first then mux audio
    let needs_audio_mux = !audio_sources.is_empty();
    let video_only_path = if needs_audio_mux {
        let mut tmp = std::path::PathBuf::from(output_path);
        tmp.set_extension("_video_only.mp4");
        tmp.to_string_lossy().to_string()
    } else {
        output_path.to_string()
    };

    let mut decoder = VideoDecoder::open(input_video)?;
    let width = decoder.width();
    let height = decoder.height();
    let fps = decoder.fps();

    let bitrate = (preset.bitrate_kbps as usize) * 1000;

    let mut encoder = VideoEncoder::new(&video_only_path, width, height, fps, bitrate)?;

    let total_frames = (decoder.duration_ms() as f64 / 1000.0 * fps) as u64;
    let mut frame_count: u64 = 0;

    let cues = cues.to_vec();
    let template = template.clone();

    decoder.decode_frames(|mut frame| {
        let pts = frame.pts_ms;
        render_telop_on_frame(&mut frame, &cues, &template, pts);
        encoder.write_frame(&frame)?;

        frame_count += 1;
        if let Some(cb) = &progress_callback {
            cb(ExportProgress {
                current_frame: frame_count,
                total_frames,
                percent: if total_frames > 0 {
                    frame_count as f64 / total_frames as f64 * 100.0
                } else {
                    0.0
                },
            });
        }

        Ok(())
    })?;

    encoder.finish()?;

    if needs_audio_mux {
        mux_audio(
            &video_only_path,
            input_video,
            audio_sources,
            output_path,
            preset,
        )?;
        // Clean up temporary video-only file
        let _ = std::fs::remove_file(&video_only_path);
    }

    Ok(())
}

/// Mix audio streams into the final video using ffmpeg CLI.
///
/// Takes the video-only rendered file, the original video (for its audio stream),
/// and additional audio sources (BGM etc.), and produces the final output.
fn mux_audio(
    video_only_path: &str,
    original_video: &str,
    audio_sources: &[AudioSource],
    output_path: &str,
    preset: &ExportPreset,
) -> Result<(), String> {
    let mut cmd = Command::new("ffmpeg");
    cmd.arg("-y"); // overwrite output

    // Input 0: video-only rendered file (use video stream)
    cmd.args(["-i", video_only_path]);
    // Input 1: original video (use audio stream)
    cmd.args(["-i", original_video]);

    // Additional audio inputs
    for (i, src) in audio_sources.iter().enumerate() {
        // Apply time offset for audio clips that don't start at 0
        if src.start_ms > 0 {
            let delay_sec = src.start_ms as f64 / 1000.0;
            cmd.args(["-itsoffset", &format!("{delay_sec:.3}")]);
        }
        cmd.args(["-i", &src.path]);
        // Log for debugging
        eprintln!(
            "Audio source {}: {} (start={}ms, end={}ms)",
            i + 2,
            src.path,
            src.start_ms,
            src.end_ms
        );
    }

    // Build filter_complex for audio mixing
    let total_audio_inputs = 1 + audio_sources.len(); // original audio + BGM tracks
    if total_audio_inputs == 1 {
        // Only original audio, no mixing needed
        cmd.args([
            "-map", "0:v:0",   // video from rendered file
            "-map", "1:a:0?",  // audio from original video (optional)
            "-c:v", "copy",
            "-c:a", "aac",
            "-ar", &preset.audio_sample_rate.to_string(),
        ]);
    } else {
        // Multiple audio streams — use amix filter
        let mut filter = String::new();
        // [1:a] is the original video's audio
        for i in 0..total_audio_inputs {
            filter.push_str(&format!("[{}:a]", i + 1));
        }
        filter.push_str(&format!(
            "amix=inputs={total_audio_inputs}:duration=longest:dropout_transition=2[aout]"
        ));

        cmd.args([
            "-map", "0:v:0",
            "-filter_complex", &filter,
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac",
            "-ar", &preset.audio_sample_rate.to_string(),
        ]);
    }

    cmd.arg(output_path);

    eprintln!("Running ffmpeg: {:?}", cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to run ffmpeg: {e}. Is ffmpeg installed?"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ffmpeg audio mux failed: {stderr}"));
    }

    Ok(())
}
