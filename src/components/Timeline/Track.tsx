import { useTranslation } from "react-i18next";
import type { TimelineTrackData } from "../../stores/timelineStore";
import { useTimelineStore } from "../../stores/timelineStore";
import { Clip } from "./Clip";

interface TrackProps {
  track: TimelineTrackData;
  zoom: number;
}

export function Track({ track, zoom }: TrackProps) {
  const { t } = useTranslation();
  const toggleTrackMute = useTimelineStore((s) => s.toggleTrackMute);
  const removeTrack = useTimelineStore((s) => s.removeTrack);

  const TRACK_TYPE_LABELS: Record<string, string> = {
    video: t("timeline.trackVideo"),
    telop: t("timeline.trackTelop"),
    audio: t("timeline.trackAudio"),
  };

  const showMuteButton = track.type === "video" || track.type === "audio";

  return (
    <div className="flex border-b border-gray-700">
      {/* Track label */}
      <div className="w-24 flex-shrink-0 px-2 py-2 bg-gray-800 border-r border-gray-700">
        <div className="flex items-center gap-1">
          <div className="text-xs font-medium text-gray-300 flex-1 truncate">
            {TRACK_TYPE_LABELS[track.type] || track.type}
          </div>
          {showMuteButton && (
            <button
              onClick={() => toggleTrackMute(track.id)}
              className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${
                track.muted
                  ? "bg-red-600 text-white"
                  : "bg-gray-600 text-gray-300 hover:bg-gray-500"
              }`}
              title={track.muted ? t("timeline.unmute") : t("timeline.mute")}
            >
              M
            </button>
          )}
          <button
            onClick={() => removeTrack(track.id)}
            className="w-5 h-5 flex items-center justify-center rounded text-[10px] text-gray-500 hover:text-red-400 hover:bg-gray-700 transition-colors"
            title={t("timeline.removeTrack")}
          >
            &times;
          </button>
        </div>
        <div className="text-[10px] text-gray-500 truncate">{track.label}</div>
      </div>

      {/* Track content */}
      <div className={`flex-1 relative h-10 bg-gray-850 ${track.muted ? "opacity-50" : ""}`}>
        {track.clips.map((clip) => (
          <Clip key={clip.id} clip={clip} zoom={zoom} />
        ))}
      </div>
    </div>
  );
}
