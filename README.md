# ShortForge

ショート動画制作に特化したオープンソースのデスクトップエディタ。
TikTok / YouTube Shorts / Instagram Reels 向けの縦型動画を効率的に作成できます。

An open-source desktop editor specialized for short-form vertical video creation,
optimized for TikTok, YouTube Shorts, and Instagram Reels.

## Features

- **Telop Engine** — Per-character animated text overlays with 5 built-in templates (typewriter, bounce, fade, pop, burst)
- **Multi-Platform Export** — One-click export with platform-specific presets for TikTok, YouTube Shorts, and Instagram Reels
- **Beat Detection** — Automatic BPM detection and beat markers with snap-to-beat clip alignment
- **Timeline Editor** — Multi-track timeline with drag-and-drop, trimming, and zoom
- **9:16 Preview** — Real-time preview with safe zone overlay for each platform
- **SRT Import** — Import subtitle files and auto-place telop clips on the timeline
- **Waveform Display** — Audio waveform visualization on the timeline

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Zustand
- **Backend:** Rust, Tauri v2
- **Video:** FFmpeg (via ffmpeg-next), skia-safe for rendering
- **Audio:** aubio for beat detection

## Prerequisites

- [Rust](https://rustup.rs/) (1.75+)
- [Node.js](https://nodejs.org/) (20+)
- [pnpm](https://pnpm.io/)
- [FFmpeg](https://ffmpeg.org/) (8.x)
- [aubio](https://github.com/aubio/aubio) (`brew install aubio` on macOS)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/shortforge.git
cd shortforge

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

## Project Structure

```
shortforge/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── Timeline/       # Timeline, Track, Clip, Playhead, Waveform, BeatMarkers
│   │   ├── Preview/        # Video preview with safe zones
│   │   ├── Telop/          # Telop templates and style editor
│   │   ├── Export/         # Export dialog and platform presets
│   │   └── Common/         # Button, Toast
│   ├── stores/             # Zustand state management
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and Tauri IPC wrappers
│   └── types/              # TypeScript type definitions
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri IPC command handlers
│   │   ├── models/         # Data models (project, telop, timeline)
│   │   ├── video_core/     # FFmpeg decoder/encoder, frame cache
│   │   ├── telop_engine/   # SRT parser, animation engine, skia renderer
│   │   ├── export_engine/  # Platform presets, validation, export pipeline
│   │   └── beat_sync/      # Beat detection and snap logic
│   └── resources/
│       └── presets/        # Platform export preset JSON files
└── templates/              # Telop animation template JSON files
```

## License

[MIT](LICENSE)
