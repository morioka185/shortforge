import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TelopPanel } from "../TelopPanel";
import { useTimelineStore } from "../../../stores/timelineStore";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

// Mock heavy child components to isolate TelopPanel logic
vi.mock("../TemplateList", () => ({
  TemplateList: () => <div data-testid="template-list">TemplateList</div>,
}));
vi.mock("../StyleEditor", () => ({
  StyleEditor: () => <div data-testid="style-editor">StyleEditor</div>,
}));
vi.mock("../AnimationPreview", () => ({
  AnimationPreview: () => (
    <div data-testid="animation-preview">AnimationPreview</div>
  ),
}));

describe("TelopPanel", () => {
  beforeEach(() => {
    useTimelineStore.setState({
      tracks: [],
      currentTimeMs: 0,
    });
    vi.clearAllMocks();
  });

  describe("structure", () => {
    it("renders SRT import section", () => {
      render(<TelopPanel />);
      expect(screen.getByText("SRTインポート")).toBeInTheDocument();
    });

    it("renders manual telop add section", () => {
      render(<TelopPanel />);
      expect(screen.getByText("テロップ追加")).toBeInTheDocument();
    });

    it("renders SRT import button", () => {
      render(<TelopPanel />);
      expect(
        screen.getByText("SRTファイルを読み込み"),
      ).toBeInTheDocument();
    });

    it("renders existing sub-components", () => {
      render(<TelopPanel />);
      expect(screen.getByTestId("template-list")).toBeInTheDocument();
      expect(screen.getByTestId("style-editor")).toBeInTheDocument();
      expect(screen.getByTestId("animation-preview")).toBeInTheDocument();
    });
  });

  describe("SRT import", () => {
    it("calls open dialog with srt filter when clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(open).mockResolvedValue(null);

      render(<TelopPanel />);
      await user.click(screen.getByText("SRTファイルを読み込み"));

      expect(open).toHaveBeenCalledWith({
        multiple: false,
        filters: [{ name: "SRT字幕", extensions: ["srt"] }],
      });
    });

    it("adds telop track to timeline after successful SRT parse", async () => {
      const user = userEvent.setup();
      vi.mocked(open).mockResolvedValue("/path/to/subtitle.srt");
      vi.mocked(invoke).mockResolvedValue([
        { index: 1, start_ms: 1000, end_ms: 4000, text: "こんにちは" },
        { index: 2, start_ms: 5000, end_ms: 8000, text: "世界" },
      ]);

      render(<TelopPanel />);
      await user.click(screen.getByText("SRTファイルを読み込み"));

      // Wait for async operations
      await screen.findByText("2件のテロップを追加しました");

      const tracks = useTimelineStore.getState().tracks;
      expect(tracks).toHaveLength(1);
      expect(tracks[0].type).toBe("telop");
      expect(tracks[0].label).toBe("テロップ (SRT)");
      expect(tracks[0].clips).toHaveLength(2);
      expect(tracks[0].clips[0].label).toBe("こんにちは");
      expect(tracks[0].clips[0].startMs).toBe(1000);
      expect(tracks[0].clips[0].endMs).toBe(4000);
      expect(tracks[0].clips[1].label).toBe("世界");
      expect(tracks[0].clips[1].startMs).toBe(5000);
      expect(tracks[0].clips[1].endMs).toBe(8000);
    });

    it("shows 0 count message when SRT file is empty", async () => {
      const user = userEvent.setup();
      vi.mocked(open).mockResolvedValue("/path/to/empty.srt");
      vi.mocked(invoke).mockResolvedValue([]);

      render(<TelopPanel />);
      await user.click(screen.getByText("SRTファイルを読み込み"));

      await screen.findByText("0件のテロップを追加しました");
      expect(useTimelineStore.getState().tracks).toHaveLength(0);
    });

    it("does nothing when dialog is cancelled", async () => {
      const user = userEvent.setup();
      vi.mocked(open).mockResolvedValue(null);

      render(<TelopPanel />);
      await user.click(screen.getByText("SRTファイルを読み込み"));

      expect(invoke).not.toHaveBeenCalled();
      expect(useTimelineStore.getState().tracks).toHaveLength(0);
    });
  });

  describe("manual telop add", () => {
    it("renders text input", () => {
      render(<TelopPanel />);
      expect(
        screen.getByPlaceholderText("テキストを入力..."),
      ).toBeInTheDocument();
    });

    it("renders start/end time labels", () => {
      render(<TelopPanel />);
      expect(screen.getByText("開始")).toBeInTheDocument();
      expect(screen.getByText("終了")).toBeInTheDocument();
    });

    it("renders add and current-position buttons", () => {
      render(<TelopPanel />);
      expect(screen.getByText("追加")).toBeInTheDocument();
      expect(screen.getByText("現在位置から")).toBeInTheDocument();
    });

    it("add button is disabled when text is empty", () => {
      render(<TelopPanel />);
      const addBtn = screen.getByText("追加");
      expect(addBtn).toBeDisabled();
    });

    it("add button is enabled when text is entered", async () => {
      const user = userEvent.setup();
      render(<TelopPanel />);

      await user.type(
        screen.getByPlaceholderText("テキストを入力..."),
        "テスト",
      );
      expect(screen.getByText("追加")).not.toBeDisabled();
    });

    it("adds telop track to timeline on add click", async () => {
      const user = userEvent.setup();
      render(<TelopPanel />);

      await user.type(
        screen.getByPlaceholderText("テキストを入力..."),
        "テストテロップ",
      );
      await user.click(screen.getByText("追加"));

      const tracks = useTimelineStore.getState().tracks;
      expect(tracks).toHaveLength(1);
      expect(tracks[0].type).toBe("telop");
      expect(tracks[0].clips).toHaveLength(1);
      expect(tracks[0].clips[0].label).toBe("テストテロップ");
      expect(tracks[0].clips[0].startMs).toBe(0);
      expect(tracks[0].clips[0].endMs).toBe(3000);
      expect(tracks[0].clips[0].color).toBe("#f59e0b");
    });

    it("clears text input after adding", async () => {
      const user = userEvent.setup();
      render(<TelopPanel />);

      const input = screen.getByPlaceholderText("テキストを入力...");
      await user.type(input, "テスト");
      await user.click(screen.getByText("追加"));

      expect(input).toHaveValue("");
    });

    it("does not add when text is whitespace only", async () => {
      const user = userEvent.setup();
      render(<TelopPanel />);

      await user.type(
        screen.getByPlaceholderText("テキストを入力..."),
        "   ",
      );
      await user.click(screen.getByText("追加"));

      expect(useTimelineStore.getState().tracks).toHaveLength(0);
    });

    it("shows default start/end time", () => {
      render(<TelopPanel />);
      // Default: start=0 (00:00.000), end=3000 (00:03.000)
      const inputs = screen.getAllByRole("textbox");
      // textarea + 2 time inputs = 3 textbox roles
      const timeInputs = inputs.filter(
        (i) => i.tagName.toLowerCase() === "input",
      );
      expect(timeInputs[0]).toHaveValue("00:00.000");
      expect(timeInputs[1]).toHaveValue("00:03.000");
    });

    it("updates start/end time from current position", async () => {
      const user = userEvent.setup();
      useTimelineStore.setState({ currentTimeMs: 5000 });

      render(<TelopPanel />);
      await user.click(screen.getByText("現在位置から"));

      const inputs = screen
        .getAllByRole("textbox")
        .filter((i) => i.tagName.toLowerCase() === "input");
      expect(inputs[0]).toHaveValue("00:05.000");
      expect(inputs[1]).toHaveValue("00:08.000");
    });
  });
});
