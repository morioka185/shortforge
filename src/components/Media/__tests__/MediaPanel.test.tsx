import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MediaPanel } from "../MediaPanel";
import { useMediaStore } from "../../../stores/mediaStore";
import { useTimelineStore } from "../../../stores/timelineStore";

// Mock tauri.ts module
vi.mock("../../../lib/tauri", () => ({
  probeMedia: vi.fn(),
}));

// open is already mocked globally in setup.ts

describe("MediaPanel", () => {
  beforeEach(() => {
    useMediaStore.setState({ importedMedia: [] });
    useTimelineStore.setState({ tracks: [] });
  });

  describe("initial render", () => {
    it("renders the header", () => {
      render(<MediaPanel />);
      expect(screen.getByText("メディア")).toBeInTheDocument();
    });

    it("renders the add button", () => {
      render(<MediaPanel />);
      expect(screen.getByText("素材を追加")).toBeInTheDocument();
    });

    it("shows empty state message when no media imported", () => {
      render(<MediaPanel />);
      expect(screen.getByText(/動画・画像・音声ファイルを/)).toBeInTheDocument();
    });
  });

  describe("with imported media", () => {
    beforeEach(() => {
      useMediaStore.setState({
        importedMedia: [
          {
            id: "media-1",
            path: "/path/to/video.mp4",
            filename: "video.mp4",
            type: "video",
            durationMs: 10000,
            width: 1920,
            height: 1080,
          },
          {
            id: "media-2",
            path: "/path/to/photo.png",
            filename: "photo.png",
            type: "image",
            durationMs: 5000,
            width: 800,
            height: 600,
          },
          {
            id: "media-3",
            path: "/path/to/bgm.mp3",
            filename: "bgm.mp3",
            type: "audio",
            durationMs: 180000,
          },
        ],
      });
    });

    it("does not show empty state message", () => {
      render(<MediaPanel />);
      expect(
        screen.queryByText(/動画・画像・音声ファイルを/),
      ).not.toBeInTheDocument();
    });

    it("displays each imported media filename", () => {
      render(<MediaPanel />);
      expect(screen.getByText("video.mp4")).toBeInTheDocument();
      expect(screen.getByText("photo.png")).toBeInTheDocument();
      expect(screen.getByText("bgm.mp3")).toBeInTheDocument();
    });

    it("displays type labels for each media", () => {
      render(<MediaPanel />);
      expect(screen.getByText("動画")).toBeInTheDocument();
      expect(screen.getByText("画像")).toBeInTheDocument();
      expect(screen.getByText("音声")).toBeInTheDocument();
    });

    it("displays type indicator letters (V, I, A)", () => {
      render(<MediaPanel />);
      expect(screen.getByText("V")).toBeInTheDocument();
      expect(screen.getByText("I")).toBeInTheDocument();
      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("displays formatted duration for video (0:10)", () => {
      render(<MediaPanel />);
      expect(screen.getByText("0:10")).toBeInTheDocument();
    });

    it("displays formatted duration for audio (3:00)", () => {
      render(<MediaPanel />);
      expect(screen.getByText("3:00")).toBeInTheDocument();
    });

    it("removes media from store when remove button clicked", async () => {
      const user = userEvent.setup();
      render(<MediaPanel />);

      const removeButtons = screen.getAllByTitle("削除");
      expect(removeButtons).toHaveLength(3);

      await user.click(removeButtons[0]);

      expect(useMediaStore.getState().importedMedia).toHaveLength(2);
      expect(
        useMediaStore.getState().importedMedia.find((m) => m.id === "media-1"),
      ).toBeUndefined();
    });
  });

  describe("add media button", () => {
    it("button is enabled by default", () => {
      render(<MediaPanel />);
      const btn = screen.getByText("素材を追加");
      expect(btn).not.toBeDisabled();
    });
  });
});
