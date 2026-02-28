import { invoke } from "@tauri-apps/api/core";
import type { TelopTemplate } from "../types/telop";
import type { ShortForgeProject, Platform } from "../types/project";

export async function getTemplates(
  templatesDir?: string,
): Promise<TelopTemplate[]> {
  return invoke("get_templates", { templatesDir });
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
