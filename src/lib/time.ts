export function msToTimecode(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

export function timecodeToMs(timecode: string): number {
  const [minSec, ms] = timecode.split(".");
  const [minutes, seconds] = minSec.split(":").map(Number);
  return minutes * 60000 + seconds * 1000 + Number(ms);
}
