import { useCallback } from "react";
import { useTimelineStore, type TimelineClip, type TimelineTrackData, TRACK_COLORS } from "../stores/timelineStore";

let clipCounter = 0;

export function useTimeline() {
  const {
    tracks,
    setTracks,
    addTrack,
    setDuration,
    moveClip,
    trimClip,
  } = useTimelineStore();

  const addVideoClip = useCallback(
    (source: string, durationMs: number) => {
      const clipId = `clip-${++clipCounter}`;
      const clip: TimelineClip = {
        id: clipId,
        trackId: "video-1",
        type: "video",
        startMs: 0,
        endMs: durationMs,
        label: source.split("/").pop() || "Video",
        source,
        color: TRACK_COLORS.video,
      };

      const existingVideoTrack = tracks.find((t) => t.type === "video");
      if (existingVideoTrack) {
        const updated = tracks.map((t) =>
          t.id === existingVideoTrack.id
            ? { ...t, clips: [...t.clips, clip] }
            : t,
        );
        setTracks(updated);
      } else {
        const track: TimelineTrackData = {
          id: "video-1",
          type: "video",
          label: "映像",
          muted: false,
          clips: [clip],
        };
        addTrack(track);
      }

      setDuration(Math.max(useTimelineStore.getState().durationMs, durationMs));
    },
    [tracks, setTracks, addTrack, setDuration],
  );

  const addTelopFromSrt = useCallback(
    (
      cues: Array<{ index: number; start_ms: number; end_ms: number; text: string }>,
    ) => {
      const clips: TimelineClip[] = cues.map((cue) => ({
        id: `telop-${++clipCounter}`,
        trackId: "telop-1",
        type: "telop" as const,
        startMs: cue.start_ms,
        endMs: cue.end_ms,
        label: cue.text.substring(0, 20),
        color: TRACK_COLORS.telop,
      }));

      const existingTelopTrack = tracks.find((t) => t.type === "telop");
      if (existingTelopTrack) {
        const updated = tracks.map((t) =>
          t.id === existingTelopTrack.id
            ? { ...t, clips: [...t.clips, ...clips] }
            : t,
        );
        setTracks(updated);
      } else {
        const track: TimelineTrackData = {
          id: "telop-1",
          type: "telop",
          label: "テロップ",
          muted: false,
          clips,
        };
        addTrack(track);
      }
    },
    [tracks, setTracks, addTrack],
  );

  const addAudioClip = useCallback(
    (source: string, durationMs: number) => {
      const clipId = `audio-${++clipCounter}`;
      const clip: TimelineClip = {
        id: clipId,
        trackId: "audio-1",
        type: "audio",
        startMs: 0,
        endMs: durationMs,
        label: source.split("/").pop() || "Audio",
        source,
        color: TRACK_COLORS.audio,
      };

      const existingAudioTrack = tracks.find((t) => t.type === "audio");
      if (existingAudioTrack) {
        const updated = tracks.map((t) =>
          t.id === existingAudioTrack.id
            ? { ...t, clips: [...t.clips, clip] }
            : t,
        );
        setTracks(updated);
      } else {
        const track: TimelineTrackData = {
          id: "audio-1",
          type: "audio",
          label: "音声",
          muted: false,
          clips: [clip],
        };
        addTrack(track);
      }
    },
    [tracks, setTracks, addTrack],
  );

  return {
    addVideoClip,
    addTelopFromSrt,
    addAudioClip,
    moveClip,
    trimClip,
  };
}
