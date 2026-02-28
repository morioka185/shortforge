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

function TikTokOverlay({ scale }: { scale: number }) {
  const s = (v: number) => v * scale;

  return (
    <>
      {/* Top bar - Following / For You tabs */}
      <div
        className="absolute flex items-center justify-center gap-4"
        style={{ top: s(52), left: 0, right: 0 }}
      >
        <span style={{ fontSize: s(14), opacity: 0.5 }} className="text-white">
          Following
        </span>
        <span style={{ fontSize: s(14), fontWeight: 700 }} className="text-white">
          For You
        </span>
      </div>

      {/* Search icon top-right */}
      <div
        className="absolute flex items-center justify-center"
        style={{ top: s(48), right: s(16), width: s(28), height: s(28) }}
      >
        <svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Right sidebar - Action buttons */}
      {/* Profile */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(12), bottom: s(340) }}
      >
        <div
          className="rounded-full bg-white/30 border-2 border-white/60"
          style={{ width: s(44), height: s(44) }}
        />
        <div
          className="rounded-full bg-red-500 flex items-center justify-center"
          style={{ width: s(18), height: s(18), marginTop: s(-9) }}
        >
          <span style={{ fontSize: s(14), lineHeight: 1 }} className="text-white font-bold">+</span>
        </div>
      </div>

      {/* Like */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(14), bottom: s(268) }}
      >
        <svg width={s(32)} height={s(32)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span style={{ fontSize: s(11) }} className="text-white mt-0.5">328.7K</span>
      </div>

      {/* Comment */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(14), bottom: s(204) }}
      >
        <svg width={s(32)} height={s(32)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize: s(11) }} className="text-white mt-0.5">1,204</span>
      </div>

      {/* Bookmark */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(14), bottom: s(144) }}
      >
        <svg width={s(32)} height={s(32)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize: s(11) }} className="text-white mt-0.5">18.2K</span>
      </div>

      {/* Share */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(14), bottom: s(84) }}
      >
        <svg width={s(32)} height={s(32)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16,6 12,2 8,6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        <span style={{ fontSize: s(11) }} className="text-white mt-0.5">Share</span>
      </div>

      {/* Spinning disc */}
      <div
        className="absolute rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center"
        style={{ right: s(16), bottom: s(28), width: s(40), height: s(40) }}
      >
        <div
          className="rounded-full bg-gray-500"
          style={{ width: s(14), height: s(14) }}
        />
      </div>

      {/* Bottom - Username & caption */}
      <div
        className="absolute"
        style={{ left: s(14), bottom: s(84), right: s(80) }}
      >
        <div style={{ fontSize: s(14), fontWeight: 700 }} className="text-white">@username</div>
        <div style={{ fontSize: s(12), marginTop: s(4) }} className="text-white/80">
          Caption text here... #hashtag
        </div>
      </div>

      {/* Music ticker */}
      <div
        className="absolute flex items-center gap-1"
        style={{ left: s(14), bottom: s(56) }}
      >
        <svg width={s(12)} height={s(12)} viewBox="0 0 24 24" fill="white" opacity={0.8}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <span style={{ fontSize: s(11) }} className="text-white/70">
          Original Sound - artist
        </span>
      </div>

      {/* Bottom navigation bar */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-around bg-black/60"
        style={{ height: s(44) }}
      >
        {["Home", "+", "Inbox", "Profile"].map((label) => (
          <span key={label} style={{ fontSize: s(9) }} className="text-white/60">
            {label === "+" ? (
              <div
                className="rounded-md bg-white/20 flex items-center justify-center"
                style={{ width: s(36), height: s(22) }}
              >
                <span style={{ fontSize: s(16) }} className="text-white">+</span>
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

  return (
    <>
      {/* Top bar - search & camera */}
      <div
        className="absolute flex items-center justify-between"
        style={{ top: s(48), left: s(16), right: s(16) }}
      >
        <span style={{ fontSize: s(16), fontWeight: 700 }} className="text-white">Shorts</span>
        <div className="flex items-center gap-3">
          <svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
      </div>

      {/* Right sidebar */}
      {/* Like */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(12), bottom: s(240) }}
      >
        <svg width={s(28)} height={s(28)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        <span style={{ fontSize: s(10) }} className="text-white mt-0.5">42K</span>
      </div>

      {/* Dislike */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(12), bottom: s(186) }}
      >
        <svg width={s(28)} height={s(28)} viewBox="0 0 24 24" fill="white" opacity={0.9} style={{ transform: "rotate(180deg)" }}>
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        <span style={{ fontSize: s(10) }} className="text-white mt-0.5">Dislike</span>
      </div>

      {/* Comment */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(12), bottom: s(128) }}
      >
        <svg width={s(28)} height={s(28)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize: s(10) }} className="text-white mt-0.5">186</span>
      </div>

      {/* Share */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(12), bottom: s(72) }}
      >
        <svg width={s(28)} height={s(28)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16,6 12,2 8,6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        <span style={{ fontSize: s(10) }} className="text-white mt-0.5">Share</span>
      </div>

      {/* Bottom - Channel info */}
      <div
        className="absolute flex items-center gap-2"
        style={{ left: s(14), bottom: s(80), right: s(60) }}
      >
        <div
          className="rounded-full bg-white/30 flex-shrink-0"
          style={{ width: s(32), height: s(32) }}
        />
        <div>
          <div style={{ fontSize: s(13), fontWeight: 600 }} className="text-white">@channel</div>
          <div style={{ fontSize: s(11), marginTop: s(2) }} className="text-white/70">Description text</div>
        </div>
      </div>

      {/* Music bar */}
      <div
        className="absolute flex items-center gap-1"
        style={{ left: s(14), bottom: s(52) }}
      >
        <svg width={s(12)} height={s(12)} viewBox="0 0 24 24" fill="white" opacity={0.7}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <span style={{ fontSize: s(10) }} className="text-white/60">Music - Artist</span>
      </div>

      {/* Bottom navigation */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-around bg-black/50"
        style={{ height: s(42) }}
      >
        {["Home", "Shorts", "+", "Subs", "You"].map((label) => (
          <span
            key={label}
            style={{ fontSize: s(9) }}
            className={label === "Shorts" ? "text-white font-bold" : "text-white/50"}
          >
            {label === "+" ? (
              <div
                className="rounded-full bg-white/20 flex items-center justify-center"
                style={{ width: s(28), height: s(28) }}
              >
                <span style={{ fontSize: s(18) }} className="text-white">+</span>
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

  return (
    <>
      {/* Top bar - Reels header */}
      <div
        className="absolute flex items-center justify-between"
        style={{ top: s(48), left: s(16), right: s(16) }}
      >
        <span style={{ fontSize: s(18), fontWeight: 700 }} className="text-white">Reels</span>
        <svg width={s(22)} height={s(22)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </div>

      {/* Right sidebar */}
      {/* Like (heart) */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(12), bottom: s(280) }}
      >
        <svg width={s(28)} height={s(28)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span style={{ fontSize: s(10) }} className="text-white mt-0.5">94.2K</span>
      </div>

      {/* Comment */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(12), bottom: s(216) }}
      >
        <svg width={s(28)} height={s(28)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize: s(10) }} className="text-white mt-0.5">532</span>
      </div>

      {/* Send / Share (paper plane) */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(12), bottom: s(156) }}
      >
        <svg width={s(28)} height={s(28)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22,2 15,22 11,13 2,9" />
        </svg>
      </div>

      {/* More (...) */}
      <div
        className="absolute flex flex-col items-center"
        style={{ right: s(14), bottom: s(100) }}
      >
        <svg width={s(24)} height={s(24)} viewBox="0 0 24 24" fill="white" opacity={0.9}>
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </div>

      {/* Audio disc */}
      <div
        className="absolute rounded-md bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 overflow-hidden"
        style={{ right: s(14), bottom: s(56), width: s(32), height: s(32) }}
      >
        <div
          className="absolute inset-0 rounded-md bg-white/10"
        />
      </div>

      {/* Bottom - Username & caption */}
      <div
        className="absolute"
        style={{ left: s(14), bottom: s(100), right: s(60) }}
      >
        <div className="flex items-center gap-2">
          <div
            className="rounded-full bg-white/30 flex-shrink-0"
            style={{ width: s(28), height: s(28) }}
          />
          <span style={{ fontSize: s(13), fontWeight: 600 }} className="text-white">username</span>
          <div
            className="rounded-md border border-white/60 px-1"
            style={{ paddingTop: s(1), paddingBottom: s(1) }}
          >
            <span style={{ fontSize: s(10) }} className="text-white">Follow</span>
          </div>
        </div>
        <div style={{ fontSize: s(11), marginTop: s(6) }} className="text-white/80">
          Caption text... more
        </div>
      </div>

      {/* Music bar */}
      <div
        className="absolute flex items-center gap-1"
        style={{ left: s(14), bottom: s(68) }}
      >
        <svg width={s(12)} height={s(12)} viewBox="0 0 24 24" fill="white" opacity={0.7}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <span style={{ fontSize: s(10) }} className="text-white/60">
          Artist - Song Name
        </span>
      </div>

      {/* Bottom navigation */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-around bg-black/50"
        style={{ height: s(42) }}
      >
        {["Home", "Search", "Reels", "Shop", "Profile"].map((label) => (
          <span
            key={label}
            style={{ fontSize: s(9) }}
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
      {/* Danger zones (semi-transparent red) */}
      {/* Top zone */}
      <div
        className="absolute top-0 left-0 right-0 bg-red-500/10 border-b border-dashed border-red-500/30"
        style={{ height: `${zones.top * scale}px` }}
      />
      {/* Bottom zone */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-red-500/10 border-t border-dashed border-red-500/30"
        style={{ height: `${zones.bottom * scale}px` }}
      />
      {/* Right zone */}
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
