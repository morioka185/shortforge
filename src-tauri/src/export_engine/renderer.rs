use crate::export_engine::preset::ExportPreset;
use crate::models::telop::SubtitleCue;
use crate::telop_engine::renderer::render_telop_on_frame;
use crate::telop_engine::template::TelopTemplate;
use crate::video_core::decoder::VideoDecoder;
use crate::video_core::encoder::VideoEncoder;

pub struct ExportProgress {
    pub current_frame: u64,
    pub total_frames: u64,
    pub percent: f64,
}

/// Render a video with telop overlay for a specific platform preset
pub fn render_export(
    input_video: &str,
    output_path: &str,
    cues: &[SubtitleCue],
    template: &TelopTemplate,
    preset: &ExportPreset,
    progress_callback: Option<&dyn Fn(ExportProgress)>,
) -> Result<(), String> {
    let mut decoder = VideoDecoder::open(input_video)?;
    let width = decoder.width();
    let height = decoder.height();
    let fps = decoder.fps();

    let bitrate = (preset.bitrate_kbps as usize) * 1000;

    let mut encoder = VideoEncoder::new(output_path, width, height, fps, bitrate)?;

    let total_frames = (decoder.duration_ms() as f64 / 1000.0 * fps) as u64;
    let mut frame_count: u64 = 0;

    let cues = cues.to_vec();
    let template = template.clone();

    decoder.decode_frames(|mut frame| {
        let pts = frame.pts_ms;
        render_telop_on_frame(&mut frame, &cues, &template, pts);
        encoder.write_frame(&frame)?;

        frame_count += 1;
        if let Some(cb) = &progress_callback {
            cb(ExportProgress {
                current_frame: frame_count,
                total_frames,
                percent: if total_frames > 0 {
                    frame_count as f64 / total_frames as f64 * 100.0
                } else {
                    0.0
                },
            });
        }

        Ok(())
    })?;

    encoder.finish()?;
    Ok(())
}
