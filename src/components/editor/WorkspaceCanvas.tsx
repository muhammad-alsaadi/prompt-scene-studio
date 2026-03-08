// Workspace canvas with pan/zoom, multi-artboard, vector tools, object selection, context menu, drag-drop
import React, { useRef, useState, useCallback, useEffect } from "react";
import { useEditorStore } from "@/store/editor-store";
import { useSceneStore } from "@/store/scene-store";
import { SceneObject, PathPoint } from "@/types/scene";
import { usePlan } from "@/hooks/use-plan";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ImageIcon, Type, Box, Star, Layers, Copy, Trash2, Lock, Unlock,
  Eye, EyeOff, ArrowUp, ArrowDown, Scissors, ClipboardPaste,
} from "lucide-react";

const OBJECT_TYPE_ICONS: Record<string, typeof Box> = {
  text: Type,
  uploaded_image: ImageIcon,
  decorative: Star,
  background_element: Layers,
};

// ─── Vector Shape Renderer ────────────────────────────────────────

function VectorShapeContent({ obj }: { obj: SceneObject }) {
  const w = obj.width ?? 120;
  const h = obj.height ?? 80;

  if (obj.objectType === "rectangle") {
    return (
      <svg width={w} height={h} className="w-full h-full">
        <rect
          x={obj.strokeWidth ? (obj.strokeWidth / 2) : 1}
          y={obj.strokeWidth ? (obj.strokeWidth / 2) : 1}
          width={w - (obj.strokeWidth || 2)}
          height={h - (obj.strokeWidth || 2)}
          rx={obj.borderRadius ?? 0}
          fill={obj.fill || "#3b82f6"}
          stroke={obj.stroke || "transparent"}
          strokeWidth={obj.strokeWidth ?? 0}
        />
      </svg>
    );
  }

  if (obj.objectType === "ellipse") {
    return (
      <svg width={w} height={h} className="w-full h-full">
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={w / 2 - (obj.strokeWidth ?? 2) / 2}
          ry={h / 2 - (obj.strokeWidth ?? 2) / 2}
          fill={obj.fill || "#3b82f6"}
          stroke={obj.stroke || "transparent"}
          strokeWidth={obj.strokeWidth ?? 0}
        />
      </svg>
    );
  }

  if (obj.objectType === "line") {
    return (
      <svg width={w} height={h} className="w-full h-full">
        <line
          x1={0}
          y1={h / 2}
          x2={w}
          y2={h / 2}
          stroke={obj.stroke || "#000000"}
          strokeWidth={obj.strokeWidth ?? 2}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (obj.objectType === "pen_path" && obj.points && obj.points.length > 1) {
    const pts = obj.points;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      const prev = pts[i - 1];
      if (p.cx1 !== undefined && p.cy1 !== undefined) {
        d += ` C ${prev.cx2 ?? prev.x} ${prev.cy2 ?? prev.y} ${p.cx1} ${p.cy1} ${p.x} ${p.y}`;
      } else {
        d += ` L ${p.x} ${p.y}`;
      }
    }
    if (obj.pathClosed) d += " Z";

    return (
      <svg width={w} height={h} className="w-full h-full" viewBox={`0 0 ${w} ${h}`}>
        <path
          d={d}
          fill={obj.fill || "none"}
          stroke={obj.stroke || "#000000"}
          strokeWidth={obj.strokeWidth ?? 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Show anchor points */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="hsl(var(--primary))" stroke="white" strokeWidth={1} />
        ))}
      </svg>
    );
  }

  return null;
}

// ─── Canvas Object ────────────────────────────────────────────────

interface CanvasObjectProps {
  obj: SceneObject;
  zoom: number;
  isSelected: boolean;
  isHovered: boolean;
  isPanning: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onHover: (id: string | null) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onResize: (id: string, w: number, h: number) => void;
}

function CanvasObject({ obj, zoom, isSelected, isHovered, isPanning, onSelect, onHover, onMove, onResize }: CanvasObjectProps) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0, ox: 0, oy: 0, w: 0, h: 0 });

  const x = obj.x ?? 50;
  const y = obj.y ?? 50;
  const w = obj.width ?? 120;
  const h = obj.height ?? 80;
  const rotation = obj.rotation ?? 0;
  const opacity = obj.opacity ?? 1;
  const isVisible = obj.visible ?? true;
  const isLocked = obj.locked ?? false;
  const isVector = ["rectangle", "ellipse", "line", "pen_path", "polygon"].includes(obj.objectType || "");

  if (!isVisible) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLocked || isPanning) return;
    e.stopPropagation();
    onSelect(obj.id, e.shiftKey);
    setDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY, ox: x, oy: y, w, h };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - startRef.current.x) / zoom;
      const dy = (e.clientY - startRef.current.y) / zoom;
      onMove(obj.id, startRef.current.ox + dx, startRef.current.oy + dy);
    };

    const handleMouseUp = () => {
      setDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeDown = (e: React.MouseEvent, corner: string) => {
    if (isLocked || isPanning) return;
    e.stopPropagation();
    startRef.current = { x: e.clientX, y: e.clientY, ox: x, oy: y, w, h };

    const handleMouseMove = (e: MouseEvent) => {
      const dw = (e.clientX - startRef.current.x) / zoom;
      const dh = (e.clientY - startRef.current.y) / zoom;
      onResize(obj.id, Math.max(20, startRef.current.w + dw), Math.max(20, startRef.current.h + dh));
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const Icon = OBJECT_TYPE_ICONS[obj.objectType || ""] || Box;

  const renderContent = () => {
    // Vector shapes
    if (isVector) {
      return <VectorShapeContent obj={obj} />;
    }

    if (obj.objectType === "text" && obj.textContent) {
      return (
        <div
          className="w-full h-full flex items-center justify-center p-2 overflow-hidden"
          style={{
            textAlign: obj.textAlignment || "center",
            fontSize: obj.fontSize ? `${obj.fontSize}px` : "14px",
            fontWeight: obj.fontWeight || "normal",
            color: obj.textColor || "hsl(var(--foreground))",
            fontFamily: obj.fontFamily || "inherit",
          }}
        >
          {obj.textContent}
        </div>
      );
    }

    if (obj.objectType === "uploaded_image" && obj.asset_url) {
      return <img src={obj.asset_url} alt={obj.name || obj.type} className="w-full h-full object-contain" />;
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground/50">
        <Icon className="h-5 w-5" />
        <span className="text-[9px] truncate max-w-full px-1 capitalize">{obj.name || obj.type}</span>
      </div>
    );
  };

  return (
    <div
      className="absolute"
      data-scene-object
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        opacity,
        zIndex: obj.zIndex ?? 1,
        mixBlendMode: (obj.blendMode as any) || "normal",
        cursor: isLocked ? "not-allowed" : isPanning ? "grab" : dragging ? "grabbing" : "default",
        pointerEvents: isPanning ? "none" : "auto",
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isPanning && onHover(obj.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className={`w-full h-full rounded transition-colors ${
          isVector ? "" : (
            isSelected
              ? "border border-primary ring-2 ring-primary/30 bg-primary/5"
              : isHovered
                ? "border border-primary/40 bg-muted/20"
                : "border border-border/40 bg-card/20"
          )
        }`}
      >
        {renderContent()}
      </div>

      {/* Selection handles */}
      {isSelected && !isLocked && (
        <>
          <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-primary rounded-sm border border-primary-foreground cursor-nw-resize" />
          <div className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-primary rounded-sm border border-primary-foreground cursor-ne-resize" />
          <div className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-sm border border-primary-foreground cursor-sw-resize" />
          <div
            className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-sm border border-primary-foreground cursor-se-resize"
            onMouseDown={(e) => handleResizeDown(e, "se")}
          />
          {/* Selection border for vector shapes */}
          {isVector && (
            <div className="absolute inset-0 border-2 border-primary/60 rounded pointer-events-none" />
          )}
        </>
      )}

      {isLocked && isSelected && (
        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-warning flex items-center justify-center text-[8px]">🔒</div>
      )}
    </div>
  );
}

// ─── Snap Lines ────────────────────────────────────────────────────

function SnapLines({ objects, selectedId, artboardW, artboardH }: {
  objects: SceneObject[];
  selectedId: string | null;
  artboardW: number;
  artboardH: number;
}) {
  if (!selectedId) return null;
  const sel = objects.find(o => o.id === selectedId);
  if (!sel) return null;

  const sx = sel.x ?? 0, sy = sel.y ?? 0;
  const sw = sel.width ?? 120, sh = sel.height ?? 80;
  const sCx = sx + sw / 2, sCy = sy + sh / 2;

  const lines: React.ReactNode[] = [];
  const threshold = 5;

  if (Math.abs(sCx - artboardW / 2) < threshold) {
    lines.push(<line key="vcenter" x1={artboardW / 2} y1={0} x2={artboardW / 2} y2={artboardH} stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />);
  }
  if (Math.abs(sCy - artboardH / 2) < threshold) {
    lines.push(<line key="hcenter" x1={0} y1={artboardH / 2} x2={artboardW} y2={artboardH / 2} stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />);
  }

  return (
    <svg className="absolute inset-0 pointer-events-none" width={artboardW} height={artboardH}>
      {lines}
    </svg>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────

function CanvasContextMenu() {
  const { contextMenu, closeContextMenu, selectedIds, copyToClipboard, clipboard } = useEditorStore();
  const { currentScene, removeObject, duplicateObject, toggleObjectVisibility, toggleObjectLock, reorderObject, addObject } = useSceneStore();

  useEffect(() => {
    const handler = () => closeContextMenu();
    if (contextMenu) {
      window.addEventListener("click", handler);
      window.addEventListener("keydown", handler);
    }
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
    };
  }, [contextMenu]);

  if (!contextMenu) return null;

  const targetObj = contextMenu.targetId ? currentScene.objects.find(o => o.id === contextMenu.targetId) : null;
  const hasSelection = selectedIds.size > 0;

  const items: { label: string; icon: typeof Box; action: () => void; danger?: boolean; disabled?: boolean; separator?: boolean }[] = [];

  if (targetObj) {
    items.push({ label: "Duplicate", icon: Copy, action: () => { duplicateObject(targetObj.id); closeContextMenu(); } });
    items.push({ label: "Delete", icon: Trash2, action: () => { removeObject(targetObj.id); closeContextMenu(); }, danger: true });
    items.push({ label: "", icon: Box, action: () => {}, separator: true });
    items.push({ label: targetObj.locked ? "Unlock" : "Lock", icon: targetObj.locked ? Unlock : Lock, action: () => { toggleObjectLock(targetObj.id); closeContextMenu(); } });
    items.push({ label: (targetObj.visible ?? true) ? "Hide" : "Show", icon: (targetObj.visible ?? true) ? EyeOff : Eye, action: () => { toggleObjectVisibility(targetObj.id); closeContextMenu(); } });
    items.push({ label: "", icon: Box, action: () => {}, separator: true });
    items.push({ label: "Bring Forward", icon: ArrowUp, action: () => { reorderObject(targetObj.id, "up"); closeContextMenu(); } });
    items.push({ label: "Send Backward", icon: ArrowDown, action: () => { reorderObject(targetObj.id, "down"); closeContextMenu(); } });
  }

  if (hasSelection && !targetObj) {
    items.push({
      label: "Copy",
      icon: Scissors,
      action: () => {
        const objs = currentScene.objects.filter(o => selectedIds.has(o.id));
        copyToClipboard(objs);
        closeContextMenu();
      },
    });
  }

  if (clipboard.length > 0) {
    items.push({
      label: "Paste",
      icon: ClipboardPaste,
      action: () => {
        clipboard.forEach(obj => {
          addObject({ ...obj, id: undefined as any, x: (obj.x ?? 100) + 20, y: (obj.y ?? 100) + 20 });
        });
        closeContextMenu();
      },
    });
  }

  return (
    <div
      className="fixed z-[100] min-w-[160px] rounded-lg border bg-popover shadow-lg py-1 animate-in fade-in-0 zoom-in-95"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => {
        if (item.separator) return <div key={`sep-${i}`} className="h-px bg-border my-1" />;
        return (
          <button
            key={item.label}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors ${
              item.danger ? "text-destructive" : ""
            }`}
            onClick={item.action}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Pen Tool Preview ─────────────────────────────────────────────

function PenToolPreview({ zoom }: { zoom: number }) {
  const { penPoints, isPenDrawing, activeStroke, activeStrokeWidth } = useEditorStore();

  if (!isPenDrawing || penPoints.length === 0) return null;

  let d = `M ${penPoints[0].x} ${penPoints[0].y}`;
  for (let i = 1; i < penPoints.length; i++) {
    d += ` L ${penPoints[i].x} ${penPoints[i].y}`;
  }

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
      <path d={d} fill="none" stroke={activeStroke} strokeWidth={activeStrokeWidth / zoom} strokeDasharray="4 2" />
      {penPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4 / zoom} fill="hsl(var(--primary))" stroke="white" strokeWidth={1 / zoom} />
      ))}
    </svg>
  );
}

// ─── Main Canvas ──────────────────────────────────────────────────

interface WorkspaceCanvasProps {
  artboardWidth?: number;
  artboardHeight?: number;
  artboardBg?: string;
  generatedImageUrl?: string | null;
}

export function WorkspaceCanvas({ artboardWidth = 1024, artboardHeight = 1024, artboardBg = "#ffffff", generatedImageUrl }: WorkspaceCanvasProps) {
  const {
    canvasZoom, canvasPanX, canvasPanY, setPan, setZoom, selectedIds, select, deselect,
    setHovered, hoveredId, snapEnabled, showGrid, spaceHeld, openContextMenu, closeContextMenu,
    zoomToFit, activeTool, artboards, activeArtboardId, setActiveArtboard, updateArtboard,
    activeColor, activeStroke, activeStrokeWidth,
    addPenPoint, resetPen, penPoints, isPenDrawing, setIsPenDrawing,
  } = useEditorStore();
  const { currentScene, updateObject, addObject } = useSceneStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [panning, setPanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawPreview, setDrawPreview] = useState<{ w: number; h: number } | null>(null);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const [fitted, setFitted] = useState(false);
  const [editingArtboardName, setEditingArtboardName] = useState<string | null>(null);

  // Auto zoom-to-fit on first render
  useEffect(() => {
    if (!fitted && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      zoomToFit(artboardWidth, artboardHeight, rect.width, rect.height);
      setFitted(true);
    }
  }, [artboardWidth, artboardHeight, fitted]);

  const isInPanMode = spaceHeld || panning || activeTool === "hand";
  const isDrawingTool = ["rectangle", "ellipse", "line"].includes(activeTool);
  const isPenTool = activeTool === "pen";

  // Wheel handler
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      const newZoom = Math.max(0.05, Math.min(5, canvasZoom * factor));
      const newPanX = mouseX - (mouseX - canvasPanX) * (newZoom / canvasZoom);
      const newPanY = mouseY - (mouseY - canvasPanY) * (newZoom / canvasZoom);
      setZoom(newZoom);
      setPan(newPanX, newPanY);
    } else {
      setPan(canvasPanX - e.deltaX, canvasPanY - e.deltaY);
    }
  }, [canvasZoom, canvasPanX, canvasPanY]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const getCanvasPoint = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left - canvasPanX) / canvasZoom,
      y: (e.clientY - rect.top - canvasPanY) / canvasZoom,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    closeContextMenu();

    // Middle click or space held = panning
    if (e.button === 1 || (e.button === 0 && (spaceHeld || activeTool === "hand"))) {
      e.preventDefault();
      startPan(e);
      return;
    }

    // Drawing tools
    if (e.button === 0 && isDrawingTool) {
      const pt = getCanvasPoint(e);
      setDrawStart(pt);
      setDrawPreview({ w: 0, h: 0 });

      const handleMove = (me: MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect || !pt) return;
        const cx = (me.clientX - rect.left - canvasPanX) / canvasZoom;
        const cy = (me.clientY - rect.top - canvasPanY) / canvasZoom;
        setDrawPreview({ w: cx - pt.x, h: cy - pt.y });
      };

      const handleUp = (me: MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect || !pt) { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); return; }
        const cx = (me.clientX - rect.left - canvasPanX) / canvasZoom;
        const cy = (me.clientY - rect.top - canvasPanY) / canvasZoom;
        const w = Math.abs(cx - pt.x);
        const h = Math.abs(cy - pt.y);
        if (w > 5 || h > 5) {
          const objX = Math.min(pt.x, cx);
          const objY = Math.min(pt.y, cy);
          addObject({
            type: activeTool,
            objectType: activeTool as any,
            name: activeTool.charAt(0).toUpperCase() + activeTool.slice(1),
            x: objX,
            y: objY,
            width: Math.max(w, 10),
            height: activeTool === "line" ? Math.max(h, 4) : Math.max(h, 10),
            fill: activeTool === "line" ? "transparent" : activeColor,
            stroke: activeStroke,
            strokeWidth: activeStrokeWidth,
          });
        }
        setDrawStart(null);
        setDrawPreview(null);
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
      return;
    }

    // Pen tool
    if (e.button === 0 && isPenTool) {
      const pt = getCanvasPoint(e);
      if (!isPenDrawing) {
        setIsPenDrawing(true);
        resetPen();
      }
      addPenPoint(pt);
      return;
    }

    // Click on empty canvas = deselect
    if (e.button === 0) {
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.artboard === "true") {
        deselect();
        useSceneStore.getState().selectObject(null);
      }
    }
  };

  // Double-click to finish pen path
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isPenTool && isPenDrawing && penPoints.length >= 2) {
      // Create pen path object
      const xs = penPoints.map(p => p.x);
      const ys = penPoints.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      const normalizedPoints = penPoints.map(p => ({
        x: p.x - minX,
        y: p.y - minY,
      }));

      addObject({
        type: "pen_path",
        objectType: "pen_path",
        name: "Path",
        x: minX,
        y: minY,
        width: Math.max(maxX - minX, 20),
        height: Math.max(maxY - minY, 20),
        points: normalizedPoints,
        pathClosed: false,
        fill: "transparent",
        stroke: activeStroke,
        strokeWidth: activeStrokeWidth,
      });

      resetPen();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, null);
  };

  const handleObjectContextMenu = (e: React.MouseEvent, objId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedIds.has(objId)) {
      select(objId);
      useSceneStore.getState().selectObject(objId);
    }
    openContextMenu(e.clientX, e.clientY, objId);
  };

  const startPan = (e: React.MouseEvent) => {
    setPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, px: canvasPanX, py: canvasPanY };

    const onMove = (e: MouseEvent) => {
      setPan(
        panStart.current.px + (e.clientX - panStart.current.x),
        panStart.current.py + (e.clientY - panStart.current.y),
      );
    };

    const onUp = () => {
      setPanning(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleObjectMove = (id: string, x: number, y: number) => {
    let snapX = x, snapY = y;
    if (snapEnabled) {
      const gridSize = 8;
      snapX = Math.round(x / gridSize) * gridSize;
      snapY = Math.round(y / gridSize) * gridSize;
    }
    updateObject(id, { x: snapX, y: snapY });
  };

  const handleObjectResize = (id: string, w: number, h: number) => {
    updateObject(id, { width: Math.round(w), height: Math.round(h) });
  };

  const firstSelectedId = selectedIds.size === 1 ? Array.from(selectedIds)[0] : null;

  // ─── Artboard drag/resize handlers ────────────────────────────
  const artboardDragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handleArtboardHeaderDrag = (e: React.MouseEvent, abId: string) => {
    e.stopPropagation();
    const ab = artboards.find(a => a.id === abId);
    if (!ab) return;
    setActiveArtboard(abId);
    artboardDragRef.current = { id: abId, startX: e.clientX, startY: e.clientY, origX: ab.x, origY: ab.y };

    const onMove = (me: MouseEvent) => {
      if (!artboardDragRef.current) return;
      const dx = (me.clientX - artboardDragRef.current.startX) / canvasZoom;
      const dy = (me.clientY - artboardDragRef.current.startY) / canvasZoom;
      updateArtboard(abId, {
        x: artboardDragRef.current.origX + dx,
        y: artboardDragRef.current.origY + dy,
      });
    };

    const onUp = () => {
      artboardDragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleArtboardResize = (e: React.MouseEvent, abId: string) => {
    e.stopPropagation();
    const ab = artboards.find(a => a.id === abId);
    if (!ab) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const origW = ab.width;
    const origH = ab.height;

    const onMove = (me: MouseEvent) => {
      const dw = (me.clientX - startX) / canvasZoom;
      const dh = (me.clientY - startY) / canvasZoom;
      updateArtboard(abId, {
        width: Math.max(100, Math.round(origW + dw)),
        height: Math.max(100, Math.round(origH + dh)),
      });
    };

    const onUp = async () => {
      // Persist artboard size change
      const updated = useEditorStore.getState().artboards.find(a => a.id === abId);
      if (updated) {
        await supabase.from("artboards").update({ width: updated.width, height: updated.height }).eq("id", abId);
      }
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleArtboardNameSubmit = async (abId: string, newName: string) => {
    setEditingArtboardName(null);
    updateArtboard(abId, { name: newName });
    await supabase.from("artboards").update({ name: newName }).eq("id", abId);
  };

  // ─── Drag & Drop Image Upload ─────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in to upload images"); return; }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dropX = (e.clientX - rect.left - canvasPanX) / canvasZoom;
    const dropY = (e.clientY - rect.top - canvasPanY) / canvasZoom;

    for (const file of files.slice(0, 5)) {
      try {
        const ext = file.name.split(".").pop() || "png";
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("generated-images")
          .upload(fileName, file, { contentType: file.type });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("generated-images")
          .getPublicUrl(fileName);

        const img = new Image();
        const url = urlData.publicUrl;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        });

        const natW = img.naturalWidth || 300;
        const natH = img.naturalHeight || 300;
        const maxDim = 400;
        const scale = Math.min(maxDim / natW, maxDim / natH, 1);
        const w = Math.round(natW * scale);
        const h = Math.round(natH * scale);

        addObject({
          type: "uploaded_image",
          objectType: "uploaded_image",
          name: file.name.replace(/\.[^.]+$/, ""),
          asset_url: url,
          native_width: natW,
          native_height: natH,
          x: Math.max(0, dropX - w / 2),
          y: Math.max(0, dropY - h / 2),
          width: w,
          height: h,
        });

        toast.success(`Added "${file.name}"`);
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  }, [canvasZoom, canvasPanX, canvasPanY, addObject]);

  // Determine cursor
  const getCursor = () => {
    if (isInPanMode) return panning ? "grabbing" : "grab";
    if (isDrawingTool) return "crosshair";
    if (isPenTool) return "crosshair";
    if (activeTool === "color_picker") return "crosshair";
    return "default";
  };

  // Render artboards if available, otherwise single artboard
  const renderArtboards = () => {
    if (artboards.length > 0) {
      return artboards.map(ab => {
        const isActive = activeArtboardId === ab.id;
        return (
          <div
            key={ab.id}
            className="absolute"
            style={{ left: ab.x, top: ab.y }}
          >
            {/* Artboard name header — draggable */}
            <div
              className={`absolute -top-7 left-0 right-0 flex items-center gap-1 cursor-move select-none`}
              onMouseDown={(e) => handleArtboardHeaderDrag(e, ab.id)}
            >
              {editingArtboardName === ab.id ? (
                <input
                  autoFocus
                  defaultValue={ab.name}
                  className="text-[11px] font-display font-medium bg-transparent border-b border-primary outline-none text-foreground w-full"
                  onBlur={(e) => handleArtboardNameSubmit(ab.id, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleArtboardNameSubmit(ab.id, (e.target as HTMLInputElement).value); }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className={`text-[11px] font-display font-medium whitespace-nowrap ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  onDoubleClick={(e) => { e.stopPropagation(); setEditingArtboardName(ab.id); }}
                >
                  {ab.name}
                </span>
              )}
              <span className="text-[9px] text-muted-foreground tabular-nums ml-auto">{ab.width}×{ab.height}</span>
            </div>

            {/* Artboard body */}
            <div
              className={`relative shadow-xl rounded-sm ${isActive ? "ring-2 ring-primary/30" : ""}`}
              style={{
                width: ab.width,
                height: ab.height,
                backgroundColor: ab.backgroundColor || "#ffffff",
                boxShadow: "0 4px 40px rgba(0,0,0,0.12)",
              }}
              data-artboard="true"
              onClick={() => setActiveArtboard(ab.id)}
              onMouseDown={(e) => {
                if (e.button === 0 && !spaceHeld && activeTool === "select" && e.target === e.currentTarget) {
                  deselect();
                  useSceneStore.getState().selectObject(null);
                  setActiveArtboard(ab.id);
                }
              }}
            >
              {/* Generated image */}
              {isActive && generatedImageUrl && (
                <img src={generatedImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-sm" />
              )}

              {/* Snap lines */}
              {isActive && snapEnabled && (
                <SnapLines objects={currentScene.objects} selectedId={firstSelectedId} artboardW={ab.width} artboardH={ab.height} />
              )}

              {/* Objects (only on active artboard) */}
              {isActive && currentScene.objects.map((obj) => (
                <div key={obj.id} onContextMenu={(e) => handleObjectContextMenu(e, obj.id)}>
                  <CanvasObject
                    obj={obj}
                    zoom={canvasZoom}
                    isSelected={selectedIds.has(obj.id)}
                    isHovered={hoveredId === obj.id}
                    isPanning={isInPanMode}
                    onSelect={(id, multi) => {
                      select(id, multi);
                      useSceneStore.getState().selectObject(id);
                    }}
                    onHover={setHovered}
                    onMove={handleObjectMove}
                    onResize={handleObjectResize}
                  />
                </div>
              ))}

              {/* Pen preview */}
              {isActive && <PenToolPreview zoom={canvasZoom} />}
            </div>

            {/* Resize handles on bounding box */}
            <div
              className="absolute -right-2 -bottom-2 w-4 h-4 bg-primary/80 rounded-sm cursor-se-resize border border-primary-foreground hover:bg-primary"
              onMouseDown={(e) => handleArtboardResize(e, ab.id)}
            />
            <div
              className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-6 bg-border/80 rounded-sm cursor-e-resize hover:bg-primary/60"
              onMouseDown={(e) => {
                e.stopPropagation();
                const startX = e.clientX;
                const origW = ab.width;
                const onMove = (me: MouseEvent) => {
                  const dw = (me.clientX - startX) / canvasZoom;
                  updateArtboard(ab.id, { width: Math.max(100, Math.round(origW + dw)) });
                };
                const onUp = async () => {
                  const updated = useEditorStore.getState().artboards.find(a => a.id === ab.id);
                  if (updated) await supabase.from("artboards").update({ width: updated.width }).eq("id", ab.id);
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-2 h-3 w-6 bg-border/80 rounded-sm cursor-s-resize hover:bg-primary/60"
              onMouseDown={(e) => {
                e.stopPropagation();
                const startY = e.clientY;
                const origH = ab.height;
                const onMove = (me: MouseEvent) => {
                  const dh = (me.clientY - startY) / canvasZoom;
                  updateArtboard(ab.id, { height: Math.max(100, Math.round(origH + dh)) });
                };
                const onUp = async () => {
                  const updated = useEditorStore.getState().artboards.find(a => a.id === ab.id);
                  if (updated) await supabase.from("artboards").update({ height: updated.height }).eq("id", ab.id);
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            />
          </div>
        );
      });
    }

    // Fallback: single artboard
    return (
      <div
        className="relative shadow-xl rounded-sm"
        style={{
          width: artboardWidth,
          height: artboardHeight,
          backgroundColor: artboardBg,
          boxShadow: "0 4px 40px rgba(0,0,0,0.12)",
        }}
        data-artboard="true"
        onMouseDown={(e) => {
          if (e.button === 0 && !spaceHeld && activeTool === "select" && e.target === e.currentTarget) {
            deselect();
            useSceneStore.getState().selectObject(null);
          }
        }}
      >
        {generatedImageUrl && (
          <img src={generatedImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-sm" />
        )}
        {snapEnabled && (
          <SnapLines objects={currentScene.objects} selectedId={firstSelectedId} artboardW={artboardWidth} artboardH={artboardHeight} />
        )}
        {currentScene.objects.map((obj) => (
          <div key={obj.id} onContextMenu={(e) => handleObjectContextMenu(e, obj.id)}>
            <CanvasObject
              obj={obj}
              zoom={canvasZoom}
              isSelected={selectedIds.has(obj.id)}
              isHovered={hoveredId === obj.id}
              isPanning={isInPanMode}
              onSelect={(id, multi) => {
                select(id, multi);
                useSceneStore.getState().selectObject(id);
              }}
              onHover={setHovered}
              onMove={handleObjectMove}
              onResize={handleObjectResize}
            />
          </div>
        ))}
        <PenToolPreview zoom={canvasZoom} />
        <div className="absolute -top-7 left-0 text-[11px] text-muted-foreground font-display font-medium whitespace-nowrap">
          {artboardWidth} × {artboardHeight}
        </div>
      </div>
    );
  };

  // Drawing preview overlay
  const drawingPreviewOverlay = drawStart && drawPreview && (
    <div
      className="absolute pointer-events-none border-2 border-primary/60"
      style={{
        left: drawPreview.w >= 0 ? drawStart.x : drawStart.x + drawPreview.w,
        top: drawPreview.h >= 0 ? drawStart.y : drawStart.y + drawPreview.h,
        width: Math.abs(drawPreview.w),
        height: Math.abs(drawPreview.h),
        borderRadius: activeTool === "ellipse" ? "50%" : 0,
        backgroundColor: activeTool === "line" ? "transparent" : `${activeColor}33`,
      }}
    />
  );

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-hidden relative canvas-cursor ${showGrid ? "scene-grid" : ""} ${dragOver ? "ring-2 ring-primary ring-inset" : ""}`}
      style={{ cursor: getCursor() }}
      onMouseDown={handleCanvasMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${canvasPanX}px, ${canvasPanY}px) scale(${canvasZoom})`,
          willChange: "transform",
        }}
      >
        {renderArtboards()}
        {drawingPreviewOverlay}
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur border rounded-md px-2.5 py-1.5 text-[10px] text-muted-foreground font-mono z-10 select-none">
        {Math.round(canvasZoom * 100)}%
      </div>

      <CanvasContextMenu />
    </div>
  );
}
