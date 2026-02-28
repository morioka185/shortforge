use super::analyzer::BeatInfo;

/// Find the nearest beat to a given time position
pub fn find_nearest_beat(beats: &[BeatInfo], time_ms: u64) -> Option<&BeatInfo> {
    if beats.is_empty() {
        return None;
    }

    beats
        .iter()
        .min_by_key(|b| (b.time_ms as i64 - time_ms as i64).unsigned_abs())
}

/// Snap a time position to the nearest beat within a threshold
pub fn snap_to_beat(beats: &[BeatInfo], time_ms: u64, threshold_ms: u64) -> u64 {
    match find_nearest_beat(beats, time_ms) {
        Some(beat) if (beat.time_ms as i64 - time_ms as i64).unsigned_abs() <= threshold_ms => {
            beat.time_ms
        }
        _ => time_ms,
    }
}

/// Get all beats within a time range
pub fn beats_in_range(beats: &[BeatInfo], start_ms: u64, end_ms: u64) -> Vec<&BeatInfo> {
    beats
        .iter()
        .filter(|b| b.time_ms >= start_ms && b.time_ms <= end_ms)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_beats() -> Vec<BeatInfo> {
        vec![
            BeatInfo {
                time_ms: 500,
                strength: 0.8,
            },
            BeatInfo {
                time_ms: 1000,
                strength: 0.9,
            },
            BeatInfo {
                time_ms: 1500,
                strength: 0.7,
            },
            BeatInfo {
                time_ms: 2000,
                strength: 0.85,
            },
        ]
    }

    #[test]
    fn test_find_nearest_beat() {
        let beats = sample_beats();

        let nearest = find_nearest_beat(&beats, 600).unwrap();
        assert_eq!(nearest.time_ms, 500);

        let nearest = find_nearest_beat(&beats, 800).unwrap();
        assert_eq!(nearest.time_ms, 1000);

        let nearest = find_nearest_beat(&beats, 1500).unwrap();
        assert_eq!(nearest.time_ms, 1500);
    }

    #[test]
    fn test_find_nearest_beat_empty() {
        let beats: Vec<BeatInfo> = vec![];
        assert!(find_nearest_beat(&beats, 500).is_none());
    }

    #[test]
    fn test_snap_to_beat_within_threshold() {
        let beats = sample_beats();

        // 520ms is within 50ms of beat at 500ms
        assert_eq!(snap_to_beat(&beats, 520, 50), 500);

        // 960ms is within 50ms of beat at 1000ms
        assert_eq!(snap_to_beat(&beats, 960, 50), 1000);
    }

    #[test]
    fn test_snap_to_beat_outside_threshold() {
        let beats = sample_beats();

        // 700ms is NOT within 50ms of any beat
        assert_eq!(snap_to_beat(&beats, 700, 50), 700);
    }

    #[test]
    fn test_beats_in_range() {
        let beats = sample_beats();

        let in_range = beats_in_range(&beats, 800, 1600);
        assert_eq!(in_range.len(), 2);
        assert_eq!(in_range[0].time_ms, 1000);
        assert_eq!(in_range[1].time_ms, 1500);
    }

    #[test]
    fn test_beats_in_range_empty() {
        let beats = sample_beats();
        let in_range = beats_in_range(&beats, 2500, 3000);
        assert!(in_range.is_empty());
    }
}
