/// Raw video frame in RGBA format
#[derive(Clone)]
pub struct VideoFrame {
    pub width: u32,
    pub height: u32,
    pub data: Vec<u8>,
    pub pts_ms: u64,
}

impl VideoFrame {
    pub fn new(width: u32, height: u32) -> Self {
        let size = (width * height * 4) as usize;
        Self {
            width,
            height,
            data: vec![0u8; size],
            pts_ms: 0,
        }
    }

    pub fn stride(&self) -> usize {
        self.width as usize * 4
    }
}
