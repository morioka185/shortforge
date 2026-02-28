use super::frame::VideoFrame;

pub struct VideoEncoder {
    format_ctx: ffmpeg_next::format::context::Output,
    encoder: ffmpeg_next::encoder::Video,
    scaler: ffmpeg_next::software::scaling::Context,
    stream_index: usize,
    frame_count: i64,
    time_base: ffmpeg_next::Rational,
}

impl VideoEncoder {
    pub fn new(
        output_path: &str,
        width: u32,
        height: u32,
        fps: f64,
        bitrate: usize,
    ) -> Result<Self, String> {
        ffmpeg_next::init().map_err(|e| format!("Failed to init ffmpeg: {e}"))?;

        let mut format_ctx = ffmpeg_next::format::output(output_path)
            .map_err(|e| format!("Failed to create output: {e}"))?;

        let codec = ffmpeg_next::encoder::find_by_name("libx264")
            .or_else(|| ffmpeg_next::encoder::find(ffmpeg_next::codec::Id::H264))
            .ok_or_else(|| "H264 encoder not found".to_string())?;

        let time_base = ffmpeg_next::Rational::new(1, fps as i32);

        // Check global header flag before borrowing for stream
        let needs_global_header = format_ctx
            .format()
            .flags()
            .contains(ffmpeg_next::format::Flags::GLOBAL_HEADER);

        let mut stream = format_ctx
            .add_stream(codec)
            .map_err(|e| format!("Failed to add stream: {e}"))?;

        let stream_index = stream.index();

        let ctx = ffmpeg_next::codec::Context::new_with_codec(codec);
        let mut encoder = ctx
            .encoder()
            .video()
            .map_err(|e| format!("Failed to create encoder: {e}"))?;

        encoder.set_width(width);
        encoder.set_height(height);
        encoder.set_format(ffmpeg_next::format::Pixel::YUV420P);
        encoder.set_time_base(time_base);
        encoder.set_bit_rate(bitrate);
        encoder.set_gop(12);
        encoder.set_max_b_frames(2);

        if needs_global_header {
            encoder.set_flags(ffmpeg_next::codec::Flags::GLOBAL_HEADER);
        }

        let encoder = encoder
            .open_as(codec)
            .map_err(|e| format!("Failed to open encoder: {e}"))?;

        stream.set_parameters(&encoder);

        let scaler = ffmpeg_next::software::scaling::Context::get(
            ffmpeg_next::format::Pixel::RGBA,
            width,
            height,
            ffmpeg_next::format::Pixel::YUV420P,
            width,
            height,
            ffmpeg_next::software::scaling::Flags::BILINEAR,
        )
        .map_err(|e| format!("Failed to create scaler: {e}"))?;

        format_ctx
            .write_header()
            .map_err(|e| format!("Failed to write header: {e}"))?;

        Ok(Self {
            format_ctx,
            encoder,
            scaler,
            stream_index,
            frame_count: 0,
            time_base,
        })
    }

    pub fn write_frame(&mut self, frame: &VideoFrame) -> Result<(), String> {
        let mut src_frame = ffmpeg_next::frame::Video::new(
            ffmpeg_next::format::Pixel::RGBA,
            frame.width,
            frame.height,
        );

        // Get stride before mutable borrow
        let dst_linesize = src_frame.stride(0);
        let src_stride = frame.stride();

        // Copy RGBA data into ffmpeg frame
        let dst_data = src_frame.data_mut(0);

        for y in 0..frame.height as usize {
            let src_start = y * src_stride;
            let dst_start = y * dst_linesize;
            let copy_len = src_stride.min(dst_linesize);
            dst_data[dst_start..dst_start + copy_len]
                .copy_from_slice(&frame.data[src_start..src_start + copy_len]);
        }

        // Convert RGBA to YUV420P
        let mut yuv_frame = ffmpeg_next::frame::Video::new(
            ffmpeg_next::format::Pixel::YUV420P,
            frame.width,
            frame.height,
        );

        self.scaler
            .run(&src_frame, &mut yuv_frame)
            .map_err(|e| format!("Failed to convert frame: {e}"))?;

        yuv_frame.set_pts(Some(self.frame_count));
        self.frame_count += 1;

        self.encoder
            .send_frame(&yuv_frame)
            .map_err(|e| format!("Failed to send frame to encoder: {e}"))?;

        self.receive_and_write_packets()?;
        Ok(())
    }

    fn receive_and_write_packets(&mut self) -> Result<(), String> {
        let mut packet = ffmpeg_next::Packet::empty();
        while self.encoder.receive_packet(&mut packet).is_ok() {
            packet.set_stream(self.stream_index);
            let stream_time_base = self
                .format_ctx
                .stream(self.stream_index)
                .unwrap()
                .time_base();
            packet.rescale_ts(self.time_base, stream_time_base);
            packet
                .write_interleaved(&mut self.format_ctx)
                .map_err(|e| format!("Failed to write packet: {e}"))?;
        }
        Ok(())
    }

    pub fn finish(mut self) -> Result<(), String> {
        self.encoder
            .send_eof()
            .map_err(|e| format!("Failed to flush encoder: {e}"))?;

        self.receive_and_write_packets()?;

        self.format_ctx
            .write_trailer()
            .map_err(|e| format!("Failed to write trailer: {e}"))?;

        Ok(())
    }
}
