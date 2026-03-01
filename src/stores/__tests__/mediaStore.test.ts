import { describe, it, expect, beforeEach } from "vitest";
import { useMediaStore, type MediaItem } from "../mediaStore";

const createMockMediaItem = (
  overrides?: Partial<MediaItem>,
): MediaItem => ({
  id: "media-1",
  path: "/path/to/video.mp4",
  filename: "video.mp4",
  type: "video",
  durationMs: 10000,
  width: 1920,
  height: 1080,
  ...overrides,
});

describe("mediaStore", () => {
  beforeEach(() => {
    useMediaStore.setState({ importedMedia: [] });
  });

  describe("initial state", () => {
    it("has empty importedMedia", () => {
      expect(useMediaStore.getState().importedMedia).toEqual([]);
    });
  });

  describe("addMedia", () => {
    it("adds a media item", () => {
      const item = createMockMediaItem();
      useMediaStore.getState().addMedia(item);
      expect(useMediaStore.getState().importedMedia).toHaveLength(1);
      expect(useMediaStore.getState().importedMedia[0]).toEqual(item);
    });

    it("adds multiple media items", () => {
      useMediaStore
        .getState()
        .addMedia(createMockMediaItem({ id: "media-1", filename: "a.mp4" }));
      useMediaStore
        .getState()
        .addMedia(createMockMediaItem({ id: "media-2", filename: "b.png", type: "image" }));
      useMediaStore
        .getState()
        .addMedia(createMockMediaItem({ id: "media-3", filename: "c.mp3", type: "audio" }));

      expect(useMediaStore.getState().importedMedia).toHaveLength(3);
    });

    it("adds a video item with correct properties", () => {
      const item = createMockMediaItem({
        type: "video",
        durationMs: 15000,
        width: 1080,
        height: 1920,
      });
      useMediaStore.getState().addMedia(item);
      const stored = useMediaStore.getState().importedMedia[0];
      expect(stored.type).toBe("video");
      expect(stored.durationMs).toBe(15000);
      expect(stored.width).toBe(1080);
      expect(stored.height).toBe(1920);
    });

    it("adds an image item with default 5s duration", () => {
      const item = createMockMediaItem({
        id: "img-1",
        type: "image",
        filename: "photo.png",
        durationMs: 5000,
      });
      useMediaStore.getState().addMedia(item);
      const stored = useMediaStore.getState().importedMedia[0];
      expect(stored.type).toBe("image");
      expect(stored.durationMs).toBe(5000);
    });

    it("adds an audio item", () => {
      const item = createMockMediaItem({
        id: "aud-1",
        type: "audio",
        filename: "bgm.mp3",
        durationMs: 180000,
        width: undefined,
        height: undefined,
      });
      useMediaStore.getState().addMedia(item);
      const stored = useMediaStore.getState().importedMedia[0];
      expect(stored.type).toBe("audio");
      expect(stored.width).toBeUndefined();
      expect(stored.height).toBeUndefined();
    });
  });

  describe("removeMedia", () => {
    it("removes a media item by id", () => {
      useMediaStore
        .getState()
        .addMedia(createMockMediaItem({ id: "media-1" }));
      useMediaStore
        .getState()
        .addMedia(createMockMediaItem({ id: "media-2" }));

      useMediaStore.getState().removeMedia("media-1");

      expect(useMediaStore.getState().importedMedia).toHaveLength(1);
      expect(useMediaStore.getState().importedMedia[0].id).toBe("media-2");
    });

    it("does nothing when removing non-existent id", () => {
      useMediaStore
        .getState()
        .addMedia(createMockMediaItem({ id: "media-1" }));

      useMediaStore.getState().removeMedia("non-existent");

      expect(useMediaStore.getState().importedMedia).toHaveLength(1);
    });

    it("removes all items when called for each", () => {
      useMediaStore
        .getState()
        .addMedia(createMockMediaItem({ id: "m1" }));
      useMediaStore
        .getState()
        .addMedia(createMockMediaItem({ id: "m2" }));

      useMediaStore.getState().removeMedia("m1");
      useMediaStore.getState().removeMedia("m2");

      expect(useMediaStore.getState().importedMedia).toEqual([]);
    });
  });
});
