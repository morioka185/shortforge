import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: true });
  });

  describe("initial state", () => {
    it("has sidebar open by default", () => {
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe("toggleSidebar", () => {
    it("closes the sidebar when open", () => {
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });

    it("opens the sidebar when closed", () => {
      useUIStore.setState({ sidebarOpen: false });
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it("toggles back and forth", () => {
      expect(useUIStore.getState().sidebarOpen).toBe(true);
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });
  });
});
