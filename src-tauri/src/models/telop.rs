use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
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

/// Keyframe for animation interpolation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationKeyframe {
    pub t: f64,
    #[serde(default)]
    pub opacity: Option<f64>,
    #[serde(default)]
    pub translate_x: Option<f64>,
    #[serde(default)]
    pub translate_y: Option<f64>,
    #[serde(default)]
    pub scale: Option<f64>,
    #[serde(default)]
    pub rotate: Option<f64>,
}

/// The computed state of a single character at a given frame
#[derive(Debug, Clone, Default)]
pub struct CharRenderState {
    pub opacity: f64,
    pub translate_x: f64,
    pub translate_y: f64,
    pub scale: f64,
    pub rotate: f64,
}
