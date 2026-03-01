import { useState } from "react";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "../Common/Button";
import { useMediaStore, type MediaItem } from "../../stores/mediaStore";
import { useTimelineStore } from "../../stores/timelineStore";
import { probeMedia } from "../../lib/tauri";

const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "avi"];
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "aac", "m4a"];

function getMediaType(
  filename: string,
): "video" | "image" | "audio" | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (VIDEO_EXTENSIONS.includes(ext)) return "video";
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (AUDIO_EXTENSIONS.includes(ext)) return "audio";
  return null;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function MediaPanel() {
  const { t } = useTranslation();
  const { importedMedia, addMedia, removeMedia } = useMediaStore();
  const { addTrack } = useTimelineStore();
  const [loading, setLoading] = useState(false);

  const handleAddMedia = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: t("media.filterName"),
            extensions: [
              ...VIDEO_EXTENSIONS,
              ...IMAGE_EXTENSIONS,
              ...AUDIO_EXTENSIONS,
            ],
          },
        ],
      });

      if (!selected) return;

      const paths = Array.isArray(selected) ? selected : [selected];
      setLoading(true);

      for (const filePath of paths) {
        const filename = filePath.split(/[/\\]/).pop() ?? filePath;
        const mediaType = getMediaType(filename);
        if (!mediaType) continue;

        try {
          const info = await probeMedia(filePath);
          const durationMs =
            mediaType === "image" ? 5000 : info.duration_ms;

          const item: MediaItem = {
            id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            path: filePath,
            filename,
            type: mediaType,
            durationMs,
            width: info.width || undefined,
            height: info.height || undefined,
          };

          addMedia(item);

          // Add to timeline
          const clipId = `clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          if (mediaType === "video" || mediaType === "image") {
            addTrack({
              id: `track-${clipId}`,
              type: "video",
              label: filename,
              muted: false,
              clips: [
                {
                  id: clipId,
                  trackId: `track-${clipId}`,
                  type: "video",
                  startMs: 0,
                  endMs: durationMs,
                  label: filename,
                  source: filePath,
                  color: "#3b82f6",
                },
              ],
            });
          } else if (mediaType === "audio") {
            addTrack({
              id: `track-${clipId}`,
              type: "audio",
              label: filename,
              muted: false,
              clips: [
                {
                  id: clipId,
                  trackId: `track-${clipId}`,
                  type: "audio",
                  startMs: 0,
                  endMs: durationMs,
                  label: filename,
                  source: filePath,
                  color: "#22c55e",
                },
              ],
            });
          }
        } catch {
          // Skip files that can't be probed
        }
      }
    } catch {
      // Dialog cancelled or error
    } finally {
      setLoading(false);
    }
  };

  const typeLabel: Record<string, string> = {
    video: t("media.typeVideo"),
    image: t("media.typeImage"),
    audio: t("media.typeAudio"),
  };

  const typeColor: Record<string, string> = {
    video: "bg-blue-500/20 text-blue-400",
    image: "bg-purple-500/20 text-purple-400",
    audio: "bg-green-500/20 text-green-400",
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-700">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {t("media.header")}
        </h2>
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={handleAddMedia}
          disabled={loading}
        >
          {loading ? t("media.loading") : t("media.addMedia")}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {importedMedia.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4 whitespace-pre-line">
            {t("media.emptyMessage")}
          </p>
        )}

        {importedMedia.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 rounded bg-gray-800 hover:bg-gray-750 group"
          >
            <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-700 flex items-center justify-center text-xs text-gray-400">
              {item.type === "video" && "V"}
              {item.type === "image" && "I"}
              {item.type === "audio" && "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-200 truncate">{item.filename}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] px-1 py-0.5 rounded ${typeColor[item.type]}`}
                >
                  {typeLabel[item.type]}
                </span>
                <span className="text-[10px] text-gray-500">
                  {formatDuration(item.durationMs)}
                </span>
              </div>
            </div>
            <button
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs transition-opacity"
              onClick={() => removeMedia(item.id)}
              title={t("media.delete")}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
