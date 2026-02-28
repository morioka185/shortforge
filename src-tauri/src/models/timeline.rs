use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineTrack {
    pub id: String,
    #[serde(rename = "type")]
    pub track_type: TrackType,
    pub clips: Vec<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TrackType {
    Video,
    Telop,
    Audio,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoClip {
    pub id: String,
    pub source: String,
    pub start_ms: u64,
    pub end_ms: u64,
    pub trim_start_ms: u64,
    pub trim_end_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioClip {
    pub id: String,
    pub source: String,
    pub start_ms: u64,
    pub end_ms: u64,
    pub volume: f32,
}
