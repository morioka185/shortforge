import { useRef, useCallback } from "react";
import { useTimelineStore } from "../../stores/timelineStore";
import { Track } from "./Track";
import { Playhead } from "./Playhead";
import { msToTimecode } from "../../lib/time";

export function Timeline() {
  const {
    tracks,
    currentTimeMs,
    isPlaying,
    zoom,
    durationMs,
    setCurrentTime,
    togglePlayPause,
    zoomIn,
    zoomOut,
  } = useTimelineStore();

  const containerRef = useRef<HTMLDivElement>(null);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const x = e.clientX - rect.left + scrollLeft - 96; // 96px = track label width
      const timeMs = (x / (100 * zoom)) * 1000;
      setCurrentTime(Math.max(0, Math.min(timeMs, durationMs)));
    },
    [zoom, durationMs, setCurrentTime],
  );

  // Generate time ruler marks
  const totalWidthPx = (durationMs / 1000) * 100 * zoom;
  const intervalSec = zoom > 2 ? 1 : zoom > 0.5 ? 5 : 10;
  const marks: number[] = [];
  for (let s = 0; s <= durationMs / 1000; s += intervalSec) {
    marks.push(s);
  }

  const trackHeight = tracks.length * 40 + 24; // 40px per track + ruler

  return (
    <div className="flex flex-col bg-gray-900 border-t border-gray-700">
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
        <div className="flex-1" />
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
        className="overflow-x-auto overflow-y-auto relative"
        style={{ maxHeight: "200px" }}
        onClick={handleTimelineClick}
      >
        {/* Time ruler */}
        <div className="flex sticky top-0 z-10">
          <div className="w-24 flex-shrink-0 bg-gray-800 border-r border-gray-700" />
          <div
            className="relative h-6 bg-gray-800 border-b border-gray-600"
            style={{ width: `${totalWidthPx}px` }}
          >
            {marks.map((sec) => (
              <div
                key={sec}
                className="absolute top-0 h-full"
                style={{ left: `${sec * 100 * zoom}px` }}
              >
                <div className="w-px h-2 bg-gray-500" />
                <span className="text-[9px] text-gray-500 ml-0.5">
                  {msToTimecode(sec * 1000)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tracks */}
        <div className="relative" style={{ minWidth: `${totalWidthPx + 96}px` }}>
          {tracks.map((track) => (
            <Track key={track.id} track={track} zoom={zoom} />
          ))}

          {tracks.length === 0 && (
            <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
              メディアをインポートして開始
            </div>
          )}

          {/* Playhead overlay */}
          <div className="absolute top-0 left-24" style={{ height: `${trackHeight}px` }}>
            <Playhead
              currentTimeMs={currentTimeMs}
              zoom={zoom}
              height={trackHeight}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
