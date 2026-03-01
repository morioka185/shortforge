import { describe, it, expect } from "vitest";
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_FPS, PREVIEW_SCALE } from "../constants";

describe("constants", () => {
  it("has correct 9:16 canvas dimensions", () => {
    expect(CANVAS_WIDTH).toBe(1080);
    expect(CANVAS_HEIGHT).toBe(1920);
    expect(CANVAS_HEIGHT / CANVAS_WIDTH).toBeCloseTo(16 / 9, 2);
  });

  it("has default FPS of 30", () => {
    expect(DEFAULT_FPS).toBe(30);
  });

  it("has preview scale of 0.5", () => {
    expect(PREVIEW_SCALE).toBe(0.5);
  });

  it("preview dimensions are half of canvas", () => {
    expect(CANVAS_WIDTH * PREVIEW_SCALE).toBe(540);
    expect(CANVAS_HEIGHT * PREVIEW_SCALE).toBe(960);
  });
});
