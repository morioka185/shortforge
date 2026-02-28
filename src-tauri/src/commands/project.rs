use crate::models::project::{Canvas, Platform, ProjectMetadata, ShortForgeProject};
use crate::models::timeline::TimelineTrack;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct MediaInfo {
    pub path: String,
    pub width: u32,
    pub height: u32,
    pub duration_ms: u64,
    pub fps: f64,
    pub has_audio: bool,
}

#[command]
pub fn create_project(name: String, platform: Platform) -> Result<ShortForgeProject, String> {
    let now = chrono::Utc::now().to_rfc3339();
    Ok(ShortForgeProject {
        version: "1.0.0".to_string(),
        metadata: ProjectMetadata {
            name,
            created_at: now,
            platform,
        },
        canvas: Canvas {
            width: 1080,
            height: 1920,
            fps: 30,
            duration_ms: 0,
        },
        tracks: vec![],
        beat_markers: vec![],
    })
}

#[command]
pub fn save_project(project: ShortForgeProject, path: String) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&project)
        .map_err(|e| format!("Failed to serialize project: {e}"))?;
    std::fs::write(&path, json).map_err(|e| format!("Failed to write project file: {e}"))?;
    Ok(())
}

#[command]
pub fn load_project(path: String) -> Result<ShortForgeProject, String> {
    let content =
        std::fs::read_to_string(&path).map_err(|e| format!("Failed to read project: {e}"))?;
    serde_json::from_str(&content).map_err(|e| format!("Failed to parse project: {e}"))
}

#[command]
pub fn probe_media(path: String) -> Result<MediaInfo, String> {
    ffmpeg_next::init().map_err(|e| format!("Failed to init ffmpeg: {e}"))?;

    let ctx =
        ffmpeg_next::format::input(&path).map_err(|e| format!("Failed to open media: {e}"))?;

    let video_stream = ctx.streams().best(ffmpeg_next::media::Type::Video);
    let audio_stream = ctx.streams().best(ffmpeg_next::media::Type::Audio);

    let (width, height, fps) = if let Some(vs) = video_stream {
        let decoder = ffmpeg_next::codec::Context::from_parameters(vs.parameters())
            .and_then(|c| c.decoder().video())
            .map_err(|e| format!("Failed to decode video info: {e}"))?;

        let fps_rat = vs.avg_frame_rate();
        let fps = if fps_rat.denominator() > 0 {
            fps_rat.numerator() as f64 / fps_rat.denominator() as f64
        } else {
            30.0
        };

        (decoder.width(), decoder.height(), fps)
    } else {
        (0, 0, 0.0)
    };

    let duration = ctx.duration();
    let duration_ms = if duration > 0 {
        (duration as f64 / ffmpeg_next::ffi::AV_TIME_BASE as f64 * 1000.0) as u64
    } else {
        0
    };

    Ok(MediaInfo {
        path,
        width,
        height,
        duration_ms,
        fps,
        has_audio: audio_stream.is_some(),
    })
}

#[command]
pub fn import_media(
    project: ShortForgeProject,
    media_path: String,
) -> Result<ShortForgeProject, String> {
    let info = probe_media(media_path)?;
    let mut project = project;

    // Update canvas duration if needed
    if info.duration_ms > project.canvas.duration_ms {
        project.canvas.duration_ms = info.duration_ms;
    }

    // Add video track if not exists
    let video_track_exists = project.tracks.iter().any(|t| t.track_type == crate::models::timeline::TrackType::Video);

    if !video_track_exists {
        let clip = serde_json::json!({
            "id": format!("clip-{}", project.tracks.len() + 1),
            "source": info.path,
            "start_ms": 0,
            "end_ms": info.duration_ms,
            "trim_start_ms": 0,
            "trim_end_ms": info.duration_ms,
        });

        project.tracks.push(TimelineTrack {
            id: format!("video-{}", project.tracks.len() + 1),
            track_type: crate::models::timeline::TrackType::Video,
            clips: vec![clip],
        });
    }

    // Add audio track if media has audio
    if info.has_audio {
        let audio_track_exists = project.tracks.iter().any(|t| t.track_type == crate::models::timeline::TrackType::Audio);
        if !audio_track_exists {
            let clip = serde_json::json!({
                "id": format!("audio-clip-{}", project.tracks.len() + 1),
                "source": info.path,
                "start_ms": 0,
                "end_ms": info.duration_ms,
                "volume": 1.0,
            });

            project.tracks.push(TimelineTrack {
                id: format!("audio-{}", project.tracks.len() + 1),
                track_type: crate::models::timeline::TrackType::Audio,
                clips: vec![clip],
            });
        }
    }

    Ok(project)
}
