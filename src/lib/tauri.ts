import { invoke } from "@tauri-apps/api/core";
import type { TelopTemplate } from "../types/telop";

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
