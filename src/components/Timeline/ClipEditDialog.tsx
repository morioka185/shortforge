import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useTimelineStore } from "../../stores/timelineStore";
import { useMediaStore } from "../../stores/mediaStore";
import { Button } from "../Common/Button";
import { msToTimecode, timecodeToMs } from "../../lib/time";

/** Frame-step presets (label, delta in ms) */
const STEP_PRESETS = [
  { label: "-1s", delta: -1000 },
  { label: "-0.1s", delta: -100 },
  { label: "-1F", delta: -33 },
  { label: "+1F", delta: 33 },
  { label: "+0.1s", delta: 100 },
  { label: "+1s", delta: 1000 },
] as const;

export function ClipEditDialog() {
  const { t } = useTranslation();
  const {
    tracks,
    editingClipId,
    setEditingClipId,
    trimClip,
    splitClip,
    deleteClip,
    durationMs: timelineDurationMs,
  } = useTimelineStore();
  const { importedMedia } = useMediaStore();

  const clip = useMemo(() => {
    if (!editingClipId) return null;
    for (const track of tracks) {
      for (const c of track.clips) {
        if (c.id === editingClipId) return c;
      }
    }
    return null;
  }, [editingClipId, tracks]);

  // Local editing state (applied only on "適用")
  const [startMs, setStartMs] = useState(0);
  const [endMs, setEndMs] = useState(0);
  const [cursorMs, setCursorMs] = useState(0);

  // Text inputs
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [cursorText, setCursorText] = useState("");
  const [durationText, setDurationText] = useState("");

  // Video preview
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const rafRef = useRef<number>(0);

  // Original range (for slider padding)
  const origStartMs = useRef(0);
  const origEndMs = useRef(0);

  // Video src
  const videoSrc = useMemo(() => {
    if (!clip?.source) return null;
    try {
      return convertFileSrc(clip.source);
    } catch {
      return null;
    }
  }, [clip?.source]);

  // Source media duration (max clip length)
  const sourceDurationMs = useMemo(() => {
    if (!clip?.source) return Infinity;
    const media = importedMedia.find((m) => m.path === clip.source);
    return media?.durationMs ?? Infinity;
  }, [clip?.source, importedMedia]);

  // ---- Init when dialog opens ----
  useEffect(() => {
    if (!clip) return;
    origStartMs.current = clip.startMs;
    origEndMs.current = clip.endMs;
    setStartMs(clip.startMs);
    setEndMs(clip.endMs);
    setCursorMs(clip.startMs);
    setIsPreviewPlaying(false);
  }, [editingClipId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync text fields from numeric values
  useEffect(() => { setStartText(msToTimecode(startMs)); }, [startMs]);
  useEffect(() => { setEndText(msToTimecode(endMs)); }, [endMs]);
  useEffect(() => { setCursorText(msToTimecode(cursorMs)); }, [cursorMs]);
  useEffect(() => { setDurationText(((endMs - startMs) / 1000).toFixed(3)); }, [startMs, endMs]);

  // ---- Seek video when cursor changes (while paused) ----
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isPreviewPlaying) return;
    const timeInSource = (cursorMs - startMs) / 1000;
    if (isFinite(video.duration) && timeInSource >= 0 && timeInSource <= video.duration) {
      video.currentTime = timeInSource;
    }
  }, [cursorMs, isPreviewPlaying, startMs]);

  // ---- Playback loop: read video.currentTime → cursorMs ----
  useEffect(() => {
    if (!isPreviewPlaying) {
      cancelAnimationFrame(rafRef.current);
      const video = videoRef.current;
      if (video && !video.paused) video.pause();
      return;
    }

    const video = videoRef.current;
    if (!video) { setIsPreviewPlaying(false); return; }

    const sourceTimeSec = (cursorMs - startMs) / 1000;
    if (sourceTimeSec >= 0) video.currentTime = sourceTimeSec;
    video.play().catch(() => setIsPreviewPlaying(false));

    const tick = () => {
      const currentSourceMs = video.currentTime * 1000;
      const timelineMs = startMs + currentSourceMs;
      if (timelineMs >= endMs) {
        video.pause();
        setCursorMs(endMs);
        setIsPreviewPlaying(false);
        return;
      }
      setCursorMs(Math.round(timelineMs));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPreviewPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePreviewPlay = useCallback(() => {
    if (isPreviewPlaying) {
      setIsPreviewPlaying(false);
    } else {
      // If at end, restart from start
      if (cursorMs >= endMs) setCursorMs(startMs);
      setIsPreviewPlaying(true);
    }
  }, [isPreviewPlaying, cursorMs, endMs, startMs]);

  // ---- Text commit handlers ----
  const commitStartText = useCallback(() => {
    try {
      const ms = timecodeToMs(startText);
      if (ms >= 0 && ms < endMs - 100) {
        setStartMs(ms);
        if (cursorMs < ms) setCursorMs(ms);
      } else {
        setStartText(msToTimecode(startMs));
      }
    } catch {
      setStartText(msToTimecode(startMs));
    }
  }, [startText, endMs, startMs, cursorMs]);

  const commitEndText = useCallback(() => {
    try {
      const ms = timecodeToMs(endText);
      if (ms > startMs + 100) {
        setEndMs(ms);
        if (cursorMs > ms) setCursorMs(ms);
      } else {
        setEndText(msToTimecode(endMs));
      }
    } catch {
      setEndText(msToTimecode(endMs));
    }
  }, [endText, startMs, endMs, cursorMs]);

  const commitCursorText = useCallback(() => {
    try {
      const ms = timecodeToMs(cursorText);
      if (ms >= startMs && ms <= endMs) {
        setCursorMs(ms);
      } else {
        setCursorText(msToTimecode(cursorMs));
      }
    } catch {
      setCursorText(msToTimecode(cursorMs));
    }
  }, [cursorText, startMs, endMs, cursorMs]);

  const commitDurationText = useCallback(() => {
    const sec = parseFloat(durationText);
    if (isNaN(sec) || sec <= 0) {
      setDurationText(((endMs - startMs) / 1000).toFixed(3));
      return;
    }
    // Clamp desired duration to source media length
    const desiredMs = Math.round(
      Math.min(sec * 1000, sourceDurationMs),
    );
    if (desiredMs < 100) {
      setDurationText(((endMs - startMs) / 1000).toFixed(3));
      return;
    }

    let newStart = startMs;
    let newEnd = startMs + desiredMs;

    // If end exceeds timeline duration, shift start back
    if (newEnd > timelineDurationMs) {
      newStart = timelineDurationMs - desiredMs;
      newEnd = timelineDurationMs;
    }
    // Ensure start doesn't go negative
    if (newStart < 0) {
      newStart = 0;
      newEnd = desiredMs;
    }

    setStartMs(newStart);
    setEndMs(newEnd);
    setCursorMs((prev) =>
      Math.round(Math.max(newStart, Math.min(newEnd, prev))),
    );
  }, [durationText, startMs, endMs, sourceDurationMs, timelineDurationMs]);

  // ---- Step cursor ----
  const stepCursor = useCallback(
    (deltaMs: number) => {
      setCursorMs((prev) =>
        Math.round(Math.max(startMs, Math.min(endMs, prev + deltaMs))),
      );
    },
    [startMs, endMs],
  );

  // ---- Set IN / OUT at cursor ----
  const setInAtCursor = useCallback(() => {
    if (cursorMs < endMs - 100) setStartMs(cursorMs);
  }, [cursorMs, endMs]);

  const setOutAtCursor = useCallback(() => {
    if (cursorMs > startMs + 100) setEndMs(cursorMs);
  }, [cursorMs, startMs]);

  // ---- Actions ----
  const handleClose = useCallback(() => {
    setIsPreviewPlaying(false);
    setEditingClipId(null);
  }, [setEditingClipId]);

  const handleApply = useCallback(() => {
    if (!clip) return;
    if (startMs !== clip.startMs || endMs !== clip.endMs) {
      trimClip(clip.id, Math.round(startMs), Math.round(endMs));
    }
    setEditingClipId(null);
  }, [clip, startMs, endMs, trimClip, setEditingClipId]);

  const handleSplit = useCallback(() => {
    if (!clip) return;
    if (cursorMs <= startMs || cursorMs >= endMs) return;
    splitClip(clip.id, Math.round(cursorMs));
  }, [clip, cursorMs, startMs, endMs, splitClip]);

  const handleDelete = useCallback(() => {
    if (!clip) return;
    deleteClip(clip.id);
    setEditingClipId(null);
  }, [clip, deleteClip, setEditingClipId]);

  // ---- Keyboard ----
  useEffect(() => {
    if (!clip) return;
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "Escape") handleClose();
      if (e.key === " ") {
        e.preventDefault();
        togglePreviewPlay();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepCursor(e.shiftKey ? -100 : -33);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        stepCursor(e.shiftKey ? 100 : 33);
      }
      if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        setInAtCursor();
      }
      if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        setOutAtCursor();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [clip, handleClose, stepCursor, togglePreviewPlay, setInAtCursor, setOutAtCursor]);

  if (!clip) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="bg-gray-900 rounded-xl shadow-2xl w-[560px] max-h-[85vh] flex flex-col border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-white">{t("clipEdit.header")}</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[400px]">
              {clip.label}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Video Preview */}
          {videoSrc && (
            <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center aspect-video">
              <video
                ref={videoRef}
                src={videoSrc}
                className="max-w-full max-h-full object-contain"
                muted
                playsInline
                preload="auto"
              />
              {/* Play/Pause overlay button */}
              <button
                onClick={togglePreviewPlay}
                className="absolute inset-0 flex items-center justify-center bg-transparent hover:bg-black/20 transition-colors group"
              >
                {!isPreviewPlaying && (
                  <div className="w-12 h-12 flex items-center justify-center bg-black/50 group-hover:bg-black/70 rounded-full transition-colors">
                    <span className="text-white text-lg ml-0.5">▶</span>
                  </div>
                )}
              </button>
              {/* Timecode badge */}
              <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white font-mono pointer-events-none">
                {msToTimecode(cursorMs)}
              </div>
            </div>
          )}

          {/* Step buttons + IN/OUT set */}
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={setInAtCursor}
              title={t("clipEdit.setInTitle")}
              className="px-2 py-1 text-[11px] font-bold bg-blue-800 hover:bg-blue-700 text-blue-200 rounded transition-colors"
            >
              IN
            </button>
            {STEP_PRESETS.map((s) => (
              <button
                key={s.label}
                onClick={() => stepCursor(s.delta)}
                className="px-2 py-1 text-[11px] font-mono bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={setOutAtCursor}
              title={t("clipEdit.setOutTitle")}
              className="px-2 py-1 text-[11px] font-bold bg-blue-800 hover:bg-blue-700 text-blue-200 rounded transition-colors"
            >
              OUT
            </button>
          </div>

          {/* Range slider */}
          <RangeBar
            startMs={startMs}
            endMs={endMs}
            cursorMs={cursorMs}
            origStartMs={origStartMs.current}
            origEndMs={origEndMs.current}
            onStartChange={(ms) => {
              setStartMs(ms);
              if (cursorMs < ms) setCursorMs(ms);
            }}
            onEndChange={(ms) => {
              setEndMs(ms);
              if (cursorMs > ms) setCursorMs(ms);
            }}
            onSlide={(newStart, newEnd) => {
              const delta = newStart - startMs;
              setStartMs(newStart);
              setEndMs(newEnd);
              setCursorMs((prev) =>
                Math.round(Math.max(newStart, Math.min(newEnd, prev + delta))),
              );
            }}
            onCursorChange={setCursorMs}
            color={clip.color}
          />

          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <TimeInput
              label={t("clipEdit.startIn")}
              value={startText}
              onChange={setStartText}
              onCommit={commitStartText}
            />
            <TimeInput
              label={t("clipEdit.endOut")}
              value={endText}
              onChange={setEndText}
              onCommit={commitEndText}
            />
            <TimeInput
              label={t("clipEdit.cursorPosition")}
              value={cursorText}
              onChange={setCursorText}
              onCommit={commitCursorText}
            />
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-gray-400 font-medium">
                {t("clipEdit.durationSec")}
              </span>
              <input
                type="text"
                value={durationText}
                onChange={(e) => setDurationText(e.target.value)}
                onBlur={commitDurationText}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitDurationText();
                }}
                className="text-sm text-white font-mono bg-gray-800 border border-gray-600 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full"
                placeholder={t("clipEdit.durationPlaceholder")}
              />
            </div>
          </div>

          {/* Split */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSplit}
                disabled={cursorMs <= startMs || cursorMs >= endMs}
              >
                {t("clipEdit.splitAtPosition")}
              </Button>
              <span className="text-[11px] text-gray-500">
                {t("clipEdit.splitDescription", { timecode: msToTimecode(cursorMs) })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center px-6 py-4 border-t border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
          >
            {t("clipEdit.delete")}
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              {t("clipEdit.cancel")}
            </Button>
            <Button variant="primary" size="sm" onClick={handleApply}>
              {t("clipEdit.apply")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Time Input ----

function TimeInput({
  label,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-gray-400 font-medium">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit();
        }}
        className="text-sm text-white font-mono bg-gray-800 border border-gray-600 rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none w-full"
        placeholder="MM:SS.mmm"
      />
    </div>
  );
}

// ---- Range Bar with draggable handles ----

function RangeBar({
  startMs,
  endMs,
  cursorMs,
  origStartMs,
  origEndMs,
  onStartChange,
  onEndChange,
  onSlide,
  onCursorChange,
  color,
}: {
  startMs: number;
  endMs: number;
  cursorMs: number;
  origStartMs: number;
  origEndMs: number;
  onStartChange: (ms: number) => void;
  onEndChange: (ms: number) => void;
  onSlide: (newStartMs: number, newEndMs: number) => void;
  onCursorChange: (ms: number) => void;
  color: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  const padding = Math.max((origEndMs - origStartMs) * 0.15, 500);
  const sliderMin = Math.max(0, origStartMs - padding);
  const sliderMax = origEndMs + padding;
  const sliderRange = sliderMax - sliderMin;

  const msToPct = (ms: number) => ((ms - sliderMin) / sliderRange) * 100;

  const pxToMs = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      if (!bar) return 0;
      const rect = bar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(sliderMin + pct * sliderRange);
    },
    [sliderMin, sliderRange],
  );

  const startDrag = useCallback(
    (onMove: (ms: number) => void, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const handleMove = (ev: MouseEvent) => onMove(pxToMs(ev.clientX));
      const handleUp = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [pxToMs],
  );

  // Drag the entire range (slide without resizing)
  const startSlideDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const originMs = pxToMs(e.clientX);
      const dragStartMs = startMs;
      const dragEndMs = endMs;
      const duration = dragEndMs - dragStartMs;

      const handleMove = (ev: MouseEvent) => {
        const nowMs = pxToMs(ev.clientX);
        const delta = nowMs - originMs;
        let newStart = dragStartMs + delta;
        let newEnd = dragEndMs + delta;
        // Clamp within slider bounds
        if (newStart < sliderMin) {
          newStart = sliderMin;
          newEnd = sliderMin + duration;
        }
        if (newEnd > sliderMax) {
          newEnd = sliderMax;
          newStart = sliderMax - duration;
        }
        onSlide(Math.round(newStart), Math.round(newEnd));
      };
      const handleUp = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [pxToMs, startMs, endMs, sliderMin, sliderMax, onSlide],
  );

  const handleBarClick = useCallback(
    (e: React.MouseEvent) => {
      onCursorChange(pxToMs(e.clientX));
    },
    [onCursorChange, pxToMs],
  );

  const startPct = msToPct(startMs);
  const endPct = msToPct(endMs);
  const cursorPct = msToPct(cursorMs);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-gray-500 font-mono px-0.5">
        <span>{msToTimecode(sliderMin)}</span>
        <span>{msToTimecode(sliderMax)}</span>
      </div>
      <div
        ref={barRef}
        className="relative h-10 bg-gray-800 rounded-lg cursor-pointer select-none"
        onClick={handleBarClick}
      >
        {/* Active range fill — draggable to slide */}
        <div
          className="absolute top-0 bottom-0 rounded opacity-30 cursor-grab active:cursor-grabbing z-[5]"
          style={{
            left: `${startPct}%`,
            width: `${endPct - startPct}%`,
            backgroundColor: color,
          }}
          onMouseDown={startSlideDrag}
        >
          {/* Tick marks inside active range */}
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="absolute top-2 bottom-2 w-px bg-white/10 pointer-events-none"
              style={{ left: `${(i + 1) * 10}%` }}
            />
          ))}
        </div>

        {/* Start handle */}
        <div
          className="absolute top-0 bottom-0 w-2.5 flex items-center justify-center cursor-col-resize z-10 group"
          style={{ left: `calc(${startPct}% - 5px)` }}
          onMouseDown={(e) =>
            startDrag((ms) => {
              onStartChange(Math.max(sliderMin, Math.min(ms, endMs - 100)));
            }, e)
          }
        >
          <div className="w-1 h-6 bg-white/70 group-hover:bg-white rounded-full transition-colors" />
        </div>

        {/* End handle */}
        <div
          className="absolute top-0 bottom-0 w-2.5 flex items-center justify-center cursor-col-resize z-10 group"
          style={{ left: `calc(${endPct}% - 5px)` }}
          onMouseDown={(e) =>
            startDrag((ms) => {
              onEndChange(Math.max(startMs + 100, Math.min(ms, sliderMax)));
            }, e)
          }
        >
          <div className="w-1 h-6 bg-white/70 group-hover:bg-white rounded-full transition-colors" />
        </div>

        {/* IN / OUT labels */}
        <div
          className="absolute -bottom-4 text-[9px] text-gray-400 font-mono pointer-events-none"
          style={{ left: `${startPct}%`, transform: "translateX(-50%)" }}
        >
          IN
        </div>
        <div
          className="absolute -bottom-4 text-[9px] text-gray-400 font-mono pointer-events-none"
          style={{ left: `${endPct}%`, transform: "translateX(-50%)" }}
        >
          OUT
        </div>

        {/* Cursor line + handle */}
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none"
          style={{ left: `${cursorPct}%` }}
        >
          <div className="absolute inset-y-0 w-px bg-red-500 -translate-x-px" />
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 pointer-events-auto cursor-grab active:cursor-grabbing"
            style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "6px solid #ef4444",
            }}
            onMouseDown={(e) =>
              startDrag((ms) => {
                onCursorChange(Math.max(startMs, Math.min(ms, endMs)));
              }, e)
            }
          />
        </div>
      </div>
      {/* Spacing for IN/OUT labels */}
      <div className="h-2" />
    </div>
  );
}
