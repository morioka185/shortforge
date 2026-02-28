import { useTelopStore } from "../../stores/telopStore";

export function StyleEditor() {
  const { customStyle, updateCustomStyle, getSelectedTemplate } =
    useTelopStore();
  const template = getSelectedTemplate();

  if (!template) {
    return (
      <div className="p-3 text-gray-500 text-sm">
        テンプレートを選択してください
      </div>
    );
  }

  const style = { ...template.default_style, ...customStyle };

  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        スタイル編集
      </h3>

      {/* Font Size */}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-400">
          フォントサイズ: {style.font_size}px
        </span>
        <input
          type="range"
          min="16"
          max="96"
          value={style.font_size}
          onChange={(e) =>
            updateCustomStyle({ font_size: Number(e.target.value) })
          }
          className="w-full accent-blue-500"
        />
      </label>

      {/* Text Color */}
      <label className="flex items-center gap-2">
        <span className="text-xs text-gray-400">テキスト色</span>
        <input
          type="color"
          value={style.color}
          onChange={(e) => updateCustomStyle({ color: e.target.value })}
          className="w-8 h-8 rounded border border-gray-600 cursor-pointer"
        />
      </label>

      {/* Outline */}
      {style.outline && (
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={style.outline.enabled}
              onChange={(e) =>
                updateCustomStyle({
                  outline: { ...style.outline!, enabled: e.target.checked },
                })
              }
              className="accent-blue-500"
            />
            <span className="text-xs text-gray-400">縁取り</span>
          </label>
          {style.outline.enabled && (
            <div className="flex flex-col gap-2 ml-6">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={style.outline.color}
                  onChange={(e) =>
                    updateCustomStyle({
                      outline: { ...style.outline!, color: e.target.value },
                    })
                  }
                  className="w-6 h-6 rounded border border-gray-600 cursor-pointer"
                />
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.5"
                  value={style.outline.width}
                  onChange={(e) =>
                    updateCustomStyle({
                      outline: {
                        ...style.outline!,
                        width: Number(e.target.value),
                      },
                    })
                  }
                  className="flex-1 accent-blue-500"
                />
                <span className="text-xs text-gray-500">
                  {style.outline.width}px
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">結合</span>
                {(["miter", "round", "bevel"] as const).map((j) => (
                  <button
                    key={j}
                    onClick={() =>
                      updateCustomStyle({
                        outline: { ...style.outline!, join: j },
                      })
                    }
                    className={`px-2 py-0.5 text-xs rounded ${
                      (style.outline?.join ?? "miter") === j
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {j === "miter"
                      ? "マイター"
                      : j === "round"
                        ? "ラウンド"
                        : "ベベル"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Font Weight */}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-400">
          太さ: {style.font_weight}
        </span>
        <input
          type="range"
          min="100"
          max="900"
          step="100"
          value={style.font_weight}
          onChange={(e) =>
            updateCustomStyle({ font_weight: Number(e.target.value) })
          }
          className="w-full accent-blue-500"
        />
      </label>
    </div>
  );
}
