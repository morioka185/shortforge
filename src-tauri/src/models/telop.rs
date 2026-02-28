use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleCue {
    pub index: usize,
    pub start_ms: u64,
    pub end_ms: u64,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelopStyle {
    pub font_family: String,
    pub font_size: f32,
    pub font_weight: u32,
    pub color: String,
    #[serde(default)]
    pub outline: Option<OutlineStyle>,
    #[serde(default)]
    pub shadow: Option<ShadowStyle>,
    #[serde(default)]
    pub position: Option<Position>,
    #[serde(default)]
    pub alignment: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutlineStyle {
    pub enabled: bool,
    pub color: String,
    pub width: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShadowStyle {
    pub enabled: bool,
    pub color: String,
    pub offset_x: f32,
    pub offset_y: f32,
    pub blur: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f32,
    pub y: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelopAnimation {
    #[serde(rename = "type")]
    pub animation_type: String,
    #[serde(default)]
    pub speed: Option<String>,
    #[serde(default)]
    pub delay_per_char_ms: Option<u64>,
    #[serde(default)]
    pub easing: Option<String>,
}
