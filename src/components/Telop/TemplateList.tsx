import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTelopStore } from "../../stores/telopStore";
import { getTemplates } from "../../lib/tauri";
import type { TelopTemplate } from "../../types/telop";

export function TemplateList() {
  const { t } = useTranslation();
  const { templates, selectedTemplateId, setTemplates, setSelectedTemplate } =
    useTelopStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const CATEGORY_LABELS: Record<string, string> = {
    basic: t("template.categoryBasic"),
    dynamic: t("template.categoryDynamic"),
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTemplates()
      .then((t) => {
        setTemplates(t);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load templates:", err);
        setError(String(err));
        setTemplates([]);
        setLoading(false);
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
        {t("template.header")}
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
      {loading && (
        <p className="text-xs text-gray-500">{t("template.loading")}</p>
      )}
      {!loading && error && (
        <p className="text-xs text-red-400">
          {t("template.loadError", { error })}
        </p>
      )}
      {!loading && !error && templates.length === 0 && (
        <p className="text-xs text-gray-500">{t("template.notFound")}</p>
      )}
    </div>
  );
}
