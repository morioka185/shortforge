use crate::models::telop::{AnimationKeyframe, TelopStyle};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelopTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub animation: TemplateAnimation,
    pub default_style: TelopStyle,
    #[serde(default)]
    pub preview_text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateAnimation {
    pub unit: AnimationUnit,
    /// Single property animation (from/to style)
    #[serde(default)]
    pub property: Option<String>,
    /// Multi-property animation (keyframe style)
    #[serde(default)]
    pub properties: Option<Vec<String>>,
    #[serde(default)]
    pub from: Option<serde_json::Value>,
    #[serde(default)]
    pub to: Option<serde_json::Value>,
    #[serde(default)]
    pub keyframes: Option<Vec<AnimationKeyframe>>,
    pub duration_ms: u64,
    pub delay_per_unit_ms: u64,
    pub easing: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AnimationUnit {
    Character,
    Word,
}

/// Load a template from a JSON string
pub fn load_template(json_str: &str) -> Result<TelopTemplate, String> {
    serde_json::from_str(json_str).map_err(|e| format!("Failed to parse template JSON: {e}"))
}

/// Load a template from a file path
pub fn load_template_file(path: &str) -> Result<TelopTemplate, String> {
    let content =
        std::fs::read_to_string(path).map_err(|e| format!("Failed to read template file: {e}"))?;
    load_template(&content)
}

/// Load all templates from a directory
pub fn load_templates_from_dir(dir: &str) -> Result<Vec<TelopTemplate>, String> {
    let entries =
        std::fs::read_dir(dir).map_err(|e| format!("Failed to read template directory: {e}"))?;

    let mut templates = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {e}"))?;
        let path = entry.path();
        if path.extension().is_some_and(|ext| ext == "json") {
            let template = load_template_file(
                path.to_str()
                    .ok_or_else(|| "Invalid path encoding".to_string())?,
            )?;
            templates.push(template);
        }
    }

    templates.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(templates)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_typewriter_template() {
        let json = r##"{
            "id": "typewriter",
            "name": "タイプライター",
            "description": "左から1文字ずつ表示",
            "category": "basic",
            "animation": {
                "unit": "character",
                "property": "opacity",
                "from": { "opacity": 0.0 },
                "to": { "opacity": 1.0 },
                "duration_ms": 50,
                "delay_per_unit_ms": 70,
                "easing": "ease"
            },
            "default_style": {
                "font_family": "Noto Sans JP",
                "font_size": 40,
                "font_weight": 900,
                "color": "#FFFFFF",
                "outline": { "enabled": true, "color": "#000000", "width": 2 }
            },
            "preview_text": "サンプルテキスト"
        }"##;

        let template = load_template(json).unwrap();
        assert_eq!(template.id, "typewriter");
        assert_eq!(template.name, "タイプライター");
        assert_eq!(template.animation.duration_ms, 50);
        assert_eq!(template.animation.delay_per_unit_ms, 70);
        assert_eq!(template.default_style.font_size, 40.0);
    }

    #[test]
    fn test_load_bounce_template() {
        let json = r##"{
            "id": "bounce",
            "name": "バウンス",
            "description": "1文字ずつ跳ねて登場",
            "category": "dynamic",
            "animation": {
                "unit": "character",
                "properties": ["opacity", "translate_y", "scale"],
                "keyframes": [
                    { "t": 0.0, "opacity": 0, "translate_y": 40, "scale": 0.3 },
                    { "t": 0.5, "opacity": 1, "translate_y": -12, "scale": 1.05 },
                    { "t": 0.7, "opacity": 1, "translate_y": 4, "scale": 0.97 },
                    { "t": 1.0, "opacity": 1, "translate_y": 0, "scale": 1.0 }
                ],
                "duration_ms": 500,
                "delay_per_unit_ms": 60,
                "easing": "cubic-bezier(0.34, 1.56, 0.64, 1)"
            },
            "default_style": {
                "font_family": "Dela Gothic One",
                "font_size": 44,
                "font_weight": 900,
                "color": "#FFFC00",
                "outline": { "enabled": true, "color": "#000000", "width": 3 }
            }
        }"##;

        let template = load_template(json).unwrap();
        assert_eq!(template.id, "bounce");
        let keyframes = template.animation.keyframes.unwrap();
        assert_eq!(keyframes.len(), 4);
        assert_eq!(keyframes[0].t, 0.0);
        assert_eq!(keyframes[0].opacity, Some(0.0));
    }

    #[test]
    fn test_load_templates_from_dir() {
        // This test uses the actual templates directory
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let templates_dir = format!("{manifest_dir}/../templates");

        if std::path::Path::new(&templates_dir).exists() {
            let templates = load_templates_from_dir(&templates_dir).unwrap();
            assert!(!templates.is_empty(), "Should load at least one template");
        }
    }
}
