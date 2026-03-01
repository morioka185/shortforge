import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTelopStore } from "../../stores/telopStore";
import {
  useTimelineStore,
  DEFAULT_TRANSFORM,
} from "../../stores/timelineStore";
import { listSystemFonts } from "../../lib/tauri";

/** Canvas dimensions (must match Preview.tsx) */
const CANVAS_W = 1080;
const CANVAS_H = 1920;

export function StyleEditor() {
  const { t } = useTranslation();
  const { customStyle, updateCustomStyle, getSelectedTemplate } =
    useTelopStore();
  const template = getSelectedTemplate();

  const { tracks, selectedClipId, updateClipTransform } = useTimelineStore();

  const [systemFonts, setSystemFonts] = useState<string[]>([]);
  const [fontSearch, setFontSearch] = useState("");
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listSystemFonts()
      .then(setSystemFonts)
      .catch((err) => console.error("Failed to load system fonts:", err));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        fontDropdownRef.current &&
        !fontDropdownRef.current.contains(e.target as Node)
      ) {
        setFontDropdownOpen(false);
      }
    }
    if (fontDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [fontDropdownOpen]);

  // Find the selected clip
  const selectedClip = selectedClipId
    ? tracks.flatMap((t) => t.clips).find((c) => c.id === selectedClipId)
    : null;

  if (!template) {
    return (
      <div className="p-3 text-gray-500 text-sm">
        {t("template.selectPrompt")}
      </div>
    );
  }

  const style = { ...template.default_style, ...customStyle };

  const clipTransform = selectedClip?.transform ?? DEFAULT_TRANSFORM;

  const filteredFonts = useMemo(() => {
    if (!fontSearch) return systemFonts;
    const lower = fontSearch.toLowerCase();
    return systemFonts.filter((f) => f.toLowerCase().includes(lower));
  }, [systemFonts, fontSearch]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        {t("style.header")}
      </h3>

      {/* Position & Scale (shown for selected clip) */}
      {selectedClip && (
        <div className="flex flex-col gap-2 pb-3 border-b border-gray-700">
          <span className="text-xs text-gray-400 font-medium">
            {t("style.positionSize")}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-500">X</span>
              <input
                type="number"
                value={Math.round(clipTransform.x)}
                onChange={(e) =>
                  updateClipTransform(selectedClip.id, {
                    x: Number(e.target.value),
                  })
                }
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-500">Y</span>
              <input
                type="number"
                value={Math.round(clipTransform.y)}
                onChange={(e) =>
                  updateClipTransform(selectedClip.id, {
                    y: Number(e.target.value),
                  })
                }
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
              />
            </label>
          </div>
          {/* Alignment buttons */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[10px] text-gray-500">{t("style.align")}</span>
            <div className="flex gap-1">
              <button
                type="button"
                title={t("style.alignLeft")}
                onClick={() => updateClipTransform(selectedClip.id, { x: 0 })}
                className="flex-1 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="2" width="1.5" height="10" rx="0.5" fill="currentColor" />
                  <rect x="5" y="4" width="6" height="2.5" rx="0.5" fill="currentColor" />
                  <rect x="5" y="8" width="4" height="2.5" rx="0.5" fill="currentColor" />
                </svg>
              </button>
              <button
                type="button"
                title={t("style.alignCenterH")}
                onClick={() => updateClipTransform(selectedClip.id, { x: CANVAS_W / 2 })}
                className="flex-1 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="6.25" y="1" width="1.5" height="12" rx="0.5" fill="currentColor" opacity="0.4" />
                  <rect x="3" y="4" width="8" height="2.5" rx="0.5" fill="currentColor" />
                  <rect x="4" y="8" width="6" height="2.5" rx="0.5" fill="currentColor" />
                </svg>
              </button>
              <button
                type="button"
                title={t("style.alignRight")}
                onClick={() => updateClipTransform(selectedClip.id, { x: CANVAS_W })}
                className="flex-1 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="10.5" y="2" width="1.5" height="10" rx="0.5" fill="currentColor" />
                  <rect x="3" y="4" width="6" height="2.5" rx="0.5" fill="currentColor" />
                  <rect x="5" y="8" width="4" height="2.5" rx="0.5" fill="currentColor" />
                </svg>
              </button>
              <div className="w-px bg-gray-600 mx-0.5" />
              <button
                type="button"
                title={t("style.alignTop")}
                onClick={() => updateClipTransform(selectedClip.id, { y: 0 })}
                className="flex-1 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="2" width="10" height="1.5" rx="0.5" fill="currentColor" />
                  <rect x="4" y="5" width="2.5" height="6" rx="0.5" fill="currentColor" />
                  <rect x="8" y="5" width="2.5" height="4" rx="0.5" fill="currentColor" />
                </svg>
              </button>
              <button
                type="button"
                title={t("style.alignCenterV")}
                onClick={() => updateClipTransform(selectedClip.id, { y: CANVAS_H / 2 })}
                className="flex-1 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="6.25" width="12" height="1.5" rx="0.5" fill="currentColor" opacity="0.4" />
                  <rect x="4" y="3" width="2.5" height="8" rx="0.5" fill="currentColor" />
                  <rect x="8" y="4" width="2.5" height="6" rx="0.5" fill="currentColor" />
                </svg>
              </button>
              <button
                type="button"
                title={t("style.alignBottom")}
                onClick={() => updateClipTransform(selectedClip.id, { y: CANVAS_H })}
                className="flex-1 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="10.5" width="10" height="1.5" rx="0.5" fill="currentColor" />
                  <rect x="4" y="3" width="2.5" height="6" rx="0.5" fill="currentColor" />
                  <rect x="8" y="5" width="2.5" height="4" rx="0.5" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>

          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-gray-500">
              {t("style.scale", {
                value: (clipTransform.scaleX * 100).toFixed(0),
              })}
            </span>
            <input
              type="range"
              min="10"
              max="500"
              value={Math.round(clipTransform.scaleX * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) / 100;
                updateClipTransform(selectedClip.id, {
                  scaleX: v,
                  scaleY: v,
                });
              }}
              className="w-full accent-blue-500"
            />
          </label>
        </div>
      )}

      {/* Font Family */}
      <div className="flex flex-col gap-1" ref={fontDropdownRef}>
        <span className="text-xs text-gray-400">{t("style.font")}</span>
        <button
          type="button"
          onClick={() => setFontDropdownOpen((v) => !v)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white text-left truncate hover:border-gray-500 transition-colors"
          style={{ fontFamily: style.font_family }}
        >
          {style.font_family || t("style.fontSelect")}
        </button>
        {fontDropdownOpen && (
          <div className="relative">
            <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-64 flex flex-col">
              <div className="p-1.5 border-b border-gray-700">
                <input
                  type="text"
                  value={fontSearch}
                  onChange={(e) => setFontSearch(e.target.value)}
                  placeholder={t("style.fontSearch")}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto flex-1">
                {filteredFonts.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    {t("style.fontNotFound")}
                  </div>
                ) : (
                  filteredFonts.map((font) => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => {
                        updateCustomStyle({ font_family: font });
                        setFontDropdownOpen(false);
                        setFontSearch("");
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 transition-colors truncate ${
                        style.font_family === font
                          ? "bg-blue-600/30 text-blue-300"
                          : "text-gray-200"
                      }`}
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Font Size */}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-400">
          {t("style.fontSize", { value: style.font_size })}
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
        <span className="text-xs text-gray-400">{t("style.textColor")}</span>
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
            <span className="text-xs text-gray-400">{t("style.outline")}</span>
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
                <span className="text-xs text-gray-400">
                  {t("style.join")}
                </span>
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
                      ? t("style.joinMiter")
                      : j === "round"
                        ? t("style.joinRound")
                        : t("style.joinBevel")}
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
          {t("style.weight", { value: style.font_weight })}
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
