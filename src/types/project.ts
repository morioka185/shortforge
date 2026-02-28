export type Platform = "tiktok" | "youtube_shorts" | "instagram_reels";

export interface ShortForgeProject {
  version: string;
  metadata: ProjectMetadata;
  canvas: Canvas;
  tracks: TimelineTrack[];
  beat_markers: BeatMarker[];
}

export interface ProjectMetadata {
  name: string;
  created_at: string;
  platform: Platform;
}

export interface Canvas {
  width: number;
  height: number;
  fps: number;
  duration_ms: number;
}

export interface TimelineTrack {
  id: string;
  type: "video" | "telop" | "audio";
  clips: unknown[];
}

export interface BeatMarker {
  time_ms: number;
  strength: number;
}
