import { useState } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";
import { MediaPanel } from "./components/Media/MediaPanel";
import { TelopPanel } from "./components/Telop/TelopPanel";
import { Preview } from "./components/Preview/Preview";
import { Timeline } from "./components/Timeline/Timeline";
import { ExportDialog } from "./components/Export/ExportDialog";
import { ClipEditDialog } from "./components/Timeline/ClipEditDialog";
import { Button } from "./components/Common/Button";
import { ToastContainer } from "./components/Common/Toast";
import { useProjectStore } from "./stores/projectStore";
import { useUIStore } from "./stores/uiStore";
import { createProject } from "./lib/tauri";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

function LanguageToggle() {
  const { language, setLanguage } = useUIStore();
  return (
    <div className="flex items-center gap-0.5 ml-3">
      <button
        onClick={() => setLanguage("ja")}
        className={`px-1.5 py-0.5 text-xs rounded-l transition-colors ${
          language === "ja"
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-400 hover:bg-gray-600"
        }`}
      >
        JA
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`px-1.5 py-0.5 text-xs rounded-r transition-colors ${
          language === "en"
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-400 hover:bg-gray-600"
        }`}
      >
        EN
      </button>
    </div>
  );
}

function App() {
  const { t } = useTranslation();
  const { project, setProject } = useProjectStore();
  const [exportOpen, setExportOpen] = useState(false);
  useKeyboardShortcuts();

  const handleNewProject = async () => {
    try {
      const proj = await createProject(t("app.newProjectName"), "tiktok");
      setProject(proj);
    } catch {
      // Fallback for development without Tauri
      setProject({
        version: "1.0.0",
        metadata: {
          name: t("app.newProjectName"),
          created_at: new Date().toISOString(),
          platform: "tiktok",
        },
        canvas: { width: 1080, height: 1920, fps: 30, duration_ms: 15000 },
        tracks: [],
        beat_markers: [],
      });
    }
  };

  if (!project) {
    return (
      <main className="flex h-screen w-screen items-center justify-center bg-[#1a1a2e]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">ShortForge</h1>
          <p className="text-gray-400 mb-8">{t("app.subtitle")}</p>
          <div className="flex flex-col gap-3 items-center">
            <Button variant="primary" size="md" onClick={handleNewProject}>
              {t("app.newProject")}
            </Button>
            <LanguageToggle />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen w-screen bg-[#1a1a2e]">
      {/* Toolbar */}
      <header className="flex items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h1 className="text-sm font-bold text-white mr-4">ShortForge</h1>
        <span className="text-xs text-gray-400">{project.metadata.name}</span>
        <div className="flex-1" />
        <LanguageToggle />
        <Button
          variant="primary"
          size="sm"
          className="ml-3"
          onClick={() => setExportOpen(true)}
        >
          {t("app.export")}
        </Button>
        <span className="ml-3 text-xs text-gray-500">
          {project.metadata.platform.replace("_", " ").toUpperCase()}
        </span>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel - Media */}
        <aside className="w-64 flex-shrink-0 border-r border-gray-700 overflow-y-auto bg-gray-900">
          <MediaPanel />
        </aside>

        {/* Center - Preview */}
        <div className="flex-1 flex items-center justify-center overflow-hidden bg-[#0f0f1a]">
          <Preview />
        </div>

        {/* Right panel - Telop */}
        <aside className="w-80 flex-shrink-0 border-l border-gray-700 overflow-y-auto bg-gray-900">
          <TelopPanel />
        </aside>
      </div>

      {/* Bottom - Timeline */}
      <Timeline />

      {/* Dialogs */}
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <ClipEditDialog />
      <ToastContainer />
    </main>
  );
}

export default App;
