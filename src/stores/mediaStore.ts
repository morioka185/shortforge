import { create } from "zustand";

export interface MediaItem {
  id: string;
  path: string;
  filename: string;
  type: "video" | "image" | "audio";
  durationMs: number;
  width?: number;
  height?: number;
}

interface MediaState {
  importedMedia: MediaItem[];
  addMedia: (item: MediaItem) => void;
  removeMedia: (id: string) => void;
}

export const useMediaStore = create<MediaState>()((set) => ({
  importedMedia: [],

  addMedia: (item) =>
    set((state) => ({
      importedMedia: [...state.importedMedia, item],
    })),

  removeMedia: (id) =>
    set((state) => ({
      importedMedia: state.importedMedia.filter((m) => m.id !== id),
    })),
}));
