import { useEffect } from "react";
import { useTimelineStore } from "../stores/timelineStore";

export function useKeyboardShortcuts() {
  const {
    togglePlayPause,
    zoomIn,
    zoomOut,
    editingClipId,
    selectedClipId,
    deleteClip,
  } = useTimelineStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts while clip edit dialog is open
      if (editingClipId) return;

      const target = e.target as HTMLElement;
      // Don't handle shortcuts when typing in inputs
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Space = play/pause
      if (e.code === "Space" && !isMod) {
        e.preventDefault();
        togglePlayPause();
        return;
      }

      // Cmd+Z = undo
      if (isMod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useTimelineStore.temporal.getState().undo();
        return;
      }

      // Cmd+Shift+Z = redo
      if (isMod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        useTimelineStore.temporal.getState().redo();
        return;
      }

      // Cmd+= / Cmd++ = zoom in
      if (isMod && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomIn();
        return;
      }

      // Cmd+- = zoom out
      if (isMod && e.key === "-") {
        e.preventDefault();
        zoomOut();
        return;
      }

      // Delete / Backspace = delete selected clip
      if ((e.key === "Delete" || e.key === "Backspace") && !isMod && selectedClipId) {
        e.preventDefault();
        deleteClip(selectedClipId);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayPause, zoomIn, zoomOut, editingClipId, selectedClipId, deleteClip]);
}
