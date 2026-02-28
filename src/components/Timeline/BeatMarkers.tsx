import type { BeatInfo } from "../../lib/tauri";

interface BeatMarkersProps {
  beats: BeatInfo[];
  durationMs: number;
  width: number;
  height: number;
}

export function BeatMarkers({
  beats,
  durationMs,
  width,
  height,
}: BeatMarkersProps) {
  if (durationMs <= 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {beats.map((beat, i) => {
        const x = (beat.time_ms / durationMs) * width;
        const opacity = 0.3 + beat.strength * 0.5;
        return (
          <div
            key={i}
            className="absolute top-0"
            style={{
              left: x,
              width: 1,
              height,
              backgroundColor: `rgba(251, 191, 36, ${opacity})`,
            }}
          />
        );
      })}
    </div>
  );
}
