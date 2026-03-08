// Editor store — undo/redo, multi-selection, artboards, grouping, tool mode
import { create } from "zustand";
import { SceneObject, Artboard } from "@/types/scene";

interface UndoAction {
  type: string;
  undo: () => void;
  redo: () => void;
}

export type EditorTool =
  | "select"
  | "hand"
  | "text"
  | "pen"
  | "rectangle"
  | "ellipse"
  | "line"
  | "polygon"
  | "color_picker";

interface ArtboardState {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number; // position on infinite canvas
  y: number;
  backgroundColor: string;
  currentImageUrl?: string;
}

interface EditorStore {
  // Selection
  selectedIds: Set<string>;
  hoveredId: string | null;

  // Artboards
  activeArtboardId: string | null;
  artboards: ArtboardState[];

  // Canvas
  canvasZoom: number;
  canvasPanX: number;
  canvasPanY: number;

  // Tool
  activeTool: EditorTool;
  spaceHeld: boolean;
  activeColor: string; // for shapes/pen
  activeStroke: string;
  activeStrokeWidth: number;

  // Pen tool state
  penPoints: Array<{ x: number; y: number; cx1?: number; cy1?: number; cx2?: number; cy2?: number }>;
  isPenDrawing: boolean;

  // Undo/Redo
  undoStack: UndoAction[];
  redoStack: UndoAction[];

  // Snap/Align
  snapEnabled: boolean;
  showGrid: boolean;

  // Clipboard
  clipboard: SceneObject[];

  // Context menu
  contextMenu: { x: number; y: number; targetId: string | null } | null;

  // Actions
  select: (id: string, multi?: boolean) => void;
  selectAll: (ids: string[]) => void;
  deselect: () => void;
  toggleSelect: (id: string) => void;
  setHovered: (id: string | null) => void;

  setActiveArtboard: (id: string | null) => void;
  setArtboards: (artboards: ArtboardState[]) => void;
  updateArtboard: (id: string, updates: Partial<ArtboardState>) => void;
  addArtboard: (artboard: ArtboardState) => void;
  removeArtboard: (id: string) => void;

  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  zoomToFit: (artboardW: number, artboardH: number, containerW: number, containerH: number) => void;

  setActiveTool: (tool: EditorTool) => void;
  setSpaceHeld: (held: boolean) => void;
  setActiveColor: (color: string) => void;
  setActiveStroke: (color: string) => void;
  setActiveStrokeWidth: (width: number) => void;

  // Pen
  addPenPoint: (point: { x: number; y: number }) => void;
  resetPen: () => void;
  setIsPenDrawing: (drawing: boolean) => void;

  pushUndo: (action: UndoAction) => void;
  undo: () => void;
  redo: () => void;

  toggleSnap: () => void;
  toggleGrid: () => void;

  copyToClipboard: (objects: SceneObject[]) => void;
  getClipboard: () => SceneObject[];

  openContextMenu: (x: number, y: number, targetId: string | null) => void;
  closeContextMenu: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  selectedIds: new Set<string>(),
  hoveredId: null,
  activeArtboardId: null,
  artboards: [],
  canvasZoom: 0.5,
  canvasPanX: 0,
  canvasPanY: 0,
  activeTool: "select",
  spaceHeld: false,
  activeColor: "#3b82f6",
  activeStroke: "#000000",
  activeStrokeWidth: 2,
  penPoints: [],
  isPenDrawing: false,
  undoStack: [],
  redoStack: [],
  snapEnabled: true,
  showGrid: true,
  clipboard: [],
  contextMenu: null,

  select: (id, multi = false) => set((s) => {
    if (multi) {
      const next = new Set(s.selectedIds);
      next.add(id);
      return { selectedIds: next };
    }
    return { selectedIds: new Set([id]) };
  }),

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
  deselect: () => set({ selectedIds: new Set() }),

  toggleSelect: (id) => set((s) => {
    const next = new Set(s.selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return { selectedIds: next };
  }),

  setHovered: (id) => set({ hoveredId: id }),
  setActiveArtboard: (id) => set({ activeArtboardId: id, selectedIds: new Set() }),

  setArtboards: (artboards) => set({ artboards }),
  updateArtboard: (id, updates) => set((s) => ({
    artboards: s.artboards.map(a => a.id === id ? { ...a, ...updates } : a),
  })),
  addArtboard: (artboard) => set((s) => ({
    artboards: [...s.artboards, artboard],
  })),
  removeArtboard: (id) => set((s) => ({
    artboards: s.artboards.filter(a => a.id !== id),
    activeArtboardId: s.activeArtboardId === id ? null : s.activeArtboardId,
  })),

  setZoom: (zoom) => set({ canvasZoom: Math.max(0.05, Math.min(5, zoom)) }),
  setPan: (x, y) => set({ canvasPanX: x, canvasPanY: y }),
  zoomIn: () => set((s) => ({ canvasZoom: Math.min(5, s.canvasZoom * 1.2) })),
  zoomOut: () => set((s) => ({ canvasZoom: Math.max(0.05, s.canvasZoom / 1.2) })),
  resetView: () => set({ canvasZoom: 0.5, canvasPanX: 0, canvasPanY: 0 }),

  zoomToFit: (artboardW, artboardH, containerW, containerH) => {
    const padding = 80;
    const scaleX = (containerW - padding * 2) / artboardW;
    const scaleY = (containerH - padding * 2) / artboardH;
    const zoom = Math.min(scaleX, scaleY, 2);
    const panX = (containerW - artboardW * zoom) / 2;
    const panY = (containerH - artboardH * zoom) / 2;
    set({ canvasZoom: zoom, canvasPanX: panX, canvasPanY: panY });
  },

  setActiveTool: (tool) => set({ activeTool: tool }),
  setSpaceHeld: (held) => set({ spaceHeld: held }),
  setActiveColor: (color) => set({ activeColor: color }),
  setActiveStroke: (color) => set({ activeStroke: color }),
  setActiveStrokeWidth: (width) => set({ activeStrokeWidth: width }),

  addPenPoint: (point) => set((s) => ({ penPoints: [...s.penPoints, point] })),
  resetPen: () => set({ penPoints: [], isPenDrawing: false }),
  setIsPenDrawing: (drawing) => set({ isPenDrawing: drawing }),

  pushUndo: (action) => set((s) => ({
    undoStack: [...s.undoStack.slice(-49), action],
    redoStack: [],
  })),

  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    action.undo();
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, action],
    });
  },

  redo: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    action.redo();
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, action],
    });
  },

  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  copyToClipboard: (objects) => set({ clipboard: objects.map(o => ({ ...o })) }),
  getClipboard: () => get().clipboard,

  openContextMenu: (x, y, targetId) => set({ contextMenu: { x, y, targetId } }),
  closeContextMenu: () => set({ contextMenu: null }),
}));
