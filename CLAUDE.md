# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShortForge is a desktop short-form vertical video editor (9:16) for TikTok, YouTube Shorts, and Instagram Reels. Built with **Tauri v2** (React 19 frontend + Rust backend).

## Build & Development Commands

```bash
# Development (launches Vite dev server + Tauri window with hot reload)
pnpm install
pnpm tauri dev

# Frontend only (Vite dev server on port 1420)
pnpm dev

# Production build (creates .app/.deb/.rpm bundles)
pnpm tauri build

# Linting & formatting
pnpm lint                           # ESLint on src/
pnpm lint:fix                       # Auto-fix ESLint issues
pnpm format                         # Prettier on src/
cd src-tauri && cargo fmt            # Rust formatting
cd src-tauri && cargo clippy         # Rust linting (CI uses -D warnings)

# Testing
cd src-tauri && cargo test           # Rust tests
npx tsc --noEmit                     # TypeScript type-check
```

## System Dependencies

- **macOS:** `brew install ffmpeg aubio pkg-config`
- **Linux:** `libwebkit2gtk-4.1-dev libavcodec-dev libavformat-dev libavutil-dev libswscale-dev libswresample-dev libavfilter-dev libaubio-dev pkg-config`

## Architecture

### Frontend (`src/`) — React 19 + TypeScript + Tailwind CSS 4 + Zustand 5

- **`components/`** — Organized by feature: `Timeline/`, `Preview/`, `Telop/`, `Export/`, `Common/`
- **`stores/`** — Zustand stores: `projectStore`, `timelineStore`, `telopStore`, `uiStore`. Timeline store uses `zundo` for undo/redo.
- **`hooks/`** — Custom hooks including `useTauriCommand` (IPC wrapper), `useKeyboardShortcuts`
- **`lib/tauri.ts`** — TypeScript wrappers for all Tauri IPC commands
- **`types/`** — Shared type definitions (`project.ts`, `timeline.ts`, `telop.ts`)

### Backend (`src-tauri/src/`) — Rust

- **`commands/`** — Tauri IPC handlers: `telop.rs`, `project.rs`, `preview.rs`, `export.rs`, `beat_sync.rs`
- **`models/`** — Data structures (mirrors TypeScript types): `project.rs`, `timeline.rs`, `telop.rs`
- **`video_core/`** — FFmpeg-based video decoding/encoding with frame caching
- **`telop_engine/`** — SRT/ASS parsing, template loading, keyframe animation, skia-safe rendering
- **`export_engine/`** — Platform presets (TikTok/Shorts/Reels), validation, final video rendering
- **`beat_sync/`** — aubio-based BPM detection and waveform analysis
- **`errors.rs`** — `ShortForgeError` via `thiserror`

All IPC commands are registered in `lib.rs` via `tauri::generate_handler!`.

### Key Design Decisions

- **Two-layer telop rendering:** Frontend uses CSS/Canvas for fast interactive preview; backend uses skia-safe for frame-accurate export rendering
- **JSON templates:** Telop animation templates in `templates/` directory — declarative keyframes + easing, loaded at runtime by Rust
- **Platform presets:** JSON files with resolution, safe zones, codec, bitrate, and duration limits per platform

### Modifying IPC Commands

When adding or changing a Tauri command, update three places:
1. Rust handler in `src-tauri/src/commands/`
2. Register in `src-tauri/src/lib.rs` invoke_handler
3. TypeScript wrapper in `src/lib/tauri.ts`

## Code Style

- **TypeScript:** Double quotes, semicolons, 2-space indent, trailing commas (Prettier). Strict mode enabled.
- **Rust:** Edition 2021, `cargo fmt` + `cargo clippy`. Error handling via `thiserror`.
- **Commits:** English, conventional commit style recommended. Feature branches: `feature/description`.

## Project File Format

`.sfproj` files are JSON containing: version, metadata (name, platform), canvas (1080x1920, 30fps), tracks with clips, and beat markers.
