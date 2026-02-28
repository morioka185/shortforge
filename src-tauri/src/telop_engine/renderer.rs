use crate::models::telop::SubtitleCue;
use crate::telop_engine::animation::calc_char_state;
use crate::telop_engine::template::TelopTemplate;
use crate::video_core::frame::VideoFrame;

/// Render telop text onto a video frame using skia-safe
pub fn render_telop_on_frame(
    frame: &mut VideoFrame,
    cues: &[SubtitleCue],
    template: &TelopTemplate,
    current_time_ms: u64,
) {
    // Find active cues at this time
    let active_cues: Vec<&SubtitleCue> = cues
        .iter()
        .filter(|cue| current_time_ms >= cue.start_ms && current_time_ms < cue.end_ms)
        .collect();

    if active_cues.is_empty() {
        return;
    }

    let width = frame.width as i32;
    let height = frame.height as i32;

    // Create skia surface from frame data
    let image_info = skia_safe::ImageInfo::new(
        (width, height),
        skia_safe::ColorType::RGBA8888,
        skia_safe::AlphaType::Premul,
        None,
    );

    let stride = frame.stride();
    let mut surface = skia_safe::surfaces::wrap_pixels(
        &image_info,
        &mut frame.data,
        Some(stride),
        None,
    );

    let surface = match surface {
        Some(ref mut s) => s,
        None => return,
    };

    let canvas = surface.canvas();
    let style = &template.default_style;

    // Set up font
    let font_size = style.font_size;
    let typeface = skia_safe::FontMgr::default()
        .match_family_style(
            &style.font_family,
            skia_safe::FontStyle::new(
                match style.font_weight {
                    w if w >= 900 => skia_safe::font_style::Weight::BLACK,
                    w if w >= 700 => skia_safe::font_style::Weight::BOLD,
                    w if w >= 500 => skia_safe::font_style::Weight::MEDIUM,
                    _ => skia_safe::font_style::Weight::NORMAL,
                },
                skia_safe::font_style::Width::NORMAL,
                skia_safe::font_style::Slant::Upright,
            ),
        )
        .unwrap_or_else(|| {
            skia_safe::FontMgr::default()
                .legacy_make_typeface(None, skia_safe::FontStyle::default())
                .expect("Failed to create default typeface")
        });

    let font = skia_safe::Font::from_typeface(&typeface, font_size);

    for cue in &active_cues {
        let chars: Vec<char> = cue.text.chars().collect();

        // Measure total text width
        let (text_width, _) = font.measure_str(&cue.text, None);

        // Default position: centered
        let base_x = (width as f32 - text_width) / 2.0;
        let base_y = if let Some(ref pos) = style.position {
            pos.y
        } else {
            height as f32 * 0.5
        };

        // Draw each character with its animation state
        let mut cursor_x = base_x;

        for (i, ch) in chars.iter().enumerate() {
            let char_str = ch.to_string();
            let (char_width, _) = font.measure_str(&char_str, None);

            let state = calc_char_state(i, current_time_ms, cue.start_ms, template);

            if state.opacity <= 0.001 {
                cursor_x += char_width;
                continue;
            }

            let char_x = cursor_x + state.translate_x as f32;
            let char_y = base_y + state.translate_y as f32;

            canvas.save();

            // Apply scale and rotation around character center
            let center_x = char_x + char_width / 2.0;
            let center_y = char_y - font_size / 3.0;

            if (state.scale - 1.0).abs() > 0.001 || state.rotate.abs() > 0.001 {
                canvas.translate((center_x, center_y));
                if state.rotate.abs() > 0.001 {
                    canvas.rotate(state.rotate as f32, None);
                }
                if (state.scale - 1.0).abs() > 0.001 {
                    canvas.scale((state.scale as f32, state.scale as f32));
                }
                canvas.translate((-center_x, -center_y));
            }

            let alpha = (state.opacity * 255.0).clamp(0.0, 255.0) as u8;

            // Draw shadow
            if let Some(ref shadow) = style.shadow {
                if shadow.enabled {
                    let shadow_color = parse_color_with_alpha(&shadow.color, alpha);
                    let mut shadow_paint = skia_safe::Paint::new(shadow_color, None);
                    shadow_paint.set_anti_alias(true);

                    if shadow.blur > 0.0 {
                        shadow_paint.set_mask_filter(skia_safe::MaskFilter::blur(
                            skia_safe::BlurStyle::Normal,
                            shadow.blur / 2.0,
                            false,
                        ));
                    }

                    canvas.draw_str(
                        &char_str,
                        (char_x + shadow.offset_x, char_y + shadow.offset_y),
                        &font,
                        &shadow_paint,
                    );
                }
            }

            // Draw outline
            if let Some(ref outline) = style.outline {
                if outline.enabled {
                    let outline_color = parse_color_with_alpha(&outline.color, alpha);
                    let mut outline_paint = skia_safe::Paint::new(outline_color, None);
                    outline_paint.set_anti_alias(true);
                    outline_paint.set_style(skia_safe::PaintStyle::Stroke);
                    outline_paint.set_stroke_width(outline.width * 2.0);
                    let join = match outline.join.as_str() {
                        "round" => skia_safe::paint::Join::Round,
                        "bevel" => skia_safe::paint::Join::Bevel,
                        _ => skia_safe::paint::Join::Miter,
                    };
                    outline_paint.set_stroke_join(join);
                    if join == skia_safe::paint::Join::Miter {
                        outline_paint.set_stroke_miter(4.0);
                    }

                    canvas.draw_str(&char_str, (char_x, char_y), &font, &outline_paint);
                }
            }

            // Draw main text
            let text_color = parse_color_with_alpha(&style.color, alpha);
            let mut text_paint = skia_safe::Paint::new(text_color, None);
            text_paint.set_anti_alias(true);

            canvas.draw_str(&char_str, (char_x, char_y), &font, &text_paint);

            canvas.restore();
            cursor_x += char_width;
        }
    }
}

/// Parse CSS hex color string to skia Color4f with alpha override
fn parse_color_with_alpha(hex: &str, alpha: u8) -> skia_safe::Color4f {
    let hex = hex.trim_start_matches('#');
    let (r, g, b, a) = match hex.len() {
        6 => {
            let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(255);
            let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(255);
            let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(255);
            (r, g, b, alpha)
        }
        8 => {
            let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(255);
            let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(255);
            let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(255);
            let base_a = u8::from_str_radix(&hex[6..8], 16).unwrap_or(255);
            let combined_a = ((base_a as u16 * alpha as u16) / 255) as u8;
            (r, g, b, combined_a)
        }
        _ => (255, 255, 255, alpha),
    };

    skia_safe::Color4f::new(
        r as f32 / 255.0,
        g as f32 / 255.0,
        b as f32 / 255.0,
        a as f32 / 255.0,
    )
}
