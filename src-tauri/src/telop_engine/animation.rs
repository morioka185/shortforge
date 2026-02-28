use crate::models::telop::{AnimationKeyframe, CharRenderState};
use crate::telop_engine::template::TelopTemplate;

/// Parse a cubic-bezier string like "cubic-bezier(0.34, 1.56, 0.64, 1)"
/// Returns (x1, y1, x2, y2) control points
fn parse_cubic_bezier(easing: &str) -> Option<(f64, f64, f64, f64)> {
    let trimmed = easing.trim();
    if let Some(inner) = trimmed
        .strip_prefix("cubic-bezier(")
        .and_then(|s| s.strip_suffix(')'))
    {
        let parts: Vec<f64> = inner.split(',').filter_map(|s| s.trim().parse().ok()).collect();
        if parts.len() == 4 {
            return Some((parts[0], parts[1], parts[2], parts[3]));
        }
    }
    None
}

/// Evaluate a cubic bezier curve at parameter t
/// Uses binary search to find t_curve for a given x, then returns y
fn cubic_bezier_at(x_target: f64, x1: f64, y1: f64, x2: f64, y2: f64) -> f64 {
    // Binary search for the t parameter that gives us x_target
    let mut lo = 0.0_f64;
    let mut hi = 1.0_f64;

    for _ in 0..20 {
        let mid = (lo + hi) / 2.0;
        let x = cubic_bezier_component(mid, x1, x2);
        if x < x_target {
            lo = mid;
        } else {
            hi = mid;
        }
    }

    let t = (lo + hi) / 2.0;
    cubic_bezier_component(t, y1, y2)
}

/// Calculate one component (x or y) of a cubic bezier at parameter t
/// B(t) = 3(1-t)^2*t*p1 + 3(1-t)*t^2*p2 + t^3
fn cubic_bezier_component(t: f64, p1: f64, p2: f64) -> f64 {
    let t2 = t * t;
    let t3 = t2 * t;
    let mt = 1.0 - t;
    let mt2 = mt * mt;
    3.0 * mt2 * t * p1 + 3.0 * mt * t2 * p2 + t3
}

/// Apply easing function to a linear progress value (0.0 - 1.0)
pub fn apply_easing(progress: f64, easing: &str) -> f64 {
    let progress = progress.clamp(0.0, 1.0);

    match easing.trim() {
        "linear" => progress,
        "ease" => cubic_bezier_at(progress, 0.25, 0.1, 0.25, 1.0),
        "ease-in" => cubic_bezier_at(progress, 0.42, 0.0, 1.0, 1.0),
        "ease-out" => cubic_bezier_at(progress, 0.0, 0.0, 0.58, 1.0),
        "ease-in-out" => cubic_bezier_at(progress, 0.42, 0.0, 0.58, 1.0),
        other => {
            if let Some((x1, y1, x2, y2)) = parse_cubic_bezier(other) {
                cubic_bezier_at(progress, x1, y1, x2, y2)
            } else {
                // Fallback to linear
                progress
            }
        }
    }
}

/// Interpolate between keyframes at a given eased progress value
pub fn interpolate_keyframes(keyframes: &[AnimationKeyframe], progress: f64) -> CharRenderState {
    if keyframes.is_empty() {
        return CharRenderState {
            opacity: 1.0,
            scale: 1.0,
            ..Default::default()
        };
    }

    if keyframes.len() == 1 {
        return keyframe_to_state(&keyframes[0]);
    }

    // Find the two keyframes we're between
    let progress = progress.clamp(0.0, 1.0);

    // If before first keyframe
    if progress <= keyframes[0].t {
        return keyframe_to_state(&keyframes[0]);
    }

    // If after last keyframe
    if progress >= keyframes[keyframes.len() - 1].t {
        return keyframe_to_state(&keyframes[keyframes.len() - 1]);
    }

    // Find the segment
    for i in 0..keyframes.len() - 1 {
        let kf_a = &keyframes[i];
        let kf_b = &keyframes[i + 1];

        if progress >= kf_a.t && progress <= kf_b.t {
            let segment_duration = kf_b.t - kf_a.t;
            let local_progress = if segment_duration > 0.0 {
                (progress - kf_a.t) / segment_duration
            } else {
                1.0
            };

            return lerp_states(
                &keyframe_to_state(kf_a),
                &keyframe_to_state(kf_b),
                local_progress,
            );
        }
    }

    keyframe_to_state(&keyframes[keyframes.len() - 1])
}

/// Convert a single keyframe to a CharRenderState
fn keyframe_to_state(kf: &AnimationKeyframe) -> CharRenderState {
    CharRenderState {
        opacity: kf.opacity.unwrap_or(1.0),
        translate_x: kf.translate_x.unwrap_or(0.0),
        translate_y: kf.translate_y.unwrap_or(0.0),
        scale: kf.scale.unwrap_or(1.0),
        rotate: kf.rotate.unwrap_or(0.0),
    }
}

/// Linearly interpolate between two states
fn lerp_states(a: &CharRenderState, b: &CharRenderState, t: f64) -> CharRenderState {
    CharRenderState {
        opacity: lerp(a.opacity, b.opacity, t),
        translate_x: lerp(a.translate_x, b.translate_x, t),
        translate_y: lerp(a.translate_y, b.translate_y, t),
        scale: lerp(a.scale, b.scale, t),
        rotate: lerp(a.rotate, b.rotate, t),
    }
}

fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + (b - a) * t
}

/// Calculate the render state of a single character at a given time.
/// This is the core animation logic from the design spec section 4.1.
pub fn calc_char_state(
    char_index: usize,
    current_time_ms: u64,
    clip_start_ms: u64,
    template: &TelopTemplate,
) -> CharRenderState {
    let anim = &template.animation;

    // Calculate this character's animation start time
    let char_start = clip_start_ms + (char_index as u64 * anim.delay_per_unit_ms);

    // Normalize elapsed time to 0.0-1.0 progress
    let elapsed = current_time_ms.saturating_sub(char_start);
    let progress = if anim.duration_ms > 0 {
        (elapsed as f64 / anim.duration_ms as f64).clamp(0.0, 1.0)
    } else {
        if current_time_ms >= char_start {
            1.0
        } else {
            0.0
        }
    };

    // Apply easing function
    let eased = apply_easing(progress, &anim.easing);

    // Determine render state based on animation type
    if let Some(ref keyframes) = anim.keyframes {
        // Multi-keyframe animation (bounce, pop, burst, etc.)
        interpolate_keyframes(keyframes, eased)
    } else {
        // Simple from/to animation (typewriter, fade, etc.)
        let from_opacity = anim
            .from
            .as_ref()
            .and_then(|v| v.get("opacity"))
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);
        let to_opacity = anim
            .to
            .as_ref()
            .and_then(|v| v.get("opacity"))
            .and_then(|v| v.as_f64())
            .unwrap_or(1.0);

        CharRenderState {
            opacity: lerp(from_opacity, to_opacity, eased),
            scale: 1.0,
            ..Default::default()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::telop_engine::template::load_template;

    #[test]
    fn test_apply_easing_linear() {
        assert!((apply_easing(0.0, "linear") - 0.0).abs() < 0.001);
        assert!((apply_easing(0.5, "linear") - 0.5).abs() < 0.001);
        assert!((apply_easing(1.0, "linear") - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_apply_easing_ease() {
        let result = apply_easing(0.5, "ease");
        // ease should be faster in the middle than linear
        assert!(result > 0.5);
    }

    #[test]
    fn test_apply_easing_ease_in() {
        let result = apply_easing(0.5, "ease-in");
        // ease-in should be slower at the start, so at 0.5 progress it should be less than 0.5
        assert!(result < 0.5);
    }

    #[test]
    fn test_apply_easing_ease_out() {
        let result = apply_easing(0.5, "ease-out");
        // ease-out should be faster at the start
        assert!(result > 0.5);
    }

    #[test]
    fn test_apply_easing_cubic_bezier() {
        let result = apply_easing(0.5, "cubic-bezier(0.25, 0.1, 0.25, 1.0)");
        assert!(result > 0.0 && result < 1.0);
    }

    #[test]
    fn test_apply_easing_boundaries() {
        assert!((apply_easing(0.0, "ease") - 0.0).abs() < 0.001);
        assert!((apply_easing(1.0, "ease") - 1.0).abs() < 0.001);
        assert!((apply_easing(0.0, "ease-in") - 0.0).abs() < 0.001);
        assert!((apply_easing(1.0, "ease-in") - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_interpolate_keyframes_bounce() {
        let keyframes = vec![
            AnimationKeyframe {
                t: 0.0,
                opacity: Some(0.0),
                translate_y: Some(40.0),
                scale: Some(0.3),
                translate_x: None,
                rotate: None,
            },
            AnimationKeyframe {
                t: 0.5,
                opacity: Some(1.0),
                translate_y: Some(-12.0),
                scale: Some(1.05),
                translate_x: None,
                rotate: None,
            },
            AnimationKeyframe {
                t: 1.0,
                opacity: Some(1.0),
                translate_y: Some(0.0),
                scale: Some(1.0),
                translate_x: None,
                rotate: None,
            },
        ];

        // At t=0 (start)
        let state = interpolate_keyframes(&keyframes, 0.0);
        assert!((state.opacity - 0.0).abs() < 0.001);
        assert!((state.translate_y - 40.0).abs() < 0.001);

        // At t=0.5 (midpoint)
        let state = interpolate_keyframes(&keyframes, 0.5);
        assert!((state.opacity - 1.0).abs() < 0.001);
        assert!((state.translate_y - (-12.0)).abs() < 0.001);

        // At t=1.0 (end)
        let state = interpolate_keyframes(&keyframes, 1.0);
        assert!((state.opacity - 1.0).abs() < 0.001);
        assert!((state.translate_y - 0.0).abs() < 0.001);
        assert!((state.scale - 1.0).abs() < 0.001);

        // At t=0.25 (interpolated between first two keyframes)
        let state = interpolate_keyframes(&keyframes, 0.25);
        assert!((state.opacity - 0.5).abs() < 0.001);
        assert!((state.translate_y - 14.0).abs() < 0.001);
    }

    #[test]
    fn test_calc_char_state_typewriter() {
        let json = r##"{
            "id": "typewriter",
            "name": "タイプライター",
            "description": "test",
            "category": "basic",
            "animation": {
                "unit": "character",
                "property": "opacity",
                "from": { "opacity": 0.0 },
                "to": { "opacity": 1.0 },
                "duration_ms": 50,
                "delay_per_unit_ms": 70,
                "easing": "linear"
            },
            "default_style": {
                "font_family": "Noto Sans JP",
                "font_size": 40,
                "font_weight": 900,
                "color": "#FFFFFF"
            }
        }"##;

        let template = load_template(json).unwrap();

        // Character 0 at clip_start: should be at progress 0 → opacity 0
        let state = calc_char_state(0, 1000, 1000, &template);
        assert!((state.opacity - 0.0).abs() < 0.01);

        // Character 0 at clip_start + duration_ms: should be fully visible
        let state = calc_char_state(0, 1050, 1000, &template);
        assert!((state.opacity - 1.0).abs() < 0.01);

        // Character 1 at clip_start: hasn't started yet (delay 70ms)
        let state = calc_char_state(1, 1000, 1000, &template);
        assert!((state.opacity - 0.0).abs() < 0.01);

        // Character 1 at clip_start + delay + duration: should be fully visible
        let state = calc_char_state(1, 1120, 1000, &template);
        assert!((state.opacity - 1.0).abs() < 0.01);

        // Character 0 at halfway through: should be ~0.5 with linear easing
        let state = calc_char_state(0, 1025, 1000, &template);
        assert!((state.opacity - 0.5).abs() < 0.05);
    }

    #[test]
    fn test_calc_char_state_before_start() {
        let json = r##"{
            "id": "test",
            "name": "test",
            "description": "test",
            "category": "basic",
            "animation": {
                "unit": "character",
                "property": "opacity",
                "from": { "opacity": 0.0 },
                "to": { "opacity": 1.0 },
                "duration_ms": 100,
                "delay_per_unit_ms": 50,
                "easing": "linear"
            },
            "default_style": {
                "font_family": "Noto Sans JP",
                "font_size": 40,
                "font_weight": 900,
                "color": "#FFFFFF"
            }
        }"##;

        let template = load_template(json).unwrap();

        // Before the clip starts, character should be invisible
        let state = calc_char_state(0, 500, 1000, &template);
        assert!((state.opacity - 0.0).abs() < 0.01);
    }

    #[test]
    fn test_parse_cubic_bezier() {
        let result = parse_cubic_bezier("cubic-bezier(0.34, 1.56, 0.64, 1)");
        assert!(result.is_some());
        let (x1, y1, x2, y2) = result.unwrap();
        assert!((x1 - 0.34).abs() < 0.001);
        assert!((y1 - 1.56).abs() < 0.001);
        assert!((x2 - 0.64).abs() < 0.001);
        assert!((y2 - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_parse_cubic_bezier_invalid() {
        assert!(parse_cubic_bezier("invalid").is_none());
        assert!(parse_cubic_bezier("cubic-bezier(0.1, 0.2)").is_none());
    }
}
