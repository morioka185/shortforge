import { create } from "zustand";
import type { BeatInfo } from "../lib/tauri";

export interface TimelineClip {
  id: string;
  trackId: string;
  type: "video" | "telop" | "audio";
  startMs: number;
  endMs: number;
  label: string;
  source?: string;
  color: string;
}

export interface TimelineTrackData {
  id: string;
  type: "video" | "telop" | "audio";
  label: string;
  clips: TimelineClip[];
}

interface TimelineState {
  tracks: TimelineTrackData[];
  currentTimeMs: number;
  isPlaying: boolean;
  zoom: number;
  selectedClipId: string | null;
  durationMs: number;
  beats: BeatInfo[];
  bpm: number | null;
  waveform: number[];
  snapEnabled: boolean;
  snapThresholdMs: number;
  setTracks: (tracks: TimelineTrackData[]) => void;
  addTrack: (track: TimelineTrackData) => void;
  setCurrentTime: (ms: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlayPause: () => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  selectClip: (id: string | null) => void;
  setDuration: (ms: number) => void;
  moveClip: (clipId: string, newStartMs: number) => void;
  trimClip: (clipId: string, newStartMs: number, newEndMs: number) => void;
  setBeats: (beats: BeatInfo[], bpm: number) => void;
  setWaveform: (data: number[]) => void;
  toggleSnap: () => void;
}

const TRACK_COLORS: Record<string, string> = {
  video: "#3b82f6",
  telop: "#f59e0b",
  audio: "#22c55e",
};

export const useTimelineStore = create<TimelineState>((set) => ({
  tracks: [],
  currentTimeMs: 0,
  isPlaying: false,
  zoom: 1,
  selectedClipId: null,
  durationMs: 15000,
  beats: [],
  bpm: null,
  waveform: [],
  snapEnabled: true,
  snapThresholdMs: 100,

  setTracks: (tracks) => set({ tracks }),
  addTrack: (track) =>
    set((state) => ({ tracks: [...state.tracks, track] })),

  setCurrentTime: (ms) => set({ currentTimeMs: Math.max(0, ms) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlayPause: () => set((s) => ({ isPlaying: !s.isPlaying })),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
  zoomIn: () => set((s) => ({ zoom: Math.min(10, s.zoom * 1.25) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(0.1, s.zoom / 1.25) })),

  selectClip: (id) => set({ selectedClipId: id }),
  setDuration: (ms) => set({ durationMs: ms }),

  moveClip: (clipId, newStartMs) =>
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== clipId) return clip;
          const duration = clip.endMs - clip.startMs;
          return {
            ...clip,
            startMs: Math.max(0, newStartMs),
            endMs: Math.max(0, newStartMs) + duration,
          };
        }),
      })),
    })),

  trimClip: (clipId, newStartMs, newEndMs) =>
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === clipId
            ? { ...clip, startMs: newStartMs, endMs: newEndMs }
            : clip,
        ),
      })),
    })),

  setBeats: (beats, bpm) => set({ beats, bpm }),
  setWaveform: (data) => set({ waveform: data }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
}));

export { TRACK_COLORS };
