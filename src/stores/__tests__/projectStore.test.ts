import { describe, it, expect, beforeEach } from "vitest";
import { useProjectStore } from "../projectStore";
import type { ShortForgeProject } from "../../types/project";

const createMockProject = (
  overrides?: Partial<ShortForgeProject>,
): ShortForgeProject => ({
  version: "0.1.0",
  metadata: {
    name: "Test Project",
    created_at: "2026-01-01T00:00:00Z",
    platform: "tiktok",
  },
  canvas: {
    width: 1080,
    height: 1920,
    fps: 30,
    duration_ms: 15000,
  },
  tracks: [],
  beat_markers: [],
  ...overrides,
});

describe("projectStore", () => {
  beforeEach(() => {
    useProjectStore.setState({
      project: null,
      filePath: null,
      isDirty: false,
    });
  });

  describe("initial state", () => {
    it("starts with null project", () => {
      expect(useProjectStore.getState().project).toBeNull();
    });

    it("starts with null filePath", () => {
      expect(useProjectStore.getState().filePath).toBeNull();
    });

    it("starts as not dirty", () => {
      expect(useProjectStore.getState().isDirty).toBe(false);
    });
  });

  describe("setProject", () => {
    it("sets the project", () => {
      const project = createMockProject();
      useProjectStore.getState().setProject(project);
      expect(useProjectStore.getState().project).toEqual(project);
    });

    it("resets isDirty to false when setting project", () => {
      useProjectStore.setState({ isDirty: true });
      useProjectStore.getState().setProject(createMockProject());
      expect(useProjectStore.getState().isDirty).toBe(false);
    });
  });

  describe("setFilePath", () => {
    it("sets the file path", () => {
      useProjectStore.getState().setFilePath("/path/to/project.json");
      expect(useProjectStore.getState().filePath).toBe("/path/to/project.json");
    });

    it("can set file path to null", () => {
      useProjectStore.getState().setFilePath("/some/path");
      useProjectStore.getState().setFilePath(null);
      expect(useProjectStore.getState().filePath).toBeNull();
    });
  });

  describe("markDirty / markClean", () => {
    it("marks project as dirty", () => {
      useProjectStore.getState().markDirty();
      expect(useProjectStore.getState().isDirty).toBe(true);
    });

    it("marks project as clean", () => {
      useProjectStore.getState().markDirty();
      useProjectStore.getState().markClean();
      expect(useProjectStore.getState().isDirty).toBe(false);
    });
  });

  describe("updateProject", () => {
    it("updates the project using an updater function", () => {
      const project = createMockProject({ version: "0.1.0" });
      useProjectStore.getState().setProject(project);

      useProjectStore.getState().updateProject((p) => ({
        ...p,
        metadata: { ...p.metadata, name: "Updated Name" },
      }));

      expect(useProjectStore.getState().project?.metadata.name).toBe(
        "Updated Name",
      );
    });

    it("marks project as dirty after update", () => {
      useProjectStore.getState().setProject(createMockProject());
      expect(useProjectStore.getState().isDirty).toBe(false);

      useProjectStore.getState().updateProject((p) => ({ ...p }));
      expect(useProjectStore.getState().isDirty).toBe(true);
    });

    it("does nothing when project is null", () => {
      useProjectStore.getState().updateProject((p) => ({
        ...p,
        metadata: { ...p.metadata, name: "Should Not Happen" },
      }));

      expect(useProjectStore.getState().project).toBeNull();
      expect(useProjectStore.getState().isDirty).toBe(false);
    });

    it("can update canvas duration", () => {
      useProjectStore.getState().setProject(createMockProject());
      useProjectStore.getState().updateProject((p) => ({
        ...p,
        canvas: { ...p.canvas, duration_ms: 30000 },
      }));
      expect(useProjectStore.getState().project?.canvas.duration_ms).toBe(30000);
    });
  });
});
