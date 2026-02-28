export interface TelopTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  animation: TelopAnimationDef;
  default_style: TelopStyle;
  preview_text?: string;
}

export interface TelopAnimationDef {
  unit: "character" | "word";
  property?: string;
  properties?: string[];
  from?: Record<string, number>;
  to?: Record<string, number>;
  keyframes?: Keyframe[];
  duration_ms: number;
  delay_per_unit_ms: number;
  easing: string;
}

export interface Keyframe {
  t: number;
  opacity?: number;
  translate_y?: number;
  translate_x?: number;
  scale?: number;
  rotate?: number;
}

export interface TelopStyle {
  font_family: string;
  font_size: number;
  font_weight: number;
  color: string;
  outline?: OutlineStyle;
  shadow?: ShadowStyle;
  position?: { x: number; y: number };
  alignment?: string;
}

export interface OutlineStyle {
  enabled: boolean;
  color: string;
  width: number;
  join?: "miter" | "round" | "bevel";
}

export interface ShadowStyle {
  enabled: boolean;
  color: string;
  offset_x: number;
  offset_y: number;
  blur: number;
}
