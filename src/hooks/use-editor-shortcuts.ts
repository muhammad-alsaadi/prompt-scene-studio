// Keyboard shortcut system for the editor
import { useEffect, useCallback } from "react";
import { useEditorStore } from "@/store/editor-store";
import { useSceneStore } from "@/store/scene-store";

export function useEditorShortcuts() {
  const { undo, redo, deselect, selectedIds, zoomIn, zoomOut, resetView, toggleSnap, toggleGrid, clipboard, copyToClipboard } = useEditorStore();
  const { currentScene, removeObject, duplicateObject, selectObject, addObject } = useSceneStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore when typing in inputs
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    const mod = e.metaKey || e.ctrlKey;

    // Undo
    if (mod && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }

    // Redo
    if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
      e.preventDefault();
      redo();
      return;
    }

    // Delete
    if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size > 0) {
      e.preventDefault();
      selectedIds.forEach(id => removeObject(id));
      deselect();
      return;
    }

    // Duplicate
    if (mod && e.key === "d" && selectedIds.size > 0) {
      e.preventDefault();
      selectedIds.forEach(id => duplicateObject(id));
      return;
    }

    // Copy
    if (mod && e.key === "c" && selectedIds.size > 0) {
      e.preventDefault();
      const objects = currentScene.objects.filter(o => selectedIds.has(o.id));
      copyToClipboard(objects);
      return;
    }

    // Paste
    if (mod && e.key === "v" && clipboard.length > 0) {
      e.preventDefault();
      clipboard.forEach(obj => {
        addObject({ ...obj, id: undefined as any });
      });
      return;
    }

    // Select all
    if (mod && e.key === "a") {
      e.preventDefault();
      const allIds = currentScene.objects.map(o => o.id);
      useEditorStore.getState().selectAll(allIds);
      return;
    }

    // Deselect
    if (e.key === "Escape") {
      deselect();
      selectObject(null);
      return;
    }

    // Zoom
    if (mod && e.key === "=") { e.preventDefault(); zoomIn(); }
    if (mod && e.key === "-") { e.preventDefault(); zoomOut(); }
    if (mod && e.key === "0") { e.preventDefault(); resetView(); }

    // Toggle snap
    if (e.key === "'" && mod) { e.preventDefault(); toggleSnap(); }

    // Toggle grid
    if (e.key === "g" && mod && e.shiftKey) { e.preventDefault(); toggleGrid(); }
  }, [selectedIds, clipboard, currentScene.objects]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
