import { useState, useCallback } from "react";
import { SafeZone } from "./SafeZone";
import { useProjectStore } from "../../stores/projectStore";
import { useTimelineStore } from "../../stores/timelineStore";
import { msToTimecode } from "../../lib/time";

type Platform = "tiktok" | "youtube_shorts" | "instagram_reels";

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "tiktok", label: "TikTok" },
  { id: "youtube_shorts", label: "YT Shorts" },
  { id: "instagram_reels", label: "Reels" },
];

export function Preview() {
  const project = useProjectStore((s) => s.project);
  const { currentTimeMs, isPlaying, togglePlayPause, setCurrentTime, durationMs } =
    useTimelineStore();
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [safeZonePlatform, setSafeZonePlatform] = useState<Platform>(
    (project?.metadata.platform as Platform) || "tiktok",
  );

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentTime(Number(e.target.value));
    },
    [setCurrentTime],
  );

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* Preview container */}
      <div
        className="relative bg-black rounded-lg overflow-hidden shadow-xl"
        style={{ width: "270px", height: "480px" }}
      >
        {/* Video frame placeholder */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-600">
          <div className="text-center">
            <div className="text-4xl mb-2">9:16</div>
            <div className="text-xs">{msToTimecode(currentTimeMs)}</div>
          </div>
        </div>

        {/* Safe zone overlay */}
        <SafeZone
          platform={safeZonePlatform}
          width={270}
          visible={showSafeZone}
        />
      </div>

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
          セーフゾーン表示
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
