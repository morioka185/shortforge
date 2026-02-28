import type { ExportPreset } from "../../lib/tauri";

interface PlatformPresetProps {
  preset: ExportPreset;
  selected: boolean;
  onSelect: (platform: string) => void;
}

const platformIcons: Record<string, string> = {
  tiktok: "TT",
  youtube_shorts: "YT",
  instagram_reels: "IG",
};

export function PlatformPreset({
  preset,
  selected,
  onSelect,
}: PlatformPresetProps) {
  return (
    <button
      onClick={() => onSelect(preset.platform)}
      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
        selected
          ? "border-blue-500 bg-blue-500/10"
          : "border-gray-600 bg-gray-800 hover:border-gray-500"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
          selected ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"
        }`}
      >
        {platformIcons[preset.platform] ?? "?"}
      </div>
      <span className="text-sm font-medium text-white">
        {preset.display_name}
      </span>
      <div className="text-xs text-gray-400 text-center">
        <div>
          {preset.resolution.width}x{preset.resolution.height}
        </div>
        <div>{preset.fps}fps / {preset.bitrate_kbps}kbps</div>
        <div>最大 {preset.max_duration_sec}秒</div>
      </div>
    </button>
  );
}
