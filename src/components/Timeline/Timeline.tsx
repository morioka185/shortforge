import { useRef, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTimelineStore } from "../../stores/timelineStore";
import { Track } from "./Track";
import { Playhead } from "./Playhead";
import { Waveform } from "./Waveform";
import { BeatMarkers } from "./BeatMarkers";
import { msToTimecode } from "../../lib/time";

export function Timeline() {
  const { t } = useTranslation();
  const {
    tracks,
    currentTimeMs,
    isPlaying,
    zoom,
    durationMs,
    beats,
    bpm,
    waveform,
    snapEnabled,
    setCurrentTime,
    togglePlayPause,
    zoomIn,
    zoomOut,
    toggleSnap,
  } = useTimelineStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [rulerDragging, setRulerDragging] = useState(false);

  /** Convert a mouse event x to time in ms, relative to the scroll container */
  const clientXToMs = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return 0;
      const rect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const px = clientX - rect.left + scrollLeft - 96; // 96px = track label width
      return Math.max(0, Math.min((px / (100 * zoom)) * 1000, durationMs));
    },
    [zoom, durationMs],
  );

  // --- Ruler drag: mousedown on ruler starts scrubbing ---
  const handleRulerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setRulerDragging(true);
      setCurrentTime(clientXToMs(e.clientX));
    },
    [clientXToMs, setCurrentTime],
  );

  useEffect(() => {
    if (!rulerDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCurrentTime(clientXToMs(e.clientX));
    };
    const handleMouseUp = () => {
      setRulerDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [rulerDragging, clientXToMs, setCurrentTime]);

  // --- Track area click: seek (fallback when not clicking a clip) ---
  const handleTrackAreaClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only seek if the click target is the track background, not a clip
      const target = e.target as HTMLElement;
      if (target.closest("[data-clip]")) return;
      setCurrentTime(clientXToMs(e.clientX));
    },
    [clientXToMs, setCurrentTime],
  );

  // Playhead scrub callback (from the Playhead component)
  const handlePlayheadScrub = useCallback(
    (ms: number) => setCurrentTime(ms),
    [setCurrentTime],
  );

  // --- Time ruler marks ---
  const totalWidthPx = (durationMs / 1000) * 100 * zoom;
  const intervalSec = zoom > 2 ? 1 : zoom > 0.5 ? 5 : 10;
  const marks: number[] = [];
  for (let s = 0; s <= durationMs / 1000; s += intervalSec) {
    marks.push(s);
  }

  const trackHeight = tracks.length * 40 + 24; // 40px per track + ruler
  const hasAudio = waveform.length > 0;
  const playheadHeight = trackHeight + (hasAudio ? 40 : 0);

  return (
    <div className="flex flex-col bg-gray-900 border-t border-gray-700 select-none">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border-b border-gray-700">
        <button
          onClick={togglePlayPause}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <span className="text-xs text-gray-400 font-mono min-w-[80px]">
          {msToTimecode(currentTimeMs)}
        </span>

        {bpm !== null && (
          <span className="text-xs text-amber-400 font-mono">
            {Math.round(bpm)} BPM
          </span>
        )}

        <div className="flex-1" />

        {beats.length > 0 && (
          <button
            onClick={toggleSnap}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              snapEnabled
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            }`}
          >
            Snap
          </button>
        )}

        <button
          onClick={zoomOut}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
        >
          -
        </button>
        <span className="text-xs text-gray-400 min-w-[40px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={zoomIn}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
        >
          +
        </button>
      </div>

      {/* Timeline content */}
      <div
        ref={containerRef}
        data-timeline-scroll
        className="overflow-x-auto overflow-y-auto relative"
        style={{ maxHeight: "240px" }}
      >
        {/* Time ruler — draggable for scrubbing */}
        <div className="flex sticky top-0 z-20">
          <div className="w-24 flex-shrink-0 bg-gray-800 border-r border-gray-700" />
          <div
            className="relative h-7 bg-gray-800 border-b border-gray-600 cursor-crosshair"
            style={{ width: `${totalWidthPx}px` }}
            onMouseDown={handleRulerMouseDown}
          >
            {marks.map((sec) => (
              <div
                key={sec}
                className="absolute top-0 h-full pointer-events-none"
                style={{ left: `${sec * 100 * zoom}px` }}
              >
                <div className="w-px h-3 bg-gray-500" />
                <span className="text-[9px] text-gray-500 ml-0.5">
                  {msToTimecode(sec * 1000)}
                </span>
              </div>
            ))}

            {/* Ruler playhead indicator (red line at current position) */}
            <div
              className="absolute top-0 h-full pointer-events-none"
              style={{ left: `${(currentTimeMs / 1000) * 100 * zoom}px` }}
            >
              <div className="w-0.5 h-full bg-red-500" />
            </div>
          </div>
        </div>

        {/* Tracks */}
        <div
          className="relative"
          style={{ minWidth: `${totalWidthPx + 96}px` }}
          onClick={handleTrackAreaClick}
        >
          {tracks.map((track) => (
            <Track key={track.id} track={track} zoom={zoom} />
          ))}

          {/* Waveform overlay for audio tracks */}
          {hasAudio && (
            <div className="flex">
              <div className="w-24 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex items-center px-2">
                <span className="text-xs text-gray-400 truncate">
                  Waveform
                </span>
              </div>
              <div
                className="relative h-10 bg-gray-850"
                style={{ width: `${totalWidthPx}px` }}
              >
                <Waveform
                  data={waveform}
                  width={totalWidthPx}
                  height={40}
                  color="#22c55e"
                />
                {beats.length > 0 && (
                  <BeatMarkers
                    beats={beats}
                    durationMs={durationMs}
                    width={totalWidthPx}
                    height={40}
                  />
                )}
              </div>
            </div>
          )}

          {tracks.length === 0 && !hasAudio && (
            <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
              {t("timeline.importToStart")}
            </div>
          )}

          {/* Playhead overlay */}
          <div
            className="absolute top-0 left-24"
            style={{ height: `${playheadHeight}px` }}
          >
            <Playhead
              currentTimeMs={currentTimeMs}
              zoom={zoom}
              height={playheadHeight}
              onScrub={handlePlayheadScrub}
              durationMs={durationMs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
