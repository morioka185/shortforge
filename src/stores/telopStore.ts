import { create } from "zustand";

interface TelopState {
  selectedTemplateId: string | null;
  setSelectedTemplate: (id: string | null) => void;
}

export const useTelopStore = create<TelopState>((set) => ({
  selectedTemplateId: null,
  setSelectedTemplate: (id) => set({ selectedTemplateId: id }),
}));
