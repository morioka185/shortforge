import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import { save } from "@tauri-apps/plugin-dialog";
import { Button } from "../Common/Button";
import { PlatformPreset } from "./PlatformPreset";
import type { ExportPreset, ValidationResult, AudioSourceParam } from "../../lib/tauri";
import { getPresets, validateExport, exportVideo } from "../../lib/tauri";
import { useProjectStore } from "../../stores/projectStore";
import { useTimelineStore } from "../../stores/timelineStore";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

type ExportState = "idle" | "validating" | "exporting" | "done" | "error";

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const { t } = useTranslation();
  const { project } = useProjectStore();
  const [presets, setPresets] = useState<ExportPreset[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    getPresets()
      .then((p) => {
        setPresets(p);
        if (p.length > 0 && !selectedPlatform) {
          setSelectedPlatform(
            project?.metadata.platform ?? p[0].platform,
          );
        }
      })
      .catch(() => {
        // Fallback presets for dev mode
        setPresets([]);
      });
  }, [open]);

  useEffect(() => {
    if (!open || !selectedPlatform || !project) return;
    setExportState("validating");
    validateExport({
      durationMs: project.canvas.duration_ms,
      width: project.canvas.width,
      height: project.canvas.height,
      platform: selectedPlatform,
    })
      .then((result) => {
        setValidation(result);
        setExportState("idle");
      })
      .catch(() => {
        setValidation(null);
        setExportState("idle");
      });
  }, [selectedPlatform, open]);

  useEffect(() => {
    if (!open) return;
    const unlisten = listen<{ percent: number }>("export-progress", (event) => {
      setProgress(Math.round(event.payload.percent));
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [open]);

  const handleExport = async () => {
    if (!project) return;

    const outputPath = await save({
      defaultPath: `${project.metadata.name}_${selectedPlatform}.mp4`,
      filters: [{ name: "MP4 Video", extensions: ["mp4"] }],
    });
    if (!outputPath) return;

    setExportState("exporting");
    setProgress(0);
    setErrorMessage("");

    try {
      // Find the first video clip's source path
      const videoTrack = project.tracks.find((t) => t.type === "video");
      const firstClip = videoTrack?.clips?.[0];
      const inputVideo =
        firstClip &&
        typeof firstClip === "object" &&
        firstClip !== null &&
        "source" in firstClip
          ? (firstClip as { source: string }).source
          : "";

      if (!inputVideo) {
        setExportState("error");
        setErrorMessage(t("exportDialog.noVideoClip"));
        return;
      }

      // Collect non-muted audio track clips
      const timelineTracks = useTimelineStore.getState().tracks;
      const audioSources: AudioSourceParam[] = [];
      for (const track of timelineTracks) {
        if (track.type === "audio" && !track.muted) {
          for (const clip of track.clips) {
            if (clip.source) {
              audioSources.push({
                path: clip.source,
                startMs: clip.startMs,
                endMs: clip.endMs,
              });
            }
          }
        }
      }

      await exportVideo({
        inputVideo,
        outputPath,
        platform: selectedPlatform,
        audioSources: audioSources.length > 0 ? audioSources : undefined,
      });

      setExportState("done");
    } catch (err) {
      setExportState("error");
      setErrorMessage(String(err));
    }
  };

  const handleClose = () => {
    if (exportState === "exporting") return;
    setExportState("idle");
    setProgress(0);
    setValidation(null);
    setErrorMessage("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-[560px] max-h-[80vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">{t("exportDialog.header")}</h2>
          <button
            onClick={handleClose}
            disabled={exportState === "exporting"}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Platform selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              {t("exportDialog.platform")}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {presets.map((preset) => (
                <PlatformPreset
                  key={preset.platform}
                  preset={preset}
                  selected={selectedPlatform === preset.platform}
                  onSelect={setSelectedPlatform}
                />
              ))}
            </div>
          </div>

          {/* Validation results */}
          {validation && (
            <div className="space-y-2">
              {validation.errors.map((err, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-3 rounded-lg bg-red-900/30 border border-red-700"
                >
                  <span className="text-red-400 text-sm">!</span>
                  <span className="text-sm text-red-300">{err.message}</span>
                </div>
              ))}
              {validation.warnings.map((warn, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-3 rounded-lg bg-yellow-900/30 border border-yellow-700"
                >
                  <span className="text-yellow-400 text-sm">!</span>
                  <span className="text-sm text-yellow-300">
                    {warn.message}
                  </span>
                </div>
              ))}
              {validation.valid &&
                validation.warnings.length === 0 && (
                  <div className="p-3 rounded-lg bg-green-900/30 border border-green-700">
                    <span className="text-sm text-green-300">
                      {t("exportDialog.allChecksPassed")}
                    </span>
                  </div>
                )}
            </div>
          )}

          {/* Progress */}
          {exportState === "exporting" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>{t("exportDialog.exporting")}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Done */}
          {exportState === "done" && (
            <div className="p-4 rounded-lg bg-green-900/30 border border-green-700 text-center">
              <p className="text-green-300 font-medium">
                {t("exportDialog.exportCompleted")}
              </p>
            </div>
          )}

          {/* Error */}
          {exportState === "error" && (
            <div className="p-4 rounded-lg bg-red-900/30 border border-red-700">
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={exportState === "exporting"}
          >
            {exportState === "done" ? t("exportDialog.close") : t("exportDialog.cancel")}
          </Button>
          {exportState !== "done" && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              disabled={
                exportState === "exporting" ||
                exportState === "validating" ||
                (validation !== null && !validation.valid)
              }
            >
              {exportState === "exporting" ? t("exportDialog.exporting") : t("exportDialog.startExport")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
