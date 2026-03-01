import { describe, it, expect } from "vitest";
import { msToTimecode, timecodeToMs } from "../time";

describe("msToTimecode", () => {
  it("converts 0ms to 00:00.000", () => {
    expect(msToTimecode(0)).toBe("00:00.000");
  });

  it("converts milliseconds only", () => {
    expect(msToTimecode(500)).toBe("00:00.500");
  });

  it("converts exact seconds", () => {
    expect(msToTimecode(1000)).toBe("00:01.000");
    expect(msToTimecode(5000)).toBe("00:05.000");
  });

  it("converts seconds and milliseconds", () => {
    expect(msToTimecode(1500)).toBe("00:01.500");
    expect(msToTimecode(12345)).toBe("00:12.345");
  });

  it("converts minutes", () => {
    expect(msToTimecode(60000)).toBe("01:00.000");
    expect(msToTimecode(90000)).toBe("01:30.000");
  });

  it("converts full timecodes", () => {
    expect(msToTimecode(65432)).toBe("01:05.432");
    expect(msToTimecode(125999)).toBe("02:05.999");
  });

  it("pads single-digit minutes and seconds", () => {
    expect(msToTimecode(61001)).toBe("01:01.001");
  });

  it("handles large values (10+ minutes)", () => {
    expect(msToTimecode(600000)).toBe("10:00.000");
    expect(msToTimecode(3599999)).toBe("59:59.999");
  });
});

describe("timecodeToMs", () => {
  it("converts 00:00.000 to 0", () => {
    expect(timecodeToMs("00:00.000")).toBe(0);
  });

  it("converts milliseconds only", () => {
    expect(timecodeToMs("00:00.500")).toBe(500);
  });

  it("converts exact seconds", () => {
    expect(timecodeToMs("00:01.000")).toBe(1000);
    expect(timecodeToMs("00:05.000")).toBe(5000);
  });

  it("converts full timecodes", () => {
    expect(timecodeToMs("01:05.432")).toBe(65432);
    expect(timecodeToMs("02:05.999")).toBe(125999);
  });

  it("converts minutes", () => {
    expect(timecodeToMs("01:00.000")).toBe(60000);
    expect(timecodeToMs("01:30.000")).toBe(90000);
  });

  it("handles large values", () => {
    expect(timecodeToMs("10:00.000")).toBe(600000);
    expect(timecodeToMs("59:59.999")).toBe(3599999);
  });
});

describe("msToTimecode <-> timecodeToMs roundtrip", () => {
  const testValues = [0, 1, 500, 1000, 1500, 12345, 60000, 65432, 125999, 600000];

  testValues.forEach((ms) => {
    it(`roundtrips ${ms}ms correctly`, () => {
      expect(timecodeToMs(msToTimecode(ms))).toBe(ms);
    });
  });
});
