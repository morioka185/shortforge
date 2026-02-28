export interface VideoClip {
  id: string;
  source: string;
  start_ms: number;
  end_ms: number;
  trim_start_ms: number;
  trim_end_ms: number;
}

export interface AudioClip {
  id: string;
  source: string;
  start_ms: number;
  end_ms: number;
  volume: number;
}
