import { create } from "zustand";
import type { ShortForgeProject, Platform } from "../types/project";

interface ProjectState {
  project: ShortForgeProject | null;
  filePath: string | null;
  isDirty: boolean;
  setProject: (project: ShortForgeProject) => void;
  setFilePath: (path: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
  updateProject: (updater: (project: ShortForgeProject) => ShortForgeProject) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  filePath: null,
  isDirty: false,
  setProject: (project) => set({ project, isDirty: false }),
  setFilePath: (path) => set({ filePath: path }),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
  updateProject: (updater) => {
    const { project } = get();
    if (project) {
      set({ project: updater(project), isDirty: true });
    }
  },
}));

export type { Platform };
