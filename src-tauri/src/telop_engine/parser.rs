use crate::models::telop::SubtitleCue;

/// Parse an SRT timestamp (HH:MM:SS,mmm) to milliseconds
fn parse_timestamp(ts: &str) -> Result<u64, String> {
    let ts = ts.trim();
    // SRT uses comma as decimal separator: 00:00:01,500
    let ts = ts.replace(',', ".");

    let parts: Vec<&str> = ts.split(':').collect();
    if parts.len() != 3 {
        return Err(format!("Invalid timestamp format: {ts}"));
    }

    let hours: u64 = parts[0]
        .parse()
        .map_err(|_| format!("Invalid hours: {}", parts[0]))?;
    let minutes: u64 = parts[1]
        .parse()
        .map_err(|_| format!("Invalid minutes: {}", parts[1]))?;

    let sec_parts: Vec<&str> = parts[2].split('.').collect();
    let seconds: u64 = sec_parts[0]
        .parse()
        .map_err(|_| format!("Invalid seconds: {}", sec_parts[0]))?;
    let millis: u64 = if sec_parts.len() > 1 {
        let ms_str = sec_parts[1];
        let ms: u64 = ms_str
            .parse()
            .map_err(|_| format!("Invalid milliseconds: {ms_str}"))?;
        // Pad to 3 digits: "5" -> 500, "50" -> 500, "500" -> 500
        match ms_str.len() {
            1 => ms * 100,
            2 => ms * 10,
            3 => ms,
            _ => ms / 10u64.pow(ms_str.len() as u32 - 3),
        }
    } else {
        0
    };

    Ok(hours * 3_600_000 + minutes * 60_000 + seconds * 1_000 + millis)
}

/// Parse SRT file content into a Vec of SubtitleCue
pub fn parse_srt(content: &str) -> Result<Vec<SubtitleCue>, String> {
    let mut cues = Vec::new();
    // Normalize line endings
    let content = content.replace("\r\n", "\n").replace('\r', "\n");
    let blocks: Vec<&str> = content.split("\n\n").collect();

    for block in blocks {
        let block = block.trim();
        if block.is_empty() {
            continue;
        }

        let lines: Vec<&str> = block.lines().collect();
        if lines.len() < 3 {
            continue;
        }

        // Line 0: index number
        let index: usize = lines[0]
            .trim()
            .parse()
            .map_err(|_| format!("Invalid subtitle index: {}", lines[0]))?;

        // Line 1: timestamps "start --> end"
        let timing_line = lines[1].trim();
        let arrow_parts: Vec<&str> = timing_line.split("-->").collect();
        if arrow_parts.len() != 2 {
            return Err(format!("Invalid timing line: {timing_line}"));
        }

        let start_ms = parse_timestamp(arrow_parts[0])?;
        let end_ms = parse_timestamp(arrow_parts[1])?;

        // Lines 2+: text content (may span multiple lines)
        let text = lines[2..].join("\n");

        cues.push(SubtitleCue {
            index,
            start_ms,
            end_ms,
            text,
        });
    }

    Ok(cues)
}

/// Parse SRT from a file path
pub fn parse_srt_file(path: &str) -> Result<Vec<SubtitleCue>, String> {
    let content =
        std::fs::read_to_string(path).map_err(|e| format!("Failed to read file: {e}"))?;
    parse_srt(&content)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_timestamp() {
        assert_eq!(parse_timestamp("00:00:01,500").unwrap(), 1500);
        assert_eq!(parse_timestamp("00:01:00,000").unwrap(), 60000);
        assert_eq!(parse_timestamp("01:00:00,000").unwrap(), 3600000);
        assert_eq!(parse_timestamp("00:00:00,100").unwrap(), 100);
        assert_eq!(parse_timestamp("00:02:35,750").unwrap(), 155750);
    }

    #[test]
    fn test_parse_srt_basic() {
        let srt = r#"1
00:00:01,000 --> 00:00:04,000
こんにちは世界

2
00:00:05,000 --> 00:00:08,500
ショート動画の作り方
"#;
        let cues = parse_srt(srt).unwrap();
        assert_eq!(cues.len(), 2);

        assert_eq!(cues[0].index, 1);
        assert_eq!(cues[0].start_ms, 1000);
        assert_eq!(cues[0].end_ms, 4000);
        assert_eq!(cues[0].text, "こんにちは世界");

        assert_eq!(cues[1].index, 2);
        assert_eq!(cues[1].start_ms, 5000);
        assert_eq!(cues[1].end_ms, 8500);
        assert_eq!(cues[1].text, "ショート動画の作り方");
    }

    #[test]
    fn test_parse_srt_multiline_text() {
        let srt = r#"1
00:00:01,000 --> 00:00:04,000
First line
Second line
"#;
        let cues = parse_srt(srt).unwrap();
        assert_eq!(cues.len(), 1);
        assert_eq!(cues[0].text, "First line\nSecond line");
    }

    #[test]
    fn test_parse_srt_windows_line_endings() {
        let srt = "1\r\n00:00:01,000 --> 00:00:04,000\r\nHello\r\n\r\n2\r\n00:00:05,000 --> 00:00:08,000\r\nWorld\r\n";
        let cues = parse_srt(srt).unwrap();
        assert_eq!(cues.len(), 2);
        assert_eq!(cues[0].text, "Hello");
        assert_eq!(cues[1].text, "World");
    }

    #[test]
    fn test_parse_srt_empty() {
        let cues = parse_srt("").unwrap();
        assert!(cues.is_empty());
    }

    #[test]
    fn test_parse_timestamp_invalid() {
        assert!(parse_timestamp("invalid").is_err());
        assert!(parse_timestamp("00:00").is_err());
    }
}
