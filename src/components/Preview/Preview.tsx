import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { convertFileSrc } from "@tauri-apps/api/core";
import { SafeZone } from "./SafeZone";
import { useProjectStore } from "../../stores/projectStore";
import {
  useTimelineStore,
  type TimelineClip,
  type ClipTransform,
  DEFAULT_TRANSFORM,
} from "../../stores/timelineStore";
import { useTelopStore } from "../../stores/telopStore";
import { msToTimecode } from "../../lib/time";
import type { TelopTemplate, TelopStyle } from "../../types/telop";

type Platform = "tiktok" | "youtube_shorts" | "instagram_reels";

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "tiktok", label: "TikTok" },
  { id: "youtube_shorts", label: "YT Shorts" },
  { id: "instagram_reels", label: "Reels" },
];

/** Canvas dimensions (design space) */
const CANVAS_W = 1080;
const CANVAS_H = 1920;

/** Preview display size */
const PREVIEW_W = 270;
const PREVIEW_H = 480;

const SCALE = PREVIEW_W / CANVAS_W;

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff"]);

function isImageSource(source: string | undefined): boolean {
  if (!source) return false;
  const ext = source.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(ext);
}

export function Preview() {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const {
    tracks,
    currentTimeMs,
    isPlaying,
    togglePlayPause,
    setCurrentTime,
    setIsPlaying,
    durationMs,
    selectedClipId,
    selectClip,
    updateClipTransform,
    masterMuted,
    toggleMasterMute,
  } = useTimelineStore();
  const { getSelectedTemplate, customStyle } = useTelopStore();
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [safeZonePlatform, setSafeZonePlatform] = useState<Platform>(
    (project?.metadata.platform as Platform) || "tiktok",
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRefsMap = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioClipsRef = useRef<{ clip: TimelineClip; trackMuted: boolean; src: string }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastAudioSyncRef = useRef<number>(0);
  const [videoError, setVideoError] = useState(false);

  // --- Drag state ---
  const [dragging, setDragging] = useState<{
    clipId: string;
    startMouseX: number;
    startMouseY: number;
    startCanvasX: number;
    startCanvasY: number;
  } | null>(null);

  // Find the video clip active at the current playhead position
  const videoClip = useMemo(() => {
    for (const track of tracks) {
      if (track.type === "video") {
        for (const clip of track.clips) {
          if (
            clip.source &&
            currentTimeMs >= clip.startMs &&
            currentTimeMs <= clip.endMs
          ) {
            return clip;
          }
        }
      }
    }
    return null;
  }, [tracks, currentTimeMs]);

  // Build video src URL from local file path
  const videoSrc = useMemo(() => {
    if (!videoClip?.source) return null;
    try {
      return convertFileSrc(videoClip.source);
    } catch {
      return null;
    }
  }, [videoClip?.source]);

  // Detect if the current clip is a static image
  const isImage = useMemo(
    () => isImageSource(videoClip?.source),
    [videoClip?.source],
  );

  // Check if the video track is muted
  const videoTrackMuted = useMemo(() => {
    for (const track of tracks) {
      if (track.type === "video") {
        for (const clip of track.clips) {
          if (clip.id === videoClip?.id) return track.muted;
        }
      }
    }
    return false;
  }, [tracks, videoClip?.id]);

  // Collect all audio clips with their track muted state
  const audioClips = useMemo(() => {
    const result: { clip: TimelineClip; trackMuted: boolean; src: string }[] = [];
    for (const track of tracks) {
      if (track.type === "audio") {
        for (const clip of track.clips) {
          if (clip.source) {
            try {
              result.push({
                clip,
                trackMuted: track.muted,
                src: convertFileSrc(clip.source),
              });
            } catch {
              // skip invalid paths
            }
          }
        }
      }
    }
    return result;
  }, [tracks]);

  // Keep audioClips ref in sync (avoids stale closures in tick loop)
  audioClipsRef.current = audioClips;

  // Reset error state when video source changes
  useEffect(() => {
    setVideoError(false);
  }, [videoSrc]);

  // Find active telop clips at current time
  const activeTelopClips = useMemo(() => {
    const result: TimelineClip[] = [];
    for (const track of tracks) {
      if (track.type === "telop") {
        for (const clip of track.clips) {
          if (currentTimeMs >= clip.startMs && currentTimeMs <= clip.endMs) {
            result.push(clip);
          }
        }
      }
    }
    return result;
  }, [tracks, currentTimeMs]);

  // All draggable clips (video + active telops)
  const draggableClips = useMemo(() => {
    const clips: TimelineClip[] = [];
    if (videoClip) clips.push(videoClip);
    clips.push(...activeTelopClips);
    return clips;
  }, [videoClip, activeTelopClips]);

  const telopTemplate = getSelectedTemplate();

  // Throttle interval for Zustand store updates during playback (~30fps for UI)
  const lastStoreUpdateRef = useRef<number>(0);
  const STORE_UPDATE_MS = 33;

  // Interval (ms) between audio drift-correction checks during playback
  const AUDIO_SYNC_INTERVAL_MS = 500;
  // Drift threshold — only seek audio if it drifts more than this
  const AUDIO_DRIFT_THRESHOLD_SEC = 0.3;

  // Start / stop audio elements. Called once when playback starts/stops,
  // NOT on every animation frame.
  const startAudioPlayback = useCallback((timeMs: number) => {
    for (const { clip } of audioClipsRef.current) {
      const audioEl = audioRefsMap.current.get(clip.id);
      if (!audioEl) continue;
      const inRange = timeMs >= clip.startMs && timeMs <= clip.endMs;
      if (inRange) {
        audioEl.currentTime = (timeMs - clip.startMs) / 1000;
        audioEl.play().catch(() => {});
      }
    }
  }, []);

  const pauseAllAudio = useCallback(() => {
    for (const el of audioRefsMap.current.values()) {
      if (!el.paused) el.pause();
    }
  }, []);

  // Playback loop — let <video> play natively, read time from it
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      const video = videoRef.current;
      if (video && !video.paused) video.pause();
      pauseAllAudio();
      return;
    }

    const video = videoRef.current;
    const clip = videoClip;

    // Start native video playback at current position
    if (video && clip) {
      const targetSec =
        (useTimelineStore.getState().currentTimeMs - clip.startMs) / 1000;
      if (targetSec >= 0 && isFinite(video.duration) && targetSec <= video.duration) {
        video.currentTime = targetSec;
      }
      video.play().catch(() => {});
    }

    // Start audio playback once at correct position
    startAudioPlayback(useTimelineStore.getState().currentTimeMs);

    lastTimeRef.current = performance.now();
    lastStoreUpdateRef.current = 0;
    lastAudioSyncRef.current = 0;

    const tick = () => {
      const now = performance.now();
      let newTimeMs: number;

      if (video && clip && !video.paused) {
        // Video-driven: read time directly from the <video> element
        newTimeMs = video.currentTime * 1000 + clip.startMs;
      } else {
        // Fallback for audio-only / no-video timelines
        const delta = now - lastTimeRef.current;
        newTimeMs = useTimelineStore.getState().currentTimeMs + delta;
      }
      lastTimeRef.current = now;

      const dur = useTimelineStore.getState().durationMs;
      if (newTimeMs >= dur) {
        setCurrentTime(0);
        setIsPlaying(false);
        if (video && !video.paused) video.pause();
        pauseAllAudio();
        return;
      }

      // Only flush to Zustand store at throttled rate
      if (now - lastStoreUpdateRef.current >= STORE_UPDATE_MS) {
        setCurrentTime(newTimeMs);
        lastStoreUpdateRef.current = now;
      }

      // Periodically check audio drift & range boundaries (not every frame)
      if (now - lastAudioSyncRef.current >= AUDIO_SYNC_INTERVAL_MS) {
        lastAudioSyncRef.current = now;
        for (const { clip: ac } of audioClipsRef.current) {
          const audioEl = audioRefsMap.current.get(ac.id);
          if (!audioEl) continue;
          const inRange = newTimeMs >= ac.startMs && newTimeMs <= ac.endMs;
          if (inRange) {
            const targetSec = (newTimeMs - ac.startMs) / 1000;
            if (audioEl.paused) {
              audioEl.currentTime = targetSec;
              audioEl.play().catch(() => {});
            } else if (Math.abs(audioEl.currentTime - targetSec) > AUDIO_DRIFT_THRESHOLD_SEC) {
              audioEl.currentTime = targetSec;
            }
          } else {
            if (!audioEl.paused) audioEl.pause();
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, setCurrentTime, setIsPlaying, videoClip, startAudioPlayback, pauseAllAudio]);

  // Seek video and audio when paused (scrubbing / timeline click)
  useEffect(() => {
    if (isPlaying) return;
    const video = videoRef.current;
    if (video && videoClip) {
      const targetSec = (currentTimeMs - videoClip.startMs) / 1000;
      if (targetSec >= 0 && isFinite(video.duration) && targetSec <= video.duration) {
        video.currentTime = targetSec;
      }
    }
    // Seek audio elements to correct position (paused)
    for (const { clip } of audioClipsRef.current) {
      const audioEl = audioRefsMap.current.get(clip.id);
      if (!audioEl) continue;
      const inRange = currentTimeMs >= clip.startMs && currentTimeMs <= clip.endMs;
      if (inRange) {
        audioEl.currentTime = (currentTimeMs - clip.startMs) / 1000;
      }
    }
  }, [currentTimeMs, isPlaying, videoClip]);

  // Update audio muted state reactively (does NOT restart playback)
  useEffect(() => {
    for (const { clip, trackMuted } of audioClips) {
      const audioEl = audioRefsMap.current.get(clip.id);
      if (audioEl) {
        audioEl.muted = trackMuted || masterMuted;
      }
    }
  }, [audioClips, masterMuted]);

  // --- Drag handlers ---
  const handleMouseDown = useCallback(
    (clipId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      selectClip(clipId);

      const clip = draggableClips.find((c) => c.id === clipId);
      const t = clip?.transform ?? DEFAULT_TRANSFORM;

      setDragging({
        clipId,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startCanvasX: t.x,
        startCanvasY: t.y,
      });
    },
    [selectClip, draggableClips],
  );

  useEffect(() => {
    if (!dragging) return;

    // Pause undo tracking so the entire drag is a single undo step
    useTimelineStore.temporal.getState().pause();

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragging.startMouseX) / SCALE;
      const dy = (e.clientY - dragging.startMouseY) / SCALE;

      const newX = Math.max(0, Math.min(CANVAS_W, dragging.startCanvasX + dx));
      const newY = Math.max(0, Math.min(CANVAS_H, dragging.startCanvasY + dy));

      updateClipTransform(dragging.clipId, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setDragging(null);
      // Resume undo tracking — the net change becomes one undo entry
      useTimelineStore.temporal.getState().resume();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, updateClipTransform]);

  // Deselect on background click
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).closest("[data-preview-bg]")) {
        selectClip(null);
      }
    },
    [selectClip],
  );

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentTime(Number(e.target.value));
    },
    [setCurrentTime],
  );

  const videoTransform = videoClip?.transform ?? DEFAULT_TRANSFORM;

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* Preview container */}
      <div
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden shadow-xl"
        style={{
          width: `${PREVIEW_W}px`,
          height: `${PREVIEW_H}px`,
          cursor: dragging ? "grabbing" : "default",
        }}
        onClick={handleContainerClick}
      >
        {/* Video / Image frame */}
        {videoSrc && !videoError ? (
          <div
            data-clip-id={videoClip!.id}
            className={`absolute cursor-grab active:cursor-grabbing ${
              selectedClipId === videoClip!.id
                ? "ring-2 ring-blue-500 ring-offset-0"
                : ""
            }`}
            style={{
              width: `${PREVIEW_W * videoTransform.scaleX}px`,
              height: `${PREVIEW_H * videoTransform.scaleY}px`,
              left: `${(videoTransform.x / CANVAS_W) * PREVIEW_W - (PREVIEW_W * videoTransform.scaleX) / 2}px`,
              top: `${(videoTransform.y / CANVAS_H) * PREVIEW_H - (PREVIEW_H * videoTransform.scaleY) / 2}px`,
            }}
            onMouseDown={(e) => handleMouseDown(videoClip!.id, e)}
          >
            {isImage ? (
              <img
                src={videoSrc}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
                onError={() => {
                  console.error("Image load failed:", videoSrc);
                  setVideoError(true);
                }}
              />
            ) : (
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-cover pointer-events-none"
                muted={videoTrackMuted || masterMuted}
                playsInline
                preload="auto"
                onError={() => {
                  console.error("Video load failed:", videoSrc);
                  setVideoError(true);
                }}
              />
            )}
          </div>
        ) : videoError ? (
          <div
            data-preview-bg
            className="absolute inset-0 flex items-center justify-center text-red-400"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">!</div>
              <div className="text-xs">{t("preview.videoLoadError")}</div>
            </div>
          </div>
        ) : (
          <div
            data-preview-bg
            className="absolute inset-0 flex items-center justify-center text-gray-600"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">9:16</div>
              <div className="text-xs text-gray-500">
                {t("preview.addMedia")}
              </div>
            </div>
          </div>
        )}

        {/* Telop overlays */}
        {activeTelopClips.map((clip) => (
          <DraggableTelopOverlay
            key={clip.id}
            clip={clip}
            currentTimeMs={currentTimeMs}
            template={telopTemplate}
            customStyle={customStyle}
            previewScale={SCALE}
            isSelected={selectedClipId === clip.id}
            onMouseDown={(e) => handleMouseDown(clip.id, e)}
          />
        ))}

        {/* Timecode overlay */}
        <div className="absolute top-2 left-2 bg-black/50 px-1.5 py-0.5 rounded text-[10px] text-white/70 font-mono pointer-events-none">
          {msToTimecode(currentTimeMs)}
        </div>

        {/* Safe zone overlay */}
        <SafeZone
          platform={safeZonePlatform}
          width={PREVIEW_W}
          visible={showSafeZone}
        />
      </div>

      {/* Hidden audio elements for audio track clips */}
      {audioClips.map(({ clip, src }) => (
        <audio
          key={clip.id}
          ref={(el) => {
            if (el) {
              audioRefsMap.current.set(clip.id, el);
            } else {
              audioRefsMap.current.delete(clip.id);
            }
          }}
          src={src}
          preload="auto"
          style={{ display: "none" }}
        />
      ))}

      {/* Position info for selected clip */}
      {selectedClipId && (
        <PositionInfo
          clipId={selectedClipId}
          tracks={tracks}
          updateClipTransform={updateClipTransform}
        />
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 w-full max-w-xs">
        <button
          onClick={togglePlayPause}
          className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <input
          type="range"
          min="0"
          max={durationMs}
          value={currentTimeMs}
          onChange={handleSeek}
          className="flex-1 accent-blue-500"
        />

        <button
          onClick={toggleMasterMute}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors text-sm ${
            masterMuted
              ? "bg-red-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
          title={masterMuted ? t("preview.unmute") : t("preview.mute")}
        >
          {masterMuted ? "🔇" : "🔊"}
        </button>

        <span className="text-xs text-gray-400 font-mono min-w-[56px]">
          {msToTimecode(currentTimeMs)}
        </span>
      </div>

      {/* Safe zone options */}
      <div className="flex flex-col items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showSafeZone}
            onChange={(e) => setShowSafeZone(e.target.checked)}
            className="accent-blue-500"
          />
          {t("preview.showSafeZone")}
        </label>

        {showSafeZone && (
          <div className="flex gap-1">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSafeZonePlatform(p.id)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  safeZonePlatform === p.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Position info bar ---

function PositionInfo({
  clipId,
  tracks,
  updateClipTransform,
}: {
  clipId: string;
  tracks: { clips: TimelineClip[] }[];
  updateClipTransform: (id: string, t: Partial<ClipTransform>) => void;
}) {
  const { t: tr } = useTranslation();
  const clip = useMemo(() => {
    for (const track of tracks) {
      for (const c of track.clips) {
        if (c.id === clipId) return c;
      }
    }
    return null;
  }, [clipId, tracks]);

  if (!clip) return null;

  const t = clip.transform ?? DEFAULT_TRANSFORM;

  return (
    <div className="flex items-center gap-3 text-[10px] text-gray-400 bg-gray-800 rounded px-2 py-1">
      <span className="text-gray-500 truncate max-w-[80px]">{clip.label}</span>
      <label className="flex items-center gap-1">
        X
        <input
          type="number"
          value={Math.round(t.x)}
          onChange={(e) =>
            updateClipTransform(clipId, { x: Number(e.target.value) })
          }
          className="w-12 bg-gray-700 rounded px-1 py-0.5 text-white text-center"
        />
      </label>
      <label className="flex items-center gap-1">
        Y
        <input
          type="number"
          value={Math.round(t.y)}
          onChange={(e) =>
            updateClipTransform(clipId, { y: Number(e.target.value) })
          }
          className="w-12 bg-gray-700 rounded px-1 py-0.5 text-white text-center"
        />
      </label>
      <label className="flex items-center gap-1">
        {tr("preview.posScale")}
        <input
          type="number"
          step="0.1"
          min="0.1"
          max="5"
          value={t.scaleX.toFixed(1)}
          onChange={(e) => {
            const v = Number(e.target.value);
            updateClipTransform(clipId, { scaleX: v, scaleY: v });
          }}
          className="w-12 bg-gray-700 rounded px-1 py-0.5 text-white text-center"
        />
      </label>
      <button
        className="text-gray-500 hover:text-white"
        title={tr("preview.resetPosition")}
        onClick={() =>
          updateClipTransform(clipId, { ...DEFAULT_TRANSFORM })
        }
      >
        Reset
      </button>
    </div>
  );
}

// --- Draggable Telop Overlay ---

interface DraggableTelopOverlayProps {
  clip: TimelineClip;
  currentTimeMs: number;
  template: TelopTemplate | undefined;
  customStyle: Partial<TelopStyle>;
  previewScale: number;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

interface CharAnimStyle {
  opacity: number;
  translateY: number;
  scale: number;
  rotate: number;
}

function DraggableTelopOverlay({
  clip,
  currentTimeMs,
  template,
  customStyle,
  previewScale,
  isSelected,
  onMouseDown,
}: DraggableTelopOverlayProps) {
  const text = clip.label;
  const chars = text.split("");
  const elapsed = currentTimeMs - clip.startMs;

  const t = clip.transform ?? {
    x: CANVAS_W / 2,
    y: CANVAS_H * 0.75,
    scaleX: 1,
    scaleY: 1,
  };

  const defaultStyle: TelopStyle = {
    font_family: "Noto Sans JP, sans-serif",
    font_size: 42,
    font_weight: 900,
    color: "#FFFFFF",
    outline: { enabled: true, color: "#000000", width: 2 },
  };

  const style: TelopStyle = template
    ? { ...template.default_style, ...customStyle }
    : { ...defaultStyle, ...customStyle };

  const fontSize = style.font_size * previewScale * t.scaleX;

  // Convert canvas position to preview position
  const previewX = (t.x / CANVAS_W) * PREVIEW_W;
  const previewY = (t.y / CANVAS_H) * PREVIEW_H;

  return (
    <div
      className={`absolute cursor-grab active:cursor-grabbing ${
        isSelected ? "ring-2 ring-yellow-400 ring-offset-0 rounded" : ""
      }`}
      style={{
        left: `${previewX}px`,
        top: `${previewY}px`,
        transform: "translate(-50%, -50%)",
      }}
      onMouseDown={onMouseDown}
    >
      <div className="flex whitespace-nowrap">
        {chars.map((char, i) => {
          const delayMs = template?.animation?.delay_per_unit_ms ?? 70;
          const animDurationMs = template?.animation?.duration_ms ?? 200;
          const charStartMs = i * delayMs;
          const charElapsed = Math.max(0, elapsed - charStartMs);
          const charProgress = Math.min(charElapsed / animDurationMs, 1);

          const anim = template
            ? getTelopCharStyle(template, charProgress)
            : {
                opacity: charProgress >= 0 ? 1 : 0,
                translateY: 0,
                scale: 1,
                rotate: 0,
              };

          const outlineWidth = style.outline?.enabled
            ? (style.outline.width ?? 2) * previewScale
            : 0;
          const outlineColor = style.outline?.color ?? "#000000";

          return (
            <span
              key={i}
              className="inline-block"
              style={{
                fontFamily: style.font_family || "sans-serif",
                fontSize: `${fontSize}px`,
                fontWeight: style.font_weight || 900,
                color: style.color || "#FFFFFF",
                opacity: anim.opacity,
                transform: `translateY(${anim.translateY * previewScale}px) scale(${anim.scale}) rotate(${anim.rotate}deg)`,
                WebkitTextStroke:
                  outlineWidth > 0
                    ? `${outlineWidth}px ${outlineColor}`
                    : undefined,
                paintOrder: "stroke fill",
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// --- Animation helpers ---

function getTelopCharStyle(
  template: {
    animation: {
      keyframes?: Array<{
        t: number;
        opacity?: number;
        translate_y?: number;
        scale?: number;
        rotate?: number;
      }>;
      from?: Record<string, number>;
      to?: Record<string, number>;
    };
  },
  progress: number,
): CharAnimStyle {
  const anim = template.animation;

  if (anim.keyframes && anim.keyframes.length > 0) {
    return interpolateTelopKeyframes(anim.keyframes, progress);
  }

  const fromOpacity = anim.from?.opacity ?? 0;
  const toOpacity = anim.to?.opacity ?? 1;

  return {
    opacity: fromOpacity + (toOpacity - fromOpacity) * progress,
    translateY: 0,
    scale: 1,
    rotate: 0,
  };
}

function interpolateTelopKeyframes(
  keyframes: Array<{
    t: number;
    opacity?: number;
    translate_y?: number;
    scale?: number;
    rotate?: number;
  }>,
  progress: number,
): CharAnimStyle {
  if (progress <= keyframes[0].t) return kfStyle(keyframes[0]);
  if (progress >= keyframes[keyframes.length - 1].t)
    return kfStyle(keyframes[keyframes.length - 1]);

  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (progress >= a.t && progress <= b.t) {
      const seg = b.t - a.t;
      const p = seg > 0 ? (progress - a.t) / seg : 1;
      const sa = kfStyle(a);
      const sb = kfStyle(b);
      return {
        opacity: sa.opacity + (sb.opacity - sa.opacity) * p,
        translateY: sa.translateY + (sb.translateY - sa.translateY) * p,
        scale: sa.scale + (sb.scale - sa.scale) * p,
        rotate: sa.rotate + (sb.rotate - sa.rotate) * p,
      };
    }
  }

  return kfStyle(keyframes[keyframes.length - 1]);
}

function kfStyle(kf: {
  opacity?: number;
  translate_y?: number;
  scale?: number;
  rotate?: number;
}): CharAnimStyle {
  return {
    opacity: kf.opacity ?? 1,
    translateY: kf.translate_y ?? 0,
    scale: kf.scale ?? 1,
    rotate: kf.rotate ?? 0,
  };
}
