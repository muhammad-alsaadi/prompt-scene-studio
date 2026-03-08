// Keyboard shortcut system for the editor
import { useEffect, useCallback } from "react";
import { useEditorStore } from "@/store/editor-store";
import { useSceneStore } from "@/store/scene-store";

export function useEditorShortcuts() {
  const { undo, redo, deselect, selectedIds, zoomIn, zoomOut, resetView, toggleSnap, toggleGrid, clipboard, copyToClipboard, setSpaceHeld } = useEditorStore();
  const { currentScene, removeObject, duplicateObject, selectObject, addObject } = useSceneStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Space for hand tool
    if (e.key === " " && !e.repeat) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      setSpaceHeld(true);
      return;
    }

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
        addObject({
          ...obj,
          id: undefined as any,
          x: (obj.x ?? 100) + 20,
          y: (obj.y ?? 100) + 20,
        });
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
      useEditorStore.getState().closeContextMenu();
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

    // Arrow keys to nudge selected objects
    if (selectedIds.size > 0 && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
      const { updateObject, currentScene: cs } = useSceneStore.getState();
      selectedIds.forEach(id => {
        const obj = cs.objects.find(o => o.id === id);
        if (obj && !obj.locked) {
          updateObject(id, { x: (obj.x ?? 0) + dx, y: (obj.y ?? 0) + dy });
        }
      });
    }
  }, [selectedIds, clipboard, currentScene.objects]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === " ") {
      setSpaceHeld(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
