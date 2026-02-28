import { create } from "zustand";

interface TimelineState {
  currentTimeMs: number;
  isPlaying: boolean;
  zoom: number;
  setCurrentTime: (ms: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoom: (zoom: number) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  currentTimeMs: 0,
  isPlaying: false,
  zoom: 1,
  setCurrentTime: (ms) => set({ currentTimeMs: ms }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setZoom: (zoom) => set({ zoom }),
}));
