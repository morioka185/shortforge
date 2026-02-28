use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BeatAnalysis {
    pub bpm: f64,
    pub beats: Vec<BeatInfo>,
    pub sample_rate: u32,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BeatInfo {
    pub time_ms: u64,
    pub strength: f64,
}

/// Decode audio from a media file into mono f32 samples
pub fn decode_audio_mono(path: &str) -> Result<(Vec<f32>, u32), String> {
    ffmpeg_next::init().map_err(|e| format!("Failed to init ffmpeg: {e}"))?;

    let mut format_ctx =
        ffmpeg_next::format::input(path).map_err(|e| format!("Failed to open {path}: {e}"))?;

    let audio_stream = format_ctx
        .streams()
        .best(ffmpeg_next::media::Type::Audio)
        .ok_or_else(|| "No audio stream found".to_string())?;

    let audio_stream_index = audio_stream.index();
    let _time_base = audio_stream.time_base();

    let decoder_ctx = ffmpeg_next::codec::Context::from_parameters(audio_stream.parameters())
        .map_err(|e| format!("Failed to create decoder context: {e}"))?;

    let mut decoder = decoder_ctx
        .decoder()
        .audio()
        .map_err(|e| format!("Failed to create audio decoder: {e}"))?;

    let sample_rate = decoder.rate();
    let _channels = decoder.channels() as u32;

    // Create resampler to convert to mono f32 (FLT format)
    let mut resampler = ffmpeg_next::software::resampling::Context::get(
        decoder.format(),
        decoder.channel_layout(),
        sample_rate,
        ffmpeg_next::format::Sample::F32(ffmpeg_next::format::sample::Type::Packed),
        ffmpeg_next::ChannelLayout::MONO,
        sample_rate,
    )
    .map_err(|e| format!("Failed to create resampler: {e}"))?;

    let mut samples: Vec<f32> = Vec::new();
    let mut frame_buf = ffmpeg_next::frame::Audio::empty();

    let packets: Vec<_> = format_ctx
        .packets()
        .filter(|(stream, _)| stream.index() == audio_stream_index)
        .map(|(_, packet)| packet)
        .collect();

    for packet in &packets {
        decoder
            .send_packet(packet)
            .map_err(|e| format!("Failed to send packet: {e}"))?;

        while decoder.receive_frame(&mut frame_buf).is_ok() {
            let mut resampled = ffmpeg_next::frame::Audio::empty();
            resampler
                .run(&frame_buf, &mut resampled)
                .map_err(|e| format!("Failed to resample: {e}"))?;

            let data = resampled.data(0);
            let float_samples: &[f32] = unsafe {
                std::slice::from_raw_parts(data.as_ptr() as *const f32, data.len() / 4)
            };
            samples.extend_from_slice(float_samples);
        }
    }

    // Flush decoder
    decoder
        .send_eof()
        .map_err(|e| format!("Failed to flush decoder: {e}"))?;

    while decoder.receive_frame(&mut frame_buf).is_ok() {
        let mut resampled = ffmpeg_next::frame::Audio::empty();
        resampler
            .run(&frame_buf, &mut resampled)
            .map_err(|e| format!("Failed to resample: {e}"))?;

        let data = resampled.data(0);
        let float_samples: &[f32] =
            unsafe { std::slice::from_raw_parts(data.as_ptr() as *const f32, data.len() / 4) };
        samples.extend_from_slice(float_samples);
    }

    // Flush resampler
    let mut delay = resampler.flush(&mut ffmpeg_next::frame::Audio::empty());
    while let Ok(Some(_)) = delay {
        delay = resampler.flush(&mut ffmpeg_next::frame::Audio::empty());
    }

    Ok((samples, sample_rate))
}

/// Analyze beats in audio using aubio
pub fn analyze_beats(path: &str) -> Result<BeatAnalysis, String> {
    let (samples, sample_rate) = decode_audio_mono(path)?;

    let buf_size = 1024_usize;
    let hop_size = 512_usize;

    let mut tempo = aubio::Tempo::new(aubio::OnsetMode::default(), buf_size, hop_size, sample_rate)
        .map_err(|e| format!("Failed to create tempo detector: {e}"))?;

    let mut beats: Vec<BeatInfo> = Vec::new();

    // Process audio in chunks of hop_size
    let mut pos = 0;
    while pos + hop_size <= samples.len() {
        let chunk = &samples[pos..pos + hop_size];

        let result = tempo
            .do_result(chunk)
            .map_err(|e| format!("Tempo detection error: {e}"))?;

        if result > 0.0 {
            let time_ms = tempo.get_last_ms() as u64;
            let confidence = tempo.get_confidence() as f64;
            beats.push(BeatInfo {
                time_ms,
                strength: confidence.clamp(0.0, 1.0),
            });
        }

        pos += hop_size;
    }

    let bpm = tempo.get_bpm() as f64;
    let duration_ms = if sample_rate > 0 {
        (samples.len() as u64 * 1000) / sample_rate as u64
    } else {
        0
    };

    Ok(BeatAnalysis {
        bpm,
        beats,
        sample_rate,
        duration_ms,
    })
}

/// Generate a downsampled waveform for visualization
pub fn generate_waveform(path: &str, num_points: usize) -> Result<Vec<f32>, String> {
    let (samples, _) = decode_audio_mono(path)?;

    if samples.is_empty() || num_points == 0 {
        return Ok(Vec::new());
    }

    let chunk_size = samples.len() / num_points;
    if chunk_size == 0 {
        return Ok(samples.iter().map(|s| s.abs()).collect());
    }

    let waveform: Vec<f32> = samples
        .chunks(chunk_size)
        .take(num_points)
        .map(|chunk| {
            // RMS amplitude for each chunk
            let sum_sq: f32 = chunk.iter().map(|s| s * s).sum();
            (sum_sq / chunk.len() as f32).sqrt()
        })
        .collect();

    Ok(waveform)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_beat_analysis_types() {
        let analysis = BeatAnalysis {
            bpm: 120.0,
            beats: vec![
                BeatInfo {
                    time_ms: 500,
                    strength: 0.8,
                },
                BeatInfo {
                    time_ms: 1000,
                    strength: 0.9,
                },
            ],
            sample_rate: 44100,
            duration_ms: 5000,
        };

        assert_eq!(analysis.bpm, 120.0);
        assert_eq!(analysis.beats.len(), 2);
        assert_eq!(analysis.beats[0].time_ms, 500);
    }

    #[test]
    fn test_waveform_empty() {
        // Can't test with real file in unit tests, but test empty case
        let result = generate_waveform("/nonexistent/file.mp3", 100);
        assert!(result.is_err());
    }
}
