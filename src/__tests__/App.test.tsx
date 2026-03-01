import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";
import { useProjectStore } from "../stores/projectStore";

// Mock all heavy child components to test layout structure
vi.mock("../components/Media/MediaPanel", () => ({
  MediaPanel: () => <div data-testid="media-panel">MediaPanel</div>,
}));
vi.mock("../components/Telop/TelopPanel", () => ({
  TelopPanel: () => <div data-testid="telop-panel">TelopPanel</div>,
}));
vi.mock("../components/Preview/Preview", () => ({
  Preview: () => <div data-testid="preview">Preview</div>,
}));
vi.mock("../components/Timeline/Timeline", () => ({
  Timeline: () => <div data-testid="timeline">Timeline</div>,
}));
vi.mock("../components/Export/ExportDialog", () => ({
  ExportDialog: () => null,
}));
vi.mock("../components/Common/Toast", () => ({
  ToastContainer: () => null,
}));
vi.mock("../hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: () => {},
}));

describe("App", () => {
  describe("when no project is loaded", () => {
    beforeEach(() => {
      useProjectStore.setState({ project: null, filePath: null, isDirty: false });
    });

    it("shows the start screen", () => {
      render(<App />);
      expect(screen.getByText("ShortForge")).toBeInTheDocument();
      expect(screen.getByText("ショート動画特化型エディタ")).toBeInTheDocument();
      expect(screen.getByText("新規プロジェクト")).toBeInTheDocument();
    });

    it("does not render the 3-column layout", () => {
      render(<App />);
      expect(screen.queryByTestId("media-panel")).not.toBeInTheDocument();
      expect(screen.queryByTestId("preview")).not.toBeInTheDocument();
      expect(screen.queryByTestId("telop-panel")).not.toBeInTheDocument();
    });
  });

  describe("3-column layout when project is loaded", () => {
    beforeEach(() => {
      useProjectStore.setState({
        project: {
          version: "1.0.0",
          metadata: {
            name: "テストプロジェクト",
            created_at: "2026-01-01T00:00:00Z",
            platform: "tiktok",
          },
          canvas: { width: 1080, height: 1920, fps: 30, duration_ms: 15000 },
          tracks: [],
          beat_markers: [],
        },
        filePath: null,
        isDirty: false,
      });
    });

    it("renders the left MediaPanel", () => {
      render(<App />);
      expect(screen.getByTestId("media-panel")).toBeInTheDocument();
    });

    it("renders the center Preview", () => {
      render(<App />);
      expect(screen.getByTestId("preview")).toBeInTheDocument();
    });

    it("renders the right TelopPanel", () => {
      render(<App />);
      expect(screen.getByTestId("telop-panel")).toBeInTheDocument();
    });

    it("renders the bottom Timeline", () => {
      render(<App />);
      expect(screen.getByTestId("timeline")).toBeInTheDocument();
    });

    it("renders the header with project name", () => {
      render(<App />);
      expect(screen.getByText("テストプロジェクト")).toBeInTheDocument();
    });

    it("renders export button in header", () => {
      render(<App />);
      expect(screen.getByText("書き出し")).toBeInTheDocument();
    });

    it("renders platform label in header", () => {
      render(<App />);
      expect(screen.getByText("TIKTOK")).toBeInTheDocument();
    });

    it("has left panel as aside with w-64 class", () => {
      render(<App />);
      const mediaPanel = screen.getByTestId("media-panel");
      const aside = mediaPanel.parentElement;
      expect(aside?.tagName).toBe("ASIDE");
      expect(aside?.className).toContain("w-64");
    });

    it("has right panel as aside with w-80 class", () => {
      render(<App />);
      const telopPanel = screen.getByTestId("telop-panel");
      const aside = telopPanel.parentElement;
      expect(aside?.tagName).toBe("ASIDE");
      expect(aside?.className).toContain("w-80");
    });

    it("has left panel before preview, and preview before right panel in DOM order", () => {
      render(<App />);
      const media = screen.getByTestId("media-panel");
      const preview = screen.getByTestId("preview");
      const telop = screen.getByTestId("telop-panel");

      // Check DOM order using compareDocumentPosition
      const mediaBeforePreview =
        media.compareDocumentPosition(preview) &
        Node.DOCUMENT_POSITION_FOLLOWING;
      const previewBeforeTelop =
        preview.compareDocumentPosition(telop) &
        Node.DOCUMENT_POSITION_FOLLOWING;

      expect(mediaBeforePreview).toBeTruthy();
      expect(previewBeforeTelop).toBeTruthy();
    });
  });
});
