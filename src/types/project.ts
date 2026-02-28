export type Platform = "tiktok" | "youtube_shorts" | "instagram_reels";

export interface ShortForgeProject {
  version: string;
  metadata: ProjectMetadata;
  canvas: Canvas;
  tracks: TimelineTrack[];
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
