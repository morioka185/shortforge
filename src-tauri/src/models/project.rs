use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShortForgeProject {
    pub version: String,
    pub metadata: ProjectMetadata,
    pub canvas: Canvas,
    pub tracks: Vec<super::timeline::TimelineTrack>,
    #[serde(default)]
    pub beat_markers: Vec<BeatMarker>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMetadata {
    pub name: String,
    pub created_at: String,
    pub platform: Platform,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Platform {
    Tiktok,
    YoutubeShorts,
    InstagramReels,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Canvas {
    pub width: u32,
    pub height: u32,
    pub fps: u32,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BeatMarker {
    pub time_ms: u64,
    pub strength: f64,
}
