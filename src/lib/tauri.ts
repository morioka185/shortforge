import { invoke } from "@tauri-apps/api/core";

export async function getTemplates(): Promise<string[]> {
  return invoke("get_templates");
}
