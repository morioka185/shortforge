import { useRef, useCallback, useState } from "react";
import type { TimelineClip } from "../../stores/timelineStore";
import { useTimelineStore } from "../../stores/timelineStore";

interface ClipProps {
  clip: TimelineClip;
  zoom: number;
}

type DragMode = "move" | "trim-start" | "trim-end" | null;

export function Clip({ clip, zoom }: ClipProps) {
  const { selectedClipId, selectClip, moveClip, trimClip } =
    useTimelineStore();
  const isSelected = selectedClipId === clip.id;
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const dragStartRef = useRef({ x: 0, startMs: 0, endMs: 0 });

  const left = (clip.startMs / 1000) * 100 * zoom;
  const width = ((clip.endMs - clip.startMs) / 1000) * 100 * zoom;

  const pxToMs = useCallback(
    (px: number) => (px / (100 * zoom)) * 1000,
    [zoom],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: DragMode) => {
      e.stopPropagation();
      e.preventDefault();
      selectClip(clip.id);
      setDragMode(mode);
      dragStartRef.current = {
        x: e.clientX,
        startMs: clip.startMs,
        endMs: clip.endMs,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - dragStartRef.current.x;
        const dMs = pxToMs(dx);

        if (mode === "move") {
          moveClip(clip.id, Math.max(0, dragStartRef.current.startMs + dMs));
        } else if (mode === "trim-start") {
          const newStart = Math.max(
            0,
            Math.min(
              dragStartRef.current.startMs + dMs,
              dragStartRef.current.endMs - 100,
            ),
          );
          trimClip(clip.id, newStart, dragStartRef.current.endMs);
        } else if (mode === "trim-end") {
          const newEnd = Math.max(
            dragStartRef.current.startMs + 100,
            dragStartRef.current.endMs + dMs,
          );
          trimClip(clip.id, dragStartRef.current.startMs, newEnd);
        }
      };

      const handleMouseUp = () => {
        setDragMode(null);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [clip.id, clip.startMs, clip.endMs, selectClip, moveClip, trimClip, pxToMs],
  );

  return (
    <div
      className={`absolute top-1 bottom-1 rounded flex items-stretch transition-shadow ${
        isSelected ? "ring-2 ring-white shadow-lg" : "hover:brightness-110"
      } ${dragMode ? "opacity-80" : ""}`}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 8)}px`,
        backgroundColor: clip.color,
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectClip(clip.id);
      }}
    >
      {/* Trim handle left */}
      <div
        className="w-1.5 cursor-col-resize hover:bg-white/30 rounded-l flex-shrink-0"
        onMouseDown={(e) => handleMouseDown(e, "trim-start")}
      />

      {/* Main drag area */}
      <div
        className="flex-1 cursor-grab active:cursor-grabbing overflow-hidden px-1"
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        <span className="text-[10px] text-white truncate block leading-8">
          {clip.label}
        </span>
      </div>

      {/* Trim handle right */}
      <div
        className="w-1.5 cursor-col-resize hover:bg-white/30 rounded-r flex-shrink-0"
        onMouseDown={(e) => handleMouseDown(e, "trim-end")}
      />
    </div>
  );
}
