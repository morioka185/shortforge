interface PlayheadProps {
  currentTimeMs: number;
  zoom: number;
  height: number;
}

export function Playhead({ currentTimeMs, zoom, height }: PlayheadProps) {
  const x = (currentTimeMs / 1000) * 100 * zoom;

  return (
    <div
      className="absolute top-0 z-20 pointer-events-none"
      style={{ left: `${x}px`, height: `${height}px` }}
    >
      {/* Playhead triangle */}
      <div className="relative -left-1.5">
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "8px solid #ef4444",
          }}
        />
      </div>
      {/* Playhead line */}
      <div className="absolute left-0 top-0 w-0.5 bg-red-500" style={{ height: `${height}px` }} />
    </div>
  );
}
