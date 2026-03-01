import { invoke } from "@tauri-apps/api/core";
import type { TelopTemplate } from "../types/telop";
import type { ShortForgeProject, Platform } from "../types/project";

export async function getTemplates(
  templatesDir?: string,
): Promise<TelopTemplate[]> {
  return invoke("get_templates", { templatesDir });
}

export interface SubtitleCue {
  index: number;
  start_ms: number;
  end_ms: number;
  text: string;
}

export async function parseSrt(path: string): Promise<SubtitleCue[]> {
  return invoke("parse_srt", { path });
}

export async function burnTelop(params: {
  inputVideo: string;
  srtFile: string;
  templateId: string;
  templatesDir?: string;
  outputPath: string;
  bitrate?: number;
}): Promise<string> {
  return invoke("burn_telop", params);
}

export async function createProject(
  name: string,
  platform: Platform,
): Promise<ShortForgeProject> {
  return invoke("create_project", { name, platform });
}

export async function saveProject(
  project: ShortForgeProject,
  path: string,
): Promise<void> {
  return invoke("save_project", { project, path });
}

export async function loadProject(path: string): Promise<ShortForgeProject> {
  return invoke("load_project", { path });
}

export interface MediaInfo {
  path: string;
  width: number;
  height: number;
  duration_ms: number;
  fps: number;
  has_audio: boolean;
}

export async function probeMedia(path: string): Promise<MediaInfo> {
  return invoke("probe_media", { path });
}

export async function importMedia(
  project: ShortForgeProject,
  mediaPath: string,
): Promise<ShortForgeProject> {
  return invoke("import_media", { project, mediaPath });
}

// Preview
export async function extractFrame(
  videoPath: string,
  timeMs: number,
): Promise<string> {
  return invoke("extract_frame", { videoPath, timeMs });
}

// Export Engine
export interface ExportPreset {
  platform: string;
  display_name: string;
  resolution: { width: number; height: number };
  aspect_ratio: string;
  max_duration_sec: number;
  recommended_duration_sec: number | null;
  fps: number;
  codec: string;
  audio_codec: string;
  audio_sample_rate: number;
  max_file_size_mb: number;
  bitrate_kbps: number;
  safe_zones: { top_px: number; bottom_px: number; right_px: number };
}

export interface ValidationResult {
  valid: boolean;
  warnings: { code: string; message: string }[];
  errors: { code: string; message: string }[];
}

export async function getPresets(
  presetsDir?: string,
): Promise<ExportPreset[]> {
  return invoke("get_presets", { presetsDir });
}

export async function validateExport(params: {
  durationMs: number;
  width: number;
  height: number;
  platform: string;
  presetsDir?: string;
}): Promise<ValidationResult> {
  return invoke("validate_export", params);
}

export interface AudioSourceParam {
  path: string;
  startMs: number;
  endMs: number;
}

export async function exportVideo(params: {
  inputVideo: string;
  outputPath: string;
  srtFile?: string;
  templatePath?: string;
  platform: string;
  presetsDir?: string;
  audioSources?: AudioSourceParam[];
}): Promise<string> {
  return invoke("export_video", params);
}

// Font
export async function listSystemFonts(): Promise<string[]> {
  return invoke("list_system_fonts");
}

// Beat Sync
export interface BeatInfo {
  time_ms: number;
  strength: number;
}

export interface BeatAnalysis {
  bpm: number;
  beats: BeatInfo[];
  sample_rate: number;
  duration_ms: number;
}

export async function detectBeats(audioPath: string): Promise<BeatAnalysis> {
  return invoke("detect_beats", { audioPath });
}

export async function getWaveform(
  audioPath: string,
  numPoints?: number,
): Promise<number[]> {
  return invoke("get_waveform", { audioPath, numPoints });
}

export async function snapTimeToBeat(
  beats: BeatInfo[],
  timeMs: number,
  thresholdMs?: number,
): Promise<number> {
  return invoke("snap_time_to_beat", { beats, timeMs, thresholdMs });
}
