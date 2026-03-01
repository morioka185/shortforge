import { describe, it, expect, beforeEach } from "vitest";
import { useTelopStore } from "../telopStore";
import type { TelopTemplate } from "../../types/telop";

const createMockTemplate = (
  overrides?: Partial<TelopTemplate>,
): TelopTemplate => ({
  id: "template-1",
  name: "タイプライター",
  description: "一文字ずつ表示",
  category: "basic",
  animation: {
    unit: "character",
    duration_ms: 300,
    delay_per_unit_ms: 50,
    easing: "ease-out",
  },
  default_style: {
    font_family: "Noto Sans JP",
    font_size: 48,
    font_weight: 700,
    color: "#ffffff",
  },
  ...overrides,
});

describe("telopStore", () => {
  beforeEach(() => {
    useTelopStore.setState({
      templates: [],
      selectedTemplateId: null,
      customStyle: {},
      previewText: "サンプルテキスト",
    });
  });

  describe("initial state", () => {
    it("has empty templates", () => {
      expect(useTelopStore.getState().templates).toEqual([]);
    });

    it("has no selected template", () => {
      expect(useTelopStore.getState().selectedTemplateId).toBeNull();
    });

    it("has empty custom style", () => {
      expect(useTelopStore.getState().customStyle).toEqual({});
    });

    it("has default preview text in Japanese", () => {
      expect(useTelopStore.getState().previewText).toBe("サンプルテキスト");
    });
  });

  describe("setTemplates", () => {
    it("sets templates list", () => {
      const templates = [
        createMockTemplate({ id: "t1" }),
        createMockTemplate({ id: "t2", name: "バウンス" }),
      ];
      useTelopStore.getState().setTemplates(templates);
      expect(useTelopStore.getState().templates).toHaveLength(2);
      expect(useTelopStore.getState().templates[0].id).toBe("t1");
    });

    it("replaces existing templates", () => {
      useTelopStore.getState().setTemplates([createMockTemplate({ id: "old" })]);
      useTelopStore.getState().setTemplates([createMockTemplate({ id: "new" })]);
      expect(useTelopStore.getState().templates).toHaveLength(1);
      expect(useTelopStore.getState().templates[0].id).toBe("new");
    });
  });

  describe("setSelectedTemplate", () => {
    it("selects a template by ID", () => {
      useTelopStore.getState().setSelectedTemplate("template-1");
      expect(useTelopStore.getState().selectedTemplateId).toBe("template-1");
    });

    it("deselects a template", () => {
      useTelopStore.getState().setSelectedTemplate("template-1");
      useTelopStore.getState().setSelectedTemplate(null);
      expect(useTelopStore.getState().selectedTemplateId).toBeNull();
    });
  });

  describe("updateCustomStyle", () => {
    it("sets a custom style property", () => {
      useTelopStore.getState().updateCustomStyle({ font_size: 64 });
      expect(useTelopStore.getState().customStyle.font_size).toBe(64);
    });

    it("merges with existing custom styles", () => {
      useTelopStore.getState().updateCustomStyle({ font_size: 64 });
      useTelopStore.getState().updateCustomStyle({ color: "#ff0000" });
      expect(useTelopStore.getState().customStyle).toEqual({
        font_size: 64,
        color: "#ff0000",
      });
    });

    it("overrides existing properties", () => {
      useTelopStore.getState().updateCustomStyle({ font_size: 64 });
      useTelopStore.getState().updateCustomStyle({ font_size: 32 });
      expect(useTelopStore.getState().customStyle.font_size).toBe(32);
    });
  });

  describe("setPreviewText", () => {
    it("sets preview text", () => {
      useTelopStore.getState().setPreviewText("新しいテキスト");
      expect(useTelopStore.getState().previewText).toBe("新しいテキスト");
    });

    it("can set empty string", () => {
      useTelopStore.getState().setPreviewText("");
      expect(useTelopStore.getState().previewText).toBe("");
    });
  });

  describe("getSelectedTemplate", () => {
    const templates = [
      createMockTemplate({ id: "t1", name: "Template A" }),
      createMockTemplate({ id: "t2", name: "Template B" }),
    ];

    beforeEach(() => {
      useTelopStore.getState().setTemplates(templates);
    });

    it("returns the selected template", () => {
      useTelopStore.getState().setSelectedTemplate("t1");
      const selected = useTelopStore.getState().getSelectedTemplate();
      expect(selected?.id).toBe("t1");
      expect(selected?.name).toBe("Template A");
    });

    it("returns undefined when no template is selected", () => {
      const selected = useTelopStore.getState().getSelectedTemplate();
      expect(selected).toBeUndefined();
    });

    it("returns undefined when selected ID does not match any template", () => {
      useTelopStore.getState().setSelectedTemplate("nonexistent");
      const selected = useTelopStore.getState().getSelectedTemplate();
      expect(selected).toBeUndefined();
    });
  });
});
