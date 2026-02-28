use crate::video_core::decoder::VideoDecoder;
use tauri::command;

/// Extract a single frame at a given time position (ms) and return as base64-encoded PNG
#[command]
pub fn extract_frame(video_path: String, time_ms: u64) -> Result<String, String> {
    ffmpeg_next::init().map_err(|e| format!("Failed to init ffmpeg: {e}"))?;

    let mut decoder = VideoDecoder::open(&video_path)?;
    let mut target_frame = None;

    decoder
        .decode_frames(|frame| {
            if target_frame.is_none() || frame.pts_ms <= time_ms {
                target_frame = Some(frame);
            }
            if target_frame.as_ref().is_some_and(|f| f.pts_ms >= time_ms) {
                return Err("done".to_string());
            }
            Ok(())
        })
        .ok();

    let frame = target_frame.ok_or_else(|| "No frame found".to_string())?;

    // Encode as PNG using skia-safe
    let image_info = skia_safe::ImageInfo::new(
        (frame.width as i32, frame.height as i32),
        skia_safe::ColorType::RGBA8888,
        skia_safe::AlphaType::Premul,
        None,
    );

    let image = skia_safe::images::raster_from_data(
        &image_info,
        skia_safe::Data::new_copy(&frame.data),
        frame.stride(),
    )
    .ok_or("Failed to create image")?;

    let png_data = image
        .encode(None, skia_safe::EncodedImageFormat::PNG, None)
        .ok_or("Failed to encode PNG")?;

    let bytes = png_data.as_bytes();

    Ok(format!("data:image/png;base64,{}", base64_encode(bytes)))
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity((data.len() + 2) / 3 * 4);

    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let triple = (b0 << 16) | (b1 << 8) | b2;

        result.push(CHARS[((triple >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((triple >> 12) & 0x3F) as usize] as char);

        if chunk.len() > 1 {
            result.push(CHARS[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }

        if chunk.len() > 2 {
            result.push(CHARS[(triple & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }

    result
}
