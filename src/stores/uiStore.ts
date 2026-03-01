import { create } from "zustand";
import i18next from "i18next";

type Language = "ja" | "en";

interface UIState {
  sidebarOpen: boolean;
  language: Language;
  toggleSidebar: () => void;
  setLanguage: (lang: Language) => void;
}

const savedLanguage =
  (localStorage.getItem("shortforge-language") as Language) || "ja";

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  language: savedLanguage,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setLanguage: (lang) => {
    localStorage.setItem("shortforge-language", lang);
    i18next.changeLanguage(lang);
    set({ language: lang });
  },
}));
