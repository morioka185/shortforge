import { create } from "zustand";

interface ProjectState {
  name: string;
  platform: "tiktok" | "youtube_shorts" | "instagram_reels";
  setName: (name: string) => void;
  setPlatform: (platform: ProjectState["platform"]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  name: "",
  platform: "tiktok",
  setName: (name) => set({ name }),
  setPlatform: (platform) => set({ platform }),
}));
