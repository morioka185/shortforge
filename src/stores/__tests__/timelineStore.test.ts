import { describe, it, expect, beforeEach } from "vitest";
import {
  useTimelineStore,
  TRACK_COLORS,
  type TimelineTrackData,
  type TimelineClip,
} from "../timelineStore";

const createMockClip = (overrides?: Partial<TimelineClip>): TimelineClip => ({
  id: "clip-1",
  trackId: "video-1",
  type: "video",
  startMs: 0,
  endMs: 5000,
  label: "Test Clip",
  color: TRACK_COLORS.video,
  ...overrides,
});

const createMockTrack = (
  overrides?: Partial<TimelineTrackData>,
): TimelineTrackData => ({
  id: "video-1",
  type: "video",
  label: "映像",
  muted: false,
  clips: [],
  ...overrides,
});

describe("timelineStore", () => {
  beforeEach(() => {
    useTimelineStore.setState({
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
    });
  });

  describe("initial state", () => {
    it("has empty tracks", () => {
      expect(useTimelineStore.getState().tracks).toEqual([]);
    });

    it("starts at time 0", () => {
      expect(useTimelineStore.getState().currentTimeMs).toBe(0);
    });

    it("is not playing", () => {
      expect(useTimelineStore.getState().isPlaying).toBe(false);
    });

    it("has zoom of 1", () => {
      expect(useTimelineStore.getState().zoom).toBe(1);
    });

    it("has default duration of 15000ms", () => {
      expect(useTimelineStore.getState().durationMs).toBe(15000);
    });

    it("has snap enabled by default", () => {
      expect(useTimelineStore.getState().snapEnabled).toBe(true);
    });

    it("has snap threshold of 100ms", () => {
      expect(useTimelineStore.getState().snapThresholdMs).toBe(100);
    });
  });

  describe("TRACK_COLORS", () => {
    it("has correct color for video", () => {
      expect(TRACK_COLORS.video).toBe("#3b82f6");
    });

    it("has correct color for telop", () => {
      expect(TRACK_COLORS.telop).toBe("#f59e0b");
    });

    it("has correct color for audio", () => {
      expect(TRACK_COLORS.audio).toBe("#22c55e");
    });
  });

  describe("track management", () => {
    it("sets tracks", () => {
      const tracks = [createMockTrack()];
      useTimelineStore.getState().setTracks(tracks);
      expect(useTimelineStore.getState().tracks).toEqual(tracks);
    });

    it("adds a track", () => {
      const track = createMockTrack();
      useTimelineStore.getState().addTrack(track);
      expect(useTimelineStore.getState().tracks).toHaveLength(1);
      expect(useTimelineStore.getState().tracks[0]).toEqual(track);
    });

    it("adds multiple tracks", () => {
      useTimelineStore.getState().addTrack(createMockTrack({ id: "video-1" }));
      useTimelineStore
        .getState()
        .addTrack(
          createMockTrack({ id: "audio-1", type: "audio", label: "音声" }),
        );
      expect(useTimelineStore.getState().tracks).toHaveLength(2);
    });
  });

  describe("playback controls", () => {
    it("sets current time", () => {
      useTimelineStore.getState().setCurrentTime(5000);
      expect(useTimelineStore.getState().currentTimeMs).toBe(5000);
    });

    it("clamps current time to 0 minimum", () => {
      useTimelineStore.getState().setCurrentTime(-1000);
      expect(useTimelineStore.getState().currentTimeMs).toBe(0);
    });

    it("sets playing state", () => {
      useTimelineStore.getState().setIsPlaying(true);
      expect(useTimelineStore.getState().isPlaying).toBe(true);
    });

    it("toggles play/pause", () => {
      expect(useTimelineStore.getState().isPlaying).toBe(false);
      useTimelineStore.getState().togglePlayPause();
      expect(useTimelineStore.getState().isPlaying).toBe(true);
      useTimelineStore.getState().togglePlayPause();
      expect(useTimelineStore.getState().isPlaying).toBe(false);
    });
  });

  describe("zoom controls", () => {
    it("sets zoom level", () => {
      useTimelineStore.getState().setZoom(2);
      expect(useTimelineStore.getState().zoom).toBe(2);
    });

    it("clamps zoom to minimum 0.1", () => {
      useTimelineStore.getState().setZoom(0.01);
      expect(useTimelineStore.getState().zoom).toBe(0.1);
    });

    it("clamps zoom to maximum 10", () => {
      useTimelineStore.getState().setZoom(20);
      expect(useTimelineStore.getState().zoom).toBe(10);
    });

    it("zooms in by 1.25x", () => {
      useTimelineStore.getState().setZoom(1);
      useTimelineStore.getState().zoomIn();
      expect(useTimelineStore.getState().zoom).toBe(1.25);
    });

    it("zooms out by dividing by 1.25", () => {
      useTimelineStore.getState().setZoom(1.25);
      useTimelineStore.getState().zoomOut();
      expect(useTimelineStore.getState().zoom).toBeCloseTo(1, 5);
    });

    it("does not zoom in beyond 10", () => {
      useTimelineStore.getState().setZoom(9);
      useTimelineStore.getState().zoomIn();
      expect(useTimelineStore.getState().zoom).toBe(10);
    });

    it("does not zoom out below 0.1", () => {
      useTimelineStore.getState().setZoom(0.11);
      useTimelineStore.getState().zoomOut();
      expect(useTimelineStore.getState().zoom).toBeCloseTo(0.1, 1);
    });
  });

  describe("clip selection", () => {
    it("selects a clip", () => {
      useTimelineStore.getState().selectClip("clip-1");
      expect(useTimelineStore.getState().selectedClipId).toBe("clip-1");
    });

    it("deselects a clip", () => {
      useTimelineStore.getState().selectClip("clip-1");
      useTimelineStore.getState().selectClip(null);
      expect(useTimelineStore.getState().selectedClipId).toBeNull();
    });
  });

  describe("duration", () => {
    it("sets timeline duration", () => {
      useTimelineStore.getState().setDuration(30000);
      expect(useTimelineStore.getState().durationMs).toBe(30000);
    });
  });

  describe("moveClip", () => {
    beforeEach(() => {
      const track = createMockTrack({
        clips: [
          createMockClip({ id: "clip-1", startMs: 0, endMs: 5000 }),
          createMockClip({ id: "clip-2", startMs: 5000, endMs: 10000 }),
        ],
      });
      useTimelineStore.getState().setTracks([track]);
    });

    it("moves a clip to a new position", () => {
      useTimelineStore.getState().moveClip("clip-1", 2000);
      const clips = useTimelineStore.getState().tracks[0].clips;
      expect(clips[0].startMs).toBe(2000);
      expect(clips[0].endMs).toBe(7000);
    });

    it("preserves clip duration when moving", () => {
      useTimelineStore.getState().moveClip("clip-1", 3000);
      const clip = useTimelineStore.getState().tracks[0].clips[0];
      expect(clip.endMs - clip.startMs).toBe(5000);
    });

    it("clamps to 0 when moving to negative position", () => {
      useTimelineStore.getState().moveClip("clip-1", -1000);
      const clip = useTimelineStore.getState().tracks[0].clips[0];
      expect(clip.startMs).toBe(0);
      expect(clip.endMs).toBe(5000);
    });

    it("does not affect other clips", () => {
      useTimelineStore.getState().moveClip("clip-1", 2000);
      const clip2 = useTimelineStore.getState().tracks[0].clips[1];
      expect(clip2.startMs).toBe(5000);
      expect(clip2.endMs).toBe(10000);
    });
  });

  describe("trimClip", () => {
    beforeEach(() => {
      const track = createMockTrack({
        clips: [createMockClip({ id: "clip-1", startMs: 1000, endMs: 5000 })],
      });
      useTimelineStore.getState().setTracks([track]);
    });

    it("trims a clip's start and end", () => {
      useTimelineStore.getState().trimClip("clip-1", 2000, 4000);
      const clip = useTimelineStore.getState().tracks[0].clips[0];
      expect(clip.startMs).toBe(2000);
      expect(clip.endMs).toBe(4000);
    });

    it("can extend a clip", () => {
      useTimelineStore.getState().trimClip("clip-1", 0, 8000);
      const clip = useTimelineStore.getState().tracks[0].clips[0];
      expect(clip.startMs).toBe(0);
      expect(clip.endMs).toBe(8000);
    });
  });

  describe("beat sync", () => {
    it("sets beats and BPM", () => {
      const beats = [
        { time_ms: 500, strength: 0.8 },
        { time_ms: 1000, strength: 0.9 },
      ];
      useTimelineStore.getState().setBeats(beats, 120);
      expect(useTimelineStore.getState().beats).toEqual(beats);
      expect(useTimelineStore.getState().bpm).toBe(120);
    });

    it("sets waveform data", () => {
      const waveform = [0.1, 0.5, 0.8, 0.3, 0.2];
      useTimelineStore.getState().setWaveform(waveform);
      expect(useTimelineStore.getState().waveform).toEqual(waveform);
    });

    it("toggles snap", () => {
      expect(useTimelineStore.getState().snapEnabled).toBe(true);
      useTimelineStore.getState().toggleSnap();
      expect(useTimelineStore.getState().snapEnabled).toBe(false);
      useTimelineStore.getState().toggleSnap();
      expect(useTimelineStore.getState().snapEnabled).toBe(true);
    });
  });
});
