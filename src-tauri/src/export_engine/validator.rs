use super::preset::ExportPreset;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub warnings: Vec<ValidationWarning>,
    pub errors: Vec<ValidationError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationWarning {
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationError {
    pub code: String,
    pub message: String,
}

pub fn validate_for_export(
    duration_ms: u64,
    width: u32,
    height: u32,
    preset: &ExportPreset,
) -> ValidationResult {
    let mut warnings = Vec::new();
    let mut errors = Vec::new();

    // Duration check
    let duration_sec = duration_ms / 1000;
    if duration_sec > preset.max_duration_sec {
        errors.push(ValidationError {
            code: "DURATION_EXCEEDED".to_string(),
            message: format!(
                "動画の長さ({duration_sec}秒)が{}の最大長({})秒を超えています",
                preset.display_name, preset.max_duration_sec
            ),
        });
    }

    if let Some(recommended) = preset.recommended_duration_sec {
        if duration_sec > recommended {
            warnings.push(ValidationWarning {
                code: "DURATION_LONG".to_string(),
                message: format!(
                    "{}では{recommended}秒以下が推奨されています（現在: {duration_sec}秒）",
                    preset.display_name
                ),
            });
        }
    }

    // Resolution check
    if width != preset.resolution.width || height != preset.resolution.height {
        warnings.push(ValidationWarning {
            code: "RESOLUTION_MISMATCH".to_string(),
            message: format!(
                "解像度({width}x{height})が{}の推奨({}x{})と異なります",
                preset.display_name, preset.resolution.width, preset.resolution.height
            ),
        });
    }

    // Aspect ratio check
    let aspect = width as f64 / height as f64;
    let expected_aspect = 9.0 / 16.0;
    if (aspect - expected_aspect).abs() > 0.01 {
        errors.push(ValidationError {
            code: "ASPECT_RATIO".to_string(),
            message: format!(
                "アスペクト比が9:16ではありません（現在: {:.2}）",
                aspect
            ),
        });
    }

    ValidationResult {
        valid: errors.is_empty(),
        warnings,
        errors,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::export_engine::preset::{Resolution, SafeZones};

    fn tiktok_preset() -> ExportPreset {
        ExportPreset {
            platform: "tiktok".to_string(),
            display_name: "TikTok".to_string(),
            resolution: Resolution {
                width: 1080,
                height: 1920,
            },
            aspect_ratio: "9:16".to_string(),
            max_duration_sec: 180,
            recommended_duration_sec: Some(60),
            fps: 30,
            codec: "h264".to_string(),
            audio_codec: "aac".to_string(),
            audio_sample_rate: 44100,
            max_file_size_mb: 287,
            bitrate_kbps: 6000,
            safe_zones: SafeZones {
                top_px: 120,
                bottom_px: 280,
                right_px: 80,
            },
        }
    }

    #[test]
    fn test_valid_project() {
        let result = validate_for_export(30000, 1080, 1920, &tiktok_preset());
        assert!(result.valid);
        assert!(result.errors.is_empty());
    }

    #[test]
    fn test_duration_exceeded() {
        let result = validate_for_export(200_000, 1080, 1920, &tiktok_preset());
        assert!(!result.valid);
        assert!(result.errors.iter().any(|e| e.code == "DURATION_EXCEEDED"));
    }

    #[test]
    fn test_duration_warning() {
        let result = validate_for_export(90_000, 1080, 1920, &tiktok_preset());
        assert!(result.valid);
        assert!(result.warnings.iter().any(|w| w.code == "DURATION_LONG"));
    }

    #[test]
    fn test_resolution_mismatch() {
        let result = validate_for_export(30000, 720, 1280, &tiktok_preset());
        assert!(result.warnings.iter().any(|w| w.code == "RESOLUTION_MISMATCH"));
    }
}
