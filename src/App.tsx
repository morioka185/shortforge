import "./App.css";
import { TelopPanel } from "./components/Telop/TelopPanel";

function App() {
  return (
    <main className="flex h-screen w-screen bg-[#1a1a2e]">
      {/* Sidebar - Telop Panel */}
      <aside className="w-80 flex-shrink-0 border-r border-gray-700 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="px-4 py-3 border-b border-gray-700">
            <h1 className="text-lg font-bold text-white">ShortForge</h1>
            <p className="text-xs text-gray-500">
              ショート動画エディタ
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TelopPanel />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg">プレビューエリア</p>
          <p className="text-sm mt-2">動画をインポートして編集を開始</p>
        </div>
      </div>
    </main>
  );
}

export default App;
