import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTelopStore } from "../../stores/telopStore";

export function AnimationPreview() {
  const { t } = useTranslation();
  const { getSelectedTemplate, customStyle, previewText, setPreviewText } =
    useTelopStore();
  const template = getSelectedTemplate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const style = template
    ? { ...template.default_style, ...customStyle }
    : null;

  const totalDuration = template
    ? template.animation.duration_ms +
      previewText.length * template.animation.delay_per_unit_ms
    : 1000;

  const play = useCallback(() => {
    setIsPlaying(true);
    setProgress(0);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const startTime = performance.now();
    let raf: number;

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const p = Math.min(elapsed / totalDuration, 1);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, totalDuration]);

  if (!template || !style) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg">
        <span className="text-gray-500 text-sm">
          {t("preview.selectTemplate")}
        </span>
      </div>
    );
  }

  const chars = previewText.split("");
  const currentTimeMs = progress * totalDuration;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider px-3">
        {t("preview.header")}
      </h3>

      {/* Preview Area */}
      <div
        className="relative flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden"
        style={{ aspectRatio: "9/16", maxHeight: "400px" }}
      >
        <div className="flex">
          {chars.map((char, i) => {
            const charStartMs = i * template.animation.delay_per_unit_ms;
            const elapsed = Math.max(0, currentTimeMs - charStartMs);
            const charProgress = Math.min(
              elapsed / template.animation.duration_ms,
              1,
            );

            const animStyle = getCharStyle(template, charProgress);

            return (
              <span
                key={i}
                className="inline-block transition-none"
                style={{
                  fontFamily: style.font_family,
                  fontSize: `${style.font_size * 0.5}px`,
                  fontWeight: style.font_weight,
                  color: style.color,
                  opacity: animStyle.opacity,
                  transform: `translateY(${animStyle.translateY}px) scale(${animStyle.scale}) rotate(${animStyle.rotate}deg)`,
                  textShadow: style.outline?.enabled
                    ? `0 0 0 ${style.outline.color}, -${style.outline.width}px 0 ${style.outline.color}, ${style.outline.width}px 0 ${style.outline.color}, 0 -${style.outline.width}px ${style.outline.color}, 0 ${style.outline.width}px ${style.outline.color}`
                    : undefined,
                  WebkitTextStroke: style.outline?.enabled
                    ? `${style.outline.width}px ${style.outline.color}`
                    : undefined,
                  paintOrder: "stroke fill",
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 px-3">
        <button
          onClick={play}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
        >
          {isPlaying ? t("preview.playing") : t("preview.play")}
        </button>
        <div className="flex-1 bg-gray-700 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-full rounded-full transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Preview Text */}
      <div className="px-3">
        <input
          type="text"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-sm text-white placeholder-gray-500"
          placeholder={t("preview.textPlaceholder")}
        />
      </div>
    </div>
  );
}

interface CharAnimStyle {
  opacity: number;
  translateY: number;
  scale: number;
  rotate: number;
}

function getCharStyle(
  template: { animation: { keyframes?: Array<{ t: number; opacity?: number; translate_y?: number; scale?: number; rotate?: number }>; from?: Record<string, number>; to?: Record<string, number> } },
  progress: number,
): CharAnimStyle {
  const anim = template.animation;

  if (anim.keyframes && anim.keyframes.length > 0) {
    return interpolateKeyframes(anim.keyframes, progress);
  }

  // Simple from/to animation
  const fromOpacity = anim.from?.opacity ?? 0;
  const toOpacity = anim.to?.opacity ?? 1;

  return {
    opacity: fromOpacity + (toOpacity - fromOpacity) * progress,
    translateY: 0,
    scale: 1,
    rotate: 0,
  };
}

function interpolateKeyframes(
  keyframes: Array<{
    t: number;
    opacity?: number;
    translate_y?: number;
    scale?: number;
    rotate?: number;
  }>,
  progress: number,
): CharAnimStyle {
  if (progress <= keyframes[0].t) {
    return kfToStyle(keyframes[0]);
  }
  if (progress >= keyframes[keyframes.length - 1].t) {
    return kfToStyle(keyframes[keyframes.length - 1]);
  }

  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (progress >= a.t && progress <= b.t) {
      const segDuration = b.t - a.t;
      const localP = segDuration > 0 ? (progress - a.t) / segDuration : 1;
      const sa = kfToStyle(a);
      const sb = kfToStyle(b);
      return {
        opacity: sa.opacity + (sb.opacity - sa.opacity) * localP,
        translateY: sa.translateY + (sb.translateY - sa.translateY) * localP,
        scale: sa.scale + (sb.scale - sa.scale) * localP,
        rotate: sa.rotate + (sb.rotate - sa.rotate) * localP,
      };
    }
  }

  return kfToStyle(keyframes[keyframes.length - 1]);
}

function kfToStyle(kf: {
  opacity?: number;
  translate_y?: number;
  scale?: number;
  rotate?: number;
}): CharAnimStyle {
  return {
    opacity: kf.opacity ?? 1,
    translateY: kf.translate_y ?? 0,
    scale: kf.scale ?? 1,
    rotate: kf.rotate ?? 0,
  };
}
