import type { TimelineTrackData } from "../../stores/timelineStore";
import { Clip } from "./Clip";

const TRACK_TYPE_LABELS: Record<string, string> = {
  video: "映像",
  telop: "テロップ",
  audio: "音声",
};

interface TrackProps {
  track: TimelineTrackData;
  zoom: number;
}

export function Track({ track, zoom }: TrackProps) {
  return (
    <div className="flex border-b border-gray-700">
      {/* Track label */}
      <div className="w-24 flex-shrink-0 px-2 py-2 bg-gray-800 border-r border-gray-700">
        <div className="text-xs font-medium text-gray-300">
          {TRACK_TYPE_LABELS[track.type] || track.type}
        </div>
        <div className="text-[10px] text-gray-500 truncate">{track.label}</div>
      </div>

      {/* Track content */}
      <div className="flex-1 relative h-10 bg-gray-850">
        {track.clips.map((clip) => (
          <Clip key={clip.id} clip={clip} zoom={zoom} />
        ))}
      </div>
    </div>
  );
}
