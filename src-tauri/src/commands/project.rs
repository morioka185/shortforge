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

fn is_image_extension(path: &str) -> bool {
    let lower = path.to_lowercase();
    matches!(
        std::path::Path::new(&lower)
            .extension()
            .and_then(|e| e.to_str()),
        Some("png" | "jpg" | "jpeg" | "gif" | "webp" | "bmp" | "tiff")
    )
}

#[command]
pub fn probe_media(path: String) -> Result<MediaInfo, String> {
    ffmpeg_next::init().map_err(|e| format!("Failed to init ffmpeg: {e}"))?;

    let ctx =
        ffmpeg_next::format::input(&path).map_err(|e| format!("Failed to open media: {e}"))?;

    let video_stream = ctx.streams().best(ffmpeg_next::media::Type::Video);
    let audio_stream = ctx.streams().best(ffmpeg_next::media::Type::Audio);

    let is_image = is_image_extension(&path);

    let (width, height, fps) = if let Some(vs) = video_stream {
        let decoder = ffmpeg_next::codec::Context::from_parameters(vs.parameters())
            .and_then(|c| c.decoder().video())
            .map_err(|e| format!("Failed to decode video info: {e}"))?;

        if is_image {
            (decoder.width(), decoder.height(), 0.0)
        } else {
            let fps_rat = vs.avg_frame_rate();
            let fps = if fps_rat.denominator() > 0 {
                fps_rat.numerator() as f64 / fps_rat.denominator() as f64
            } else {
                30.0
            };
            (decoder.width(), decoder.height(), fps)
        }
    } else {
        (0, 0, 0.0)
    };

    let duration_ms = if is_image {
        0
    } else {
        let duration = ctx.duration();
        if duration > 0 {
            (duration as f64 / ffmpeg_next::ffi::AV_TIME_BASE as f64 * 1000.0) as u64
        } else {
            0
        }
    };

    Ok(MediaInfo {
        path,
        width,
        height,
        duration_ms,
        fps,
        has_audio: if is_image { false } else { audio_stream.is_some() },
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_image_extension_png() {
        assert!(is_image_extension("photo.png"));
    }

    #[test]
    fn test_is_image_extension_jpg() {
        assert!(is_image_extension("photo.jpg"));
    }

    #[test]
    fn test_is_image_extension_jpeg() {
        assert!(is_image_extension("photo.jpeg"));
    }

    #[test]
    fn test_is_image_extension_gif() {
        assert!(is_image_extension("animation.gif"));
    }

    #[test]
    fn test_is_image_extension_webp() {
        assert!(is_image_extension("image.webp"));
    }

    #[test]
    fn test_is_image_extension_bmp() {
        assert!(is_image_extension("bitmap.bmp"));
    }

    #[test]
    fn test_is_image_extension_tiff() {
        assert!(is_image_extension("scan.tiff"));
    }

    #[test]
    fn test_is_image_extension_case_insensitive() {
        assert!(is_image_extension("PHOTO.PNG"));
        assert!(is_image_extension("Image.JPG"));
        assert!(is_image_extension("pic.Jpeg"));
    }

    #[test]
    fn test_is_image_extension_video_not_image() {
        assert!(!is_image_extension("video.mp4"));
        assert!(!is_image_extension("movie.mov"));
        assert!(!is_image_extension("clip.webm"));
        assert!(!is_image_extension("film.avi"));
    }

    #[test]
    fn test_is_image_extension_audio_not_image() {
        assert!(!is_image_extension("song.mp3"));
        assert!(!is_image_extension("track.wav"));
        assert!(!is_image_extension("audio.aac"));
        assert!(!is_image_extension("music.m4a"));
    }

    #[test]
    fn test_is_image_extension_no_extension() {
        assert!(!is_image_extension("noext"));
    }

    #[test]
    fn test_is_image_extension_with_path() {
        assert!(is_image_extension("/Users/test/photos/image.png"));
        assert!(is_image_extension("C:\\Users\\test\\photo.jpg"));
    }
}
