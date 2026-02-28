interface SafeZoneProps {
  platform: "tiktok" | "youtube_shorts" | "instagram_reels";
  width: number;
  visible: boolean;
}

// Updated safe zones based on actual platform UI measurements (1080x1920 canvas)
const SAFE_ZONES: Record<string, { top: number; bottom: number; right: number }> = {
  tiktok: { top: 150, bottom: 340, right: 120 },
  youtube_shorts: { top: 140, bottom: 320, right: 96 },
  instagram_reels: { top: 200, bottom: 350, right: 100 },
};

// All positions are in 1080x1920 canvas pixels, scaled by the `s()` function.
// Sources: TikTok Ads Manager, PostPlanify, Figma community UI kits, Orson Lord safe zone guide.

function TikTokOverlay({ scale }: { scale: number }) {
  const s = (v: number) => v * scale;

  // Right sidebar: icons centered at 56px from right edge
  // Icon size: 64x64 each, vertical spacing ~128px between centers
  // Profile avatar at 680px from bottom, then Like/Comment/Bookmark/Share/Disc descending
  const rightCenter = 56;
  const iconSize = 48;

  return (
    <>
      {/* Top bar - Following / For You tabs, centered at y=110 */}
      <div
        className="absolute flex items-center justify-center gap-6"
        style={{ top: s(100), left: 0, right: 0 }}
      >
        <span style={{ fontSize: s(16), opacity: 0.5 }} className="text-white">
          Following
        </span>
        <span style={{ fontSize: s(16), fontWeight: 700 }} className="text-white">
          For You
        </span>
      </div>

      {/* Search icon top-right: top 96, right 32 */}
      <div
        className="absolute flex items-center justify-center"
        style={{ top: s(92), right: s(32) }}
      >
        <svg width={s(24)} height={s(24)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Right sidebar action buttons */}
      {/* Profile avatar: center at right 56, bottom 680, size 88x88 */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(rightCenter - 36), bottom: s(640) }}
      >
        <div
          className="rounded-full bg-white/30 border-2 border-white/60"
          style={{ width: s(72), height: s(72) }}
        />
        <div
          className="rounded-full bg-red-500 flex items-center justify-center"
          style={{ width: s(22), height: s(22), marginTop: s(-11) }}
        >
          <span style={{ fontSize: s(16), lineHeight: 1 }} className="text-white font-bold">+</span>
        </div>
      </div>

      {/* Like: center at right 56, bottom 536 */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(rightCenter - iconSize / 2), bottom: s(510) }}
      >
        <svg width={s(iconSize)} height={s(iconSize)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span style={{ fontSize: s(12) }} className="text-white mt-0.5">328.7K</span>
      </div>

      {/* Comment: center at right 56, bottom 408 */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(rightCenter - iconSize / 2), bottom: s(382) }}
      >
        <svg width={s(iconSize)} height={s(iconSize)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize: s(12) }} className="text-white mt-0.5">1,204</span>
      </div>

      {/* Bookmark: center at right 56, bottom 288 */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(rightCenter - iconSize / 2), bottom: s(262) }}
      >
        <svg width={s(iconSize)} height={s(iconSize)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize: s(12) }} className="text-white mt-0.5">18.2K</span>
      </div>

      {/* Share: center at right 56, bottom 168 */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(rightCenter - iconSize / 2), bottom: s(142) }}
      >
        <svg width={s(iconSize)} height={s(iconSize)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16,6 12,2 8,6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        <span style={{ fontSize: s(12) }} className="text-white mt-0.5">Share</span>
      </div>

      {/* Music disc: center at right 56, bottom 56, size 80x80 */}
      <div
        className="absolute rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center"
        style={{ right: s(rightCenter - 32), bottom: s(96), width: s(64), height: s(64) }}
      >
        <div className="rounded-full bg-gray-500" style={{ width: s(20), height: s(20) }} />
      </div>

      {/* Bottom - @username at left 28, bottom 168 */}
      <div
        className="absolute"
        style={{ left: s(28), bottom: s(168), right: s(160) }}
      >
        <div style={{ fontSize: s(15), fontWeight: 700 }} className="text-white">@username</div>
        <div style={{ fontSize: s(13), marginTop: s(6) }} className="text-white/80">
          Caption text here... #hashtag
        </div>
      </div>

      {/* Music ticker at left 28, bottom 112 */}
      <div
        className="absolute flex items-center gap-1"
        style={{ left: s(28), bottom: s(112) }}
      >
        <svg width={s(14)} height={s(14)} viewBox="0 0 24 24" fill="white" opacity={0.8}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <span style={{ fontSize: s(12) }} className="text-white/70">
          Original Sound - artist
        </span>
      </div>

      {/* Bottom navigation bar: height 88px */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-around bg-black/60"
        style={{ height: s(88) }}
      >
        {["Home", "Friends", "+", "Inbox", "Profile"].map((label) => (
          <span key={label} style={{ fontSize: s(11) }} className="text-white/60">
            {label === "+" ? (
              <div
                className="rounded-lg bg-white/20 flex items-center justify-center"
                style={{ width: s(56), height: s(34) }}
              >
                <span style={{ fontSize: s(22) }} className="text-white">+</span>
              </div>
            ) : label}
          </span>
        ))}
      </div>
    </>
  );
}

function YouTubeShortsOverlay({ scale }: { scale: number }) {
  const s = (v: number) => v * scale;

  // Right sidebar: icons centered at 48px from right edge
  // Icon size: 56x56, spacing ~108px vertical
  const rightCenter = 48;
  const iconSize = 42;

  return (
    <>
      {/* Top bar: "Shorts" at top 96, left 32 */}
      <div
        className="absolute flex items-center justify-between"
        style={{ top: s(96), left: s(32), right: s(32) }}
      >
        <span style={{ fontSize: s(18), fontWeight: 700 }} className="text-white">Shorts</span>
        <div className="flex items-center" style={{ gap: s(24) }}>
          <svg width={s(22)} height={s(22)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <svg width={s(22)} height={s(22)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
      </div>

      {/* Right sidebar action buttons */}
      {/* Like: center at right 48, bottom 480 */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(rightCenter - iconSize / 2), bottom: s(454) }}
      >
        <svg width={s(iconSize)} height={s(iconSize)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        <span style={{ fontSize: s(11) }} className="text-white mt-0.5">42K</span>
      </div>

      {/* Dislike: center at right 48, bottom 372 */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(rightCenter - iconSize / 2), bottom: s(346) }}
      >
        <svg width={s(iconSize)} height={s(iconSize)} viewBox="0 0 24 24" fill="white" opacity={0.9} style={{ transform: "rotate(180deg)" }}>
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        <span style={{ fontSize: s(11) }} className="text-white mt-0.5">Dislike</span>
      </div>

      {/* Comment: center at right 48, bottom 256 */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(rightCenter - iconSize / 2), bottom: s(238) }}
      >
        <svg width={s(iconSize)} height={s(iconSize)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize: s(11) }} className="text-white mt-0.5">186</span>
      </div>

      {/* Share: center at right 48, bottom 144 */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(rightCenter - iconSize / 2), bottom: s(130) }}
      >
        <svg width={s(iconSize)} height={s(iconSize)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16,6 12,2 8,6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        <span style={{ fontSize: s(11) }} className="text-white mt-0.5">Share</span>
      </div>

      {/* Sound disc: center at right 48, bottom 56, 64x64 rounded square */}
      <div
        className="absolute rounded-lg bg-gray-700 border border-gray-500 overflow-hidden"
        style={{ right: s(rightCenter - 24), bottom: s(96), width: s(48), height: s(48) }}
      />

      {/* Bottom - Channel info at left 28, bottom 160 */}
      <div
        className="absolute flex items-center"
        style={{ left: s(28), bottom: s(160), right: s(96), gap: s(10) }}
      >
        <div
          className="rounded-full bg-white/30 flex-shrink-0"
          style={{ width: s(48), height: s(48) }}
        />
        <div>
          <div style={{ fontSize: s(14), fontWeight: 600 }} className="text-white">@channel</div>
        </div>
        <div
          className="rounded-full bg-white flex items-center justify-center flex-shrink-0"
          style={{ paddingLeft: s(12), paddingRight: s(12), height: s(28) }}
        >
          <span style={{ fontSize: s(11) }} className="text-black font-semibold">Subscribe</span>
        </div>
      </div>

      {/* Description at left 28, bottom 120 */}
      <div
        className="absolute"
        style={{ left: s(28), bottom: s(120), right: s(96) }}
      >
        <span style={{ fontSize: s(12) }} className="text-white/80">Description text here</span>
      </div>

      {/* Music bar at left 28, bottom 104 */}
      <div
        className="absolute flex items-center gap-1"
        style={{ left: s(28), bottom: s(98) }}
      >
        <svg width={s(14)} height={s(14)} viewBox="0 0 24 24" fill="white" opacity={0.7}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <span style={{ fontSize: s(11) }} className="text-white/60">Music - Artist</span>
      </div>

      {/* Bottom navigation: height 84px */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-around bg-black/50"
        style={{ height: s(84) }}
      >
        {["Home", "Shorts", "+", "Subs", "You"].map((label) => (
          <span
            key={label}
            style={{ fontSize: s(10) }}
            className={label === "Shorts" ? "text-white font-bold" : "text-white/50"}
          >
            {label === "+" ? (
              <div
                className="rounded-full bg-white/20 flex items-center justify-center"
                style={{ width: s(40), height: s(40) }}
              >
                <span style={{ fontSize: s(22) }} className="text-white">+</span>
              </div>
            ) : label}
          </span>
        ))}
      </div>
    </>
  );
}

function InstagramReelsOverlay({ scale }: { scale: number }) {
  const s = (v: number) => v * scale;

  // Right sidebar: icons centered at 48px from right edge
  // Icon size: 56x56, spacing ~128px vertical
  const rightCenter = 48;
  const iconSize = 42;

  return (
    <>
      {/* Top bar: "Reels" at top 96, left 32 */}
      <div
        className="absolute flex items-center justify-between"
        style={{ top: s(96), left: s(32), right: s(32) }}
      >
        <span style={{ fontSize: s(20), fontWeight: 700 }} className="text-white">Reels</span>
        <svg width={s(22)} height={s(22)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </div>

      {/* Right sidebar action buttons */}
      {/* Like: center at right 48, bottom 560 */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(rightCenter - iconSize / 2), bottom: s(534) }}
      >
        <svg width={s(iconSize)} height={s(iconSize)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span style={{ fontSize: s(11) }} className="text-white mt-0.5">94.2K</span>
      </div>

      {/* Comment: center at right 48, bottom 432 */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(rightCenter - iconSize / 2), bottom: s(406) }}
      >
        <svg width={s(iconSize)} height={s(iconSize)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize: s(11) }} className="text-white mt-0.5">532</span>
      </div>

      {/* Send/Share: center at right 48, bottom 312 */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(rightCenter - iconSize / 2), bottom: s(286) }}
      >
        <svg width={s(iconSize)} height={s(iconSize)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22,2 15,22 11,13 2,9" />
        </svg>
      </div>

      {/* More (...): center at right 48, bottom 200 */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(rightCenter - 18), bottom: s(180) }}
      >
        <svg width={s(36)} height={s(36)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </div>

      {/* Audio cover: center at right 48, bottom 112, 64x64 rounded square */}
      <div
        className="absolute rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 border border-gray-500 overflow-hidden"
        style={{ right: s(rightCenter - 24), bottom: s(96), width: s(48), height: s(48) }}
      />

      {/* Bottom - Username row at left 28, bottom 200 */}
      <div
        className="absolute flex items-center"
        style={{ left: s(28), bottom: s(200), right: s(100), gap: s(8) }}
      >
        <div
          className="rounded-full bg-white/30 flex-shrink-0"
          style={{ width: s(44), height: s(44) }}
        />
        <span style={{ fontSize: s(14), fontWeight: 600 }} className="text-white">username</span>
        <div
          className="rounded-md border border-white/60 flex-shrink-0"
          style={{ paddingLeft: s(10), paddingRight: s(10), paddingTop: s(3), paddingBottom: s(3) }}
        >
          <span style={{ fontSize: s(11) }} className="text-white">Follow</span>
        </div>
      </div>

      {/* Caption at left 28, bottom 148 */}
      <div
        className="absolute"
        style={{ left: s(28), bottom: s(148), right: s(100) }}
      >
        <div style={{ fontSize: s(12) }} className="text-white/80">
          Caption text... more
        </div>
      </div>

      {/* Music bar at left 28, bottom 112 */}
      <div
        className="absolute flex items-center gap-1"
        style={{ left: s(28), bottom: s(112) }}
      >
        <svg width={s(14)} height={s(14)} viewBox="0 0 24 24" fill="white" opacity={0.7}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <span style={{ fontSize: s(11) }} className="text-white/60">
          Artist - Song Name
        </span>
      </div>

      {/* Bottom navigation: height 84px */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-around bg-black/50"
        style={{ height: s(84) }}
      >
        {["Home", "Search", "Reels", "Shop", "Profile"].map((label) => (
          <span
            key={label}
            style={{ fontSize: s(10) }}
            className={label === "Reels" ? "text-white font-bold" : "text-white/50"}
          >
            {label}
          </span>
        ))}
      </div>
    </>
  );
}

export function SafeZone({ platform, width, visible }: SafeZoneProps) {
  if (!visible) return null;

  const zones = SAFE_ZONES[platform] || SAFE_ZONES.tiktok;
  const scale = width / 1080;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Danger zones (semi-transparent red with dashed borders) */}
      <div
        className="absolute top-0 left-0 right-0 bg-red-500/10 border-b border-dashed border-red-500/30"
        style={{ height: `${zones.top * scale}px` }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 bg-red-500/10 border-t border-dashed border-red-500/30"
        style={{ height: `${zones.bottom * scale}px` }}
      />
      <div
        className="absolute top-0 right-0 bottom-0 bg-red-500/10 border-l border-dashed border-red-500/30"
        style={{ width: `${zones.right * scale}px` }}
      />

      {/* Platform-specific UI overlay */}
      {platform === "tiktok" && <TikTokOverlay scale={scale} />}
      {platform === "youtube_shorts" && <YouTubeShortsOverlay scale={scale} />}
      {platform === "instagram_reels" && <InstagramReelsOverlay scale={scale} />}
    </div>
  );
}
