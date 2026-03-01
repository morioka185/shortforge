import { useCallback, useEffect, useState } from "react";

interface PlayheadProps {
  currentTimeMs: number;
  zoom: number;
  height: number;
  onScrub: (timeMs: number) => void;
  durationMs: number;
}

export function Playhead({
  currentTimeMs,
  zoom,
  height,
  onScrub,
  durationMs,
}: PlayheadProps) {
  const x = (currentTimeMs / 1000) * 100 * zoom;
  const [dragging, setDragging] = useState(false);

  const pxToMs = useCallback(
    (px: number) => (px / (100 * zoom)) * 1000,
    [zoom],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setDragging(true);
    },
    [],
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Find the scrollable timeline container (parent with overflow-x-auto)
      const container = document.querySelector(
        "[data-timeline-scroll]",
      ) as HTMLElement | null;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const px = e.clientX - rect.left + scrollLeft - 96; // 96px = track label width
      const ms = pxToMs(px);
      onScrub(Math.max(0, Math.min(ms, durationMs)));
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, pxToMs, onScrub, durationMs]);

  return (
    <div
      className="absolute top-0 z-30"
      style={{
        left: `${x}px`,
        height: `${height}px`,
        transform: "translateX(-50%)",
      }}
    >
      {/* Draggable head — large grab target */}
      <div
        className={`relative flex items-center justify-center cursor-grab active:cursor-grabbing ${
          dragging ? "cursor-grabbing" : ""
        }`}
        style={{ width: "20px", marginLeft: "-10px", left: "50%" }}
        onMouseDown={handleMouseDown}
      >
        {/* Triangle head */}
        <svg
          width="20"
          height="14"
          viewBox="0 0 20 14"
          className="drop-shadow-md"
        >
          <polygon
            points="0,0 20,0 10,14"
            fill="#ef4444"
            stroke="#b91c1c"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Vertical line */}
      <div
        className="absolute bg-red-500 pointer-events-none"
        style={{
          width: "2px",
          left: "calc(50% - 1px)",
          top: "14px",
          height: `${Math.max(0, height - 14)}px`,
        }}
      />
    </div>
  );
}
