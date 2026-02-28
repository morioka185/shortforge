use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportPreset {
    pub platform: String,
    pub display_name: String,
    pub resolution: Resolution,
    pub aspect_ratio: String,
    pub max_duration_sec: u64,
    #[serde(default)]
    pub recommended_duration_sec: Option<u64>,
    pub fps: u32,
    pub codec: String,
    pub audio_codec: String,
    pub audio_sample_rate: u32,
    pub max_file_size_mb: u32,
    pub bitrate_kbps: u32,
    pub safe_zones: SafeZones,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SafeZones {
    pub top_px: u32,
    pub bottom_px: u32,
    pub right_px: u32,
}

pub fn load_preset(json_str: &str) -> Result<ExportPreset, String> {
    serde_json::from_str(json_str).map_err(|e| format!("Failed to parse preset: {e}"))
}

pub fn load_preset_file(path: &str) -> Result<ExportPreset, String> {
    let content =
        std::fs::read_to_string(path).map_err(|e| format!("Failed to read preset: {e}"))?;
    load_preset(&content)
}

pub fn load_all_presets(dir: &str) -> Result<Vec<ExportPreset>, String> {
    let entries =
        std::fs::read_dir(dir).map_err(|e| format!("Failed to read presets dir: {e}"))?;

    let mut presets = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {e}"))?;
        let path = entry.path();
        if path.extension().is_some_and(|ext| ext == "json") {
            let preset = load_preset_file(
                path.to_str()
                    .ok_or_else(|| "Invalid path".to_string())?,
            )?;
            presets.push(preset);
        }
    }

    presets.sort_by(|a, b| a.platform.cmp(&b.platform));
    Ok(presets)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_tiktok_preset() {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let preset_path = format!("{manifest_dir}/resources/presets/tiktok.json");
        if std::path::Path::new(&preset_path).exists() {
            let preset = load_preset_file(&preset_path).unwrap();
            assert_eq!(preset.platform, "tiktok");
            assert_eq!(preset.resolution.width, 1080);
            assert_eq!(preset.max_duration_sec, 180);
        }
    }
}
