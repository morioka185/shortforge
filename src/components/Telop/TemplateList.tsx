import { useEffect } from "react";
import { useTelopStore } from "../../stores/telopStore";
import { getTemplates } from "../../lib/tauri";
import type { TelopTemplate } from "../../types/telop";

const CATEGORY_LABELS: Record<string, string> = {
  basic: "ベーシック",
  dynamic: "ダイナミック",
};

export function TemplateList() {
  const { templates, selectedTemplateId, setTemplates, setSelectedTemplate } =
    useTelopStore();

  useEffect(() => {
    getTemplates()
      .then(setTemplates)
      .catch(() => {
        // Fallback: load from bundled data
        setTemplates([]);
      });
  }, [setTemplates]);

  const grouped = templates.reduce(
    (acc, t) => {
      const cat = t.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
      return acc;
    },
    {} as Record<string, TelopTemplate[]>,
  );

  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        テンプレート
      </h3>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <p className="text-xs text-gray-500 mb-1">
            {CATEGORY_LABELS[category] || category}
          </p>
          <div className="flex flex-col gap-1">
            {items.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedTemplateId === tmpl.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <span className="font-medium">{tmpl.name}</span>
                <span className="block text-xs opacity-70 mt-0.5">
                  {tmpl.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
      {templates.length === 0 && (
        <p className="text-xs text-gray-500">テンプレートを読み込み中...</p>
      )}
    </div>
  );
}
