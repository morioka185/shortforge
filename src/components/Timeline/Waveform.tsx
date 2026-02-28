import { useRef, useEffect } from "react";

interface WaveformProps {
  data: number[];
  width: number;
  height: number;
  color?: string;
}

export function Waveform({
  data,
  width,
  height,
  color = "#4ade80",
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Normalize waveform data
    const maxVal = Math.max(...data, 0.001);
    const barWidth = width / data.length;
    const centerY = height / 2;

    ctx.fillStyle = color;

    for (let i = 0; i < data.length; i++) {
      const normalized = data[i] / maxVal;
      const barHeight = normalized * centerY * 0.9;
      const x = i * barWidth;

      // Draw mirrored waveform
      ctx.fillRect(x, centerY - barHeight, Math.max(barWidth - 0.5, 0.5), barHeight * 2);
    }
  }, [data, width, height, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="pointer-events-none"
    />
  );
}
