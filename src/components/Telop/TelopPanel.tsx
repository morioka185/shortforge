import { useState } from "react";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-dialog";
import { TemplateList } from "./TemplateList";
import { StyleEditor } from "./StyleEditor";
import { AnimationPreview } from "./AnimationPreview";
import { Button } from "../Common/Button";
import { useTimelineStore } from "../../stores/timelineStore";
import { parseSrt } from "../../lib/tauri";

function formatTimeInput(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const millis = ms % 1000;
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`;
}

function parseTimeInput(value: string): number {
  const match = value.match(/^(\d+):(\d+)(?:\.(\d+))?$/);
  if (!match) return 0;
  const min = parseInt(match[1], 10);
  const sec = parseInt(match[2], 10);
  const msStr = (match[3] ?? "0").padEnd(3, "0").slice(0, 3);
  const ms = parseInt(msStr, 10);
  return min * 60000 + sec * 1000 + ms;
}

function SrtImport() {
  const { t } = useTranslation();
  const { addTrack } = useTimelineStore();
  const [loading, setLoading] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const handleImportSrt = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: t("telop.srtFilterName"), extensions: ["srt"] }],
      });
      if (!selected) return;

      setLoading(true);
      const cues = await parseSrt(selected);

      if (cues.length === 0) {
        setImportedCount(0);
        return;
      }

      const clips = cues.map((cue) => {
        const clipId = `telop-${Date.now()}-${cue.index}`;
        return {
          id: clipId,
          trackId: "",
          type: "telop" as const,
          startMs: cue.start_ms,
          endMs: cue.end_ms,
          label: cue.text,
          color: "#f59e0b",
        };
      });

      const trackId = `telop-track-${Date.now()}`;
      clips.forEach((c) => (c.trackId = trackId));

      addTrack({
        id: trackId,
        type: "telop",
        label: t("telop.srtTrackLabel"),
        muted: false,
        clips,
      });

      setImportedCount(cues.length);
    } catch {
      // Dialog cancelled or parse error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {t("telop.srtImportHeader")}
      </h3>
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={handleImportSrt}
        disabled={loading}
      >
        {loading ? t("media.loading") : t("telop.srtImportButton")}
      </Button>
      {importedCount !== null && (
        <p className="text-xs text-gray-500 mt-1">
          {t("telop.srtImportedCount", { count: importedCount })}
        </p>
      )}
    </div>
  );
}

function ManualTelopAdd() {
  const { t } = useTranslation();
  const { addTrack, currentTimeMs } = useTimelineStore();
  const [text, setText] = useState("");
  const [startMs, setStartMs] = useState(0);
  const [endMs, setEndMs] = useState(3000);

  const handleAddFromCurrent = () => {
    setStartMs(currentTimeMs);
    setEndMs(currentTimeMs + 3000);
  };

  const handleAdd = () => {
    if (!text.trim()) return;

    const clipId = `telop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const trackId = `telop-track-${Date.now()}`;

    addTrack({
      id: trackId,
      type: "telop",
      label: t("telop.trackLabel"),
      muted: false,
      clips: [
        {
          id: clipId,
          trackId,
          type: "telop",
          startMs,
          endMs,
          label: text.trim(),
          color: "#f59e0b",
        },
      ],
    });

    setText("");
  };

  return (
    <div className="p-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {t("telop.addHeader")}
      </h3>

      <textarea
        className="w-full bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 p-2 resize-none focus:outline-none focus:border-blue-500"
        rows={2}
        placeholder={t("telop.textPlaceholder")}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">
            {t("telop.start")}
          </label>
          <input
            type="text"
            className="w-full bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 px-2 py-1 focus:outline-none focus:border-blue-500"
            value={formatTimeInput(startMs)}
            onChange={(e) => setStartMs(parseTimeInput(e.target.value))}
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">
            {t("telop.end")}
          </label>
          <input
            type="text"
            className="w-full bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 px-2 py-1 focus:outline-none focus:border-blue-500"
            value={formatTimeInput(endMs)}
            onChange={(e) => setEndMs(parseTimeInput(e.target.value))}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-[11px]"
          onClick={handleAddFromCurrent}
        >
          {t("telop.fromCurrent")}
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={handleAdd}
          disabled={!text.trim()}
        >
          {t("telop.add")}
        </Button>
      </div>
    </div>
  );
}

export function TelopPanel() {
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-850">
      <SrtImport />
      <div className="border-t border-gray-700" />
      <ManualTelopAdd />
      <div className="border-t border-gray-700" />
      <TemplateList />
      <div className="border-t border-gray-700" />
      <StyleEditor />
      <div className="border-t border-gray-700" />
      <AnimationPreview />
    </div>
  );
}
