use super::frame::VideoFrame;

pub struct VideoDecoder {
    format_ctx: ffmpeg_next::format::context::Input,
    video_stream_index: usize,
    decoder: ffmpeg_next::decoder::Video,
    scaler: ffmpeg_next::software::scaling::Context,
    width: u32,
    height: u32,
    fps: f64,
    duration_ms: u64,
    time_base: ffmpeg_next::Rational,
}

impl VideoDecoder {
    pub fn open(path: &str) -> Result<Self, String> {
        ffmpeg_next::init().map_err(|e| format!("Failed to init ffmpeg: {e}"))?;

        let format_ctx =
            ffmpeg_next::format::input(path).map_err(|e| format!("Failed to open {path}: {e}"))?;

        let video_stream = format_ctx
            .streams()
            .best(ffmpeg_next::media::Type::Video)
            .ok_or_else(|| "No video stream found".to_string())?;

        let video_stream_index = video_stream.index();
        let time_base = video_stream.time_base();

        let decoder_ctx = ffmpeg_next::codec::Context::from_parameters(video_stream.parameters())
            .map_err(|e| format!("Failed to create decoder context: {e}"))?;

        let decoder = decoder_ctx
            .decoder()
            .video()
            .map_err(|e| format!("Failed to create video decoder: {e}"))?;

        let width = decoder.width();
        let height = decoder.height();

        let fps = video_stream.avg_frame_rate();
        let fps_f64 = if fps.denominator() > 0 {
            fps.numerator() as f64 / fps.denominator() as f64
        } else {
            30.0
        };

        let duration = format_ctx.duration();
        let duration_ms = if duration > 0 {
            (duration as f64 / ffmpeg_next::ffi::AV_TIME_BASE as f64 * 1000.0) as u64
        } else {
            0
        };

        let scaler = ffmpeg_next::software::scaling::Context::get(
            decoder.format(),
            width,
            height,
            ffmpeg_next::format::Pixel::RGBA,
            width,
            height,
            ffmpeg_next::software::scaling::Flags::BILINEAR,
        )
        .map_err(|e| format!("Failed to create scaler: {e}"))?;

        Ok(Self {
            format_ctx,
            video_stream_index,
            decoder,
            scaler,
            width,
            height,
            fps: fps_f64,
            duration_ms,
            time_base,
        })
    }

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn fps(&self) -> f64 {
        self.fps
    }

    pub fn duration_ms(&self) -> u64 {
        self.duration_ms
    }

    /// Decode all frames, calling the callback for each
    pub fn decode_frames<F>(&mut self, mut callback: F) -> Result<(), String>
    where
        F: FnMut(VideoFrame) -> Result<(), String>,
    {
        let mut frame_buf = ffmpeg_next::frame::Video::empty();
        let mut rgba_frame = ffmpeg_next::frame::Video::empty();

        let packets: Vec<_> = self
            .format_ctx
            .packets()
            .filter(|(stream, _)| stream.index() == self.video_stream_index)
            .map(|(_, packet)| packet)
            .collect();

        for packet in &packets {
            self.decoder
                .send_packet(packet)
                .map_err(|e| format!("Failed to send packet: {e}"))?;

            while self.decoder.receive_frame(&mut frame_buf).is_ok() {
                self.scaler
                    .run(&frame_buf, &mut rgba_frame)
                    .map_err(|e| format!("Failed to scale frame: {e}"))?;

                let pts = frame_buf.pts().unwrap_or(0);
                let pts_ms = (pts as f64 * self.time_base.numerator() as f64
                    / self.time_base.denominator() as f64
                    * 1000.0) as u64;

                let mut video_frame = VideoFrame::new(self.width, self.height);
                video_frame.pts_ms = pts_ms;

                let src_data = rgba_frame.data(0);
                let src_linesize = rgba_frame.stride(0);
                let dst_stride = video_frame.stride();

                for y in 0..self.height as usize {
                    let src_start = y * src_linesize;
                    let dst_start = y * dst_stride;
                    let copy_len = dst_stride.min(src_linesize);
                    video_frame.data[dst_start..dst_start + copy_len]
                        .copy_from_slice(&src_data[src_start..src_start + copy_len]);
                }

                callback(video_frame)?;
            }
        }

        // Flush decoder
        self.decoder
            .send_eof()
            .map_err(|e| format!("Failed to flush decoder: {e}"))?;

        while self.decoder.receive_frame(&mut frame_buf).is_ok() {
            self.scaler
                .run(&frame_buf, &mut rgba_frame)
                .map_err(|e| format!("Failed to scale frame: {e}"))?;

            let pts = frame_buf.pts().unwrap_or(0);
            let pts_ms = (pts as f64 * self.time_base.numerator() as f64
                / self.time_base.denominator() as f64
                * 1000.0) as u64;

            let mut video_frame = VideoFrame::new(self.width, self.height);
            video_frame.pts_ms = pts_ms;

            let src_data = rgba_frame.data(0);
            let src_linesize = rgba_frame.stride(0);
            let dst_stride = video_frame.stride();

            for y in 0..self.height as usize {
                let src_start = y * src_linesize;
                let dst_start = y * dst_stride;
                let copy_len = dst_stride.min(src_linesize);
                video_frame.data[dst_start..dst_start + copy_len]
                    .copy_from_slice(&src_data[src_start..src_start + copy_len]);
            }

            callback(video_frame)?;
        }

        Ok(())
    }
}
