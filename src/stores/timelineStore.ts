import { create } from "zustand";
import { temporal } from "zundo";
import type { BeatInfo } from "../lib/tauri";

export interface ClipTransform {
  /** X position in canvas coordinates (0–1080) */
  x: number;
  /** Y position in canvas coordinates (0–1920) */
  y: number;
  /** Horizontal scale factor (1.0 = 100%) */
  scaleX: number;
  /** Vertical scale factor (1.0 = 100%) */
  scaleY: number;
}

export const DEFAULT_TRANSFORM: ClipTransform = {
  x: 540,
  y: 960,
  scaleX: 1,
  scaleY: 1,
};

export interface TimelineClip {
  id: string;
  trackId: string;
  type: "video" | "telop" | "audio";
  startMs: number;
  endMs: number;
  label: string;
  source?: string;
  color: string;
  transform?: ClipTransform;
}

export interface TimelineTrackData {
  id: string;
  type: "video" | "telop" | "audio";
  label: string;
  clips: TimelineClip[];
  muted: boolean;
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
  editingClipId: string | null;
  masterMuted: boolean;
  setTracks: (tracks: TimelineTrackData[]) => void;
  addTrack: (track: TimelineTrackData) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleMasterMute: () => void;
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
  updateClipTransform: (clipId: string, transform: Partial<ClipTransform>) => void;
  setEditingClipId: (id: string | null) => void;
  splitClip: (clipId: string, splitAtMs: number) => void;
  deleteClip: (clipId: string) => void;
  removeTrack: (trackId: string) => void;
  setBeats: (beats: BeatInfo[], bpm: number) => void;
  setWaveform: (data: number[]) => void;
  toggleSnap: () => void;
}

const TRACK_COLORS: Record<string, string> = {
  video: "#3b82f6",
  telop: "#f59e0b",
  audio: "#22c55e",
};

export const useTimelineStore = create<TimelineState>()(
  temporal(
    (set) => ({
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
      editingClipId: null,
      masterMuted: false,

      setTracks: (tracks) => set({ tracks }),
      addTrack: (track) =>
        set((state) => ({ tracks: [...state.tracks, track] })),
      toggleTrackMute: (trackId) =>
        set((state) => ({
          tracks: state.tracks.map((track) =>
            track.id === trackId ? { ...track, muted: !track.muted } : track,
          ),
        })),
      toggleMasterMute: () => set((s) => ({ masterMuted: !s.masterMuted })),

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

      updateClipTransform: (clipId, transform) =>
        set((state) => ({
          tracks: state.tracks.map((track) => ({
            ...track,
            clips: track.clips.map((clip) => {
              if (clip.id !== clipId) return clip;
              const current = clip.transform ?? { ...DEFAULT_TRANSFORM };
              return {
                ...clip,
                transform: { ...current, ...transform },
              };
            }),
          })),
        })),

      setEditingClipId: (id) => set({ editingClipId: id }),

      splitClip: (clipId, splitAtMs) =>
        set((state) => ({
          tracks: state.tracks.map((track) => {
            const clipIndex = track.clips.findIndex((c) => c.id === clipId);
            if (clipIndex === -1) return track;
            const clip = track.clips[clipIndex];
            if (splitAtMs <= clip.startMs || splitAtMs >= clip.endMs)
              return track;
            const ts = Date.now();
            const rand = () => Math.random().toString(36).slice(2, 8);
            const firstHalf: TimelineClip = {
              ...clip,
              id: `clip-${ts}-${rand()}`,
              endMs: splitAtMs,
            };
            const secondHalf: TimelineClip = {
              ...clip,
              id: `clip-${ts}-${rand()}`,
              startMs: splitAtMs,
            };
            const newClips = [...track.clips];
            newClips.splice(clipIndex, 1, firstHalf, secondHalf);
            return { ...track, clips: newClips };
          }),
          editingClipId: null,
        })),

      deleteClip: (clipId) =>
        set((state) => {
          const newTracks = state.tracks
            .map((track) => ({
              ...track,
              clips: track.clips.filter((c) => c.id !== clipId),
            }))
            .filter((track) => track.clips.length > 0);
          return {
            tracks: newTracks,
            selectedClipId:
              state.selectedClipId === clipId ? null : state.selectedClipId,
            editingClipId:
              state.editingClipId === clipId ? null : state.editingClipId,
          };
        }),

      removeTrack: (trackId) =>
        set((state) => ({
          tracks: state.tracks.filter((t) => t.id !== trackId),
          selectedClipId: state.tracks
            .find((t) => t.id === trackId)
            ?.clips.some((c) => c.id === state.selectedClipId)
            ? null
            : state.selectedClipId,
          editingClipId: state.tracks
            .find((t) => t.id === trackId)
            ?.clips.some((c) => c.id === state.editingClipId)
            ? null
            : state.editingClipId,
        })),

      setBeats: (beats, bpm) => set({ beats, bpm }),
      setWaveform: (data) => set({ waveform: data }),
      toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
    }),
    {
      limit: 100,
      partialize: (state) => {
        // Only track undoable state changes (tracks, clips)
        // Exclude transient state like currentTimeMs, isPlaying, zoom
        const { tracks } = state;
        return { tracks } as TimelineState;
      },
    },
  ),
);

export { TRACK_COLORS };
