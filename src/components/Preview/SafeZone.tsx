interface SafeZoneProps {
  platform: "tiktok" | "youtube_shorts" | "instagram_reels";
  width: number;
  visible: boolean;
}

const SAFE_ZONES: Record<string, { top: number; bottom: number; right: number }> = {
  tiktok: { top: 120, bottom: 280, right: 80 },
  youtube_shorts: { top: 100, bottom: 200, right: 60 },
  instagram_reels: { top: 110, bottom: 260, right: 70 },
};

export function SafeZone({ platform, width, visible }: SafeZoneProps) {
  if (!visible) return null;

  const zones = SAFE_ZONES[platform] || SAFE_ZONES.tiktok;
  const scale = width / 1080;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top zone */}
      <div
        className="absolute top-0 left-0 right-0 bg-red-500/20 border-b border-red-500/50"
        style={{ height: `${zones.top * scale}px` }}
      />
      {/* Bottom zone */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-red-500/20 border-t border-red-500/50"
        style={{ height: `${zones.bottom * scale}px` }}
      />
      {/* Right zone */}
      <div
        className="absolute top-0 right-0 bottom-0 bg-red-500/20 border-l border-red-500/50"
        style={{ width: `${zones.right * scale}px` }}
      />
    </div>
  );
}
