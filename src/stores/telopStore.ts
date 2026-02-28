import { create } from "zustand";
import type { TelopTemplate, TelopStyle } from "../types/telop";

interface TelopState {
  templates: TelopTemplate[];
  selectedTemplateId: string | null;
  customStyle: Partial<TelopStyle>;
  previewText: string;
  setTemplates: (templates: TelopTemplate[]) => void;
  setSelectedTemplate: (id: string | null) => void;
  updateCustomStyle: (style: Partial<TelopStyle>) => void;
  setPreviewText: (text: string) => void;
  getSelectedTemplate: () => TelopTemplate | undefined;
}

export const useTelopStore = create<TelopState>((set, get) => ({
  templates: [],
  selectedTemplateId: null,
  customStyle: {},
  previewText: "サンプルテキスト",
  setTemplates: (templates) => set({ templates }),
  setSelectedTemplate: (id) => set({ selectedTemplateId: id }),
  updateCustomStyle: (style) =>
    set((state) => ({
      customStyle: { ...state.customStyle, ...style },
    })),
  setPreviewText: (text) => set({ previewText: text }),
  getSelectedTemplate: () => {
    const { templates, selectedTemplateId } = get();
    return templates.find((t) => t.id === selectedTemplateId);
  },
}));
