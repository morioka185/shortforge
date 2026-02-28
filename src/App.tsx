import "./App.css";
import { TelopPanel } from "./components/Telop/TelopPanel";
import { Preview } from "./components/Preview/Preview";
import { Timeline } from "./components/Timeline/Timeline";
import { Button } from "./components/Common/Button";
import { useProjectStore } from "./stores/projectStore";
import { createProject } from "./lib/tauri";

function App() {
  const { project, setProject } = useProjectStore();

  const handleNewProject = async () => {
    try {
      const proj = await createProject("新しいプロジェクト", "tiktok");
      setProject(proj);
    } catch {
      // Fallback for development without Tauri
      setProject({
        version: "1.0.0",
        metadata: {
          name: "新しいプロジェクト",
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
          <p className="text-gray-400 mb-8">ショート動画特化型エディタ</p>
          <div className="flex flex-col gap-3 items-center">
            <Button variant="primary" size="md" onClick={handleNewProject}>
              新規プロジェクト
            </Button>
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
        <span className="text-xs text-gray-500">
          {project.metadata.platform.replace("_", " ").toUpperCase()}
        </span>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel - Templates */}
        <aside className="w-72 flex-shrink-0 border-r border-gray-700 overflow-y-auto bg-gray-900">
          <TelopPanel />
        </aside>

        {/* Center - Preview */}
        <div className="flex-1 flex items-center justify-center overflow-hidden bg-[#0f0f1a]">
          <Preview />
        </div>
      </div>

      {/* Bottom - Timeline */}
      <Timeline />
    </main>
  );
}

export default App;
