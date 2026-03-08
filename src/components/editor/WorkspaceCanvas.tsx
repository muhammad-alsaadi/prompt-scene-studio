// Workspace canvas with pan/zoom, artboard rendering, object selection
import React, { useRef, useState, useCallback } from "react";
import { useEditorStore } from "@/store/editor-store";
import { useSceneStore } from "@/store/scene-store";
import { SceneObject } from "@/types/scene";
import { usePlan } from "@/hooks/use-plan";
import { ImageIcon, Type, Box, Star, Layers } from "lucide-react";

const OBJECT_TYPE_ICONS: Record<string, typeof Box> = {
  text: Type,
  uploaded_image: ImageIcon,
  decorative: Star,
  background_element: Layers,
};

interface CanvasObjectProps {
  obj: SceneObject;
  zoom: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onHover: (id: string | null) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onResize: (id: string, w: number, h: number) => void;
}

function CanvasObject({ obj, zoom, isSelected, isHovered, onSelect, onHover, onMove, onResize }: CanvasObjectProps) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const startRef = useRef({ x: 0, y: 0, ox: 0, oy: 0, w: 0, h: 0 });

  const x = obj.x ?? 50;
  const y = obj.y ?? 50;
  const w = obj.width ?? 120;
  const h = obj.height ?? 80;
  const rotation = obj.rotation ?? 0;
  const opacity = obj.opacity ?? 1;
  const isVisible = obj.visible ?? true;
  const isLocked = obj.locked ?? false;

  if (!isVisible) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLocked) return;
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

  const handleResizeDown = (e: React.MouseEvent) => {
    if (isLocked) return;
    e.stopPropagation();
    setResizing(true);
    startRef.current = { x: e.clientX, y: e.clientY, ox: x, oy: y, w, h };

    const handleMouseMove = (e: MouseEvent) => {
      const dw = (e.clientX - startRef.current.x) / zoom;
      const dh = (e.clientY - startRef.current.y) / zoom;
      onResize(obj.id, Math.max(20, startRef.current.w + dw), Math.max(20, startRef.current.h + dh));
    };

    const handleMouseUp = () => {
      setResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const Icon = OBJECT_TYPE_ICONS[obj.objectType || ""] || Box;

  const renderContent = () => {
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
      return (
        <img src={obj.asset_url} alt={obj.name || obj.type} className="w-full h-full object-contain" />
      );
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
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        opacity,
        zIndex: obj.zIndex ?? 1,
        cursor: isLocked ? "not-allowed" : dragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => onHover(obj.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Object body */}
      <div
        className={`w-full h-full rounded border transition-colors ${
          isSelected
            ? "border-primary ring-1 ring-primary/30 bg-primary/5"
            : isHovered
              ? "border-primary/40 bg-muted/20"
              : "border-border/50 bg-card/30"
        }`}
      >
        {renderContent()}
      </div>

      {/* Resize handle */}
      {isSelected && !isLocked && (
        <div
          className="absolute -right-1 -bottom-1 w-3 h-3 bg-primary rounded-sm cursor-se-resize border border-primary-foreground"
          onMouseDown={handleResizeDown}
        />
      )}

      {/* Lock indicator */}
      {isLocked && isSelected && (
        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-warning flex items-center justify-center text-[8px] text-warning-foreground">🔒</div>
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

  // Center lines to artboard
  if (Math.abs(sCx - artboardW / 2) < threshold) {
    lines.push(<line key="vcenter" x1={artboardW / 2} y1={0} x2={artboardW / 2} y2={artboardH} stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />);
  }
  if (Math.abs(sCy - artboardH / 2) < threshold) {
    lines.push(<line key="hcenter" x1={0} y1={artboardH / 2} x2={artboardW} y2={artboardH / 2} stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />);
  }

  // Edge alignment to other objects
  objects.forEach(o => {
    if (o.id === selectedId) return;
    const ox = o.x ?? 0, oy = o.y ?? 0;
    if (Math.abs(sx - ox) < threshold) {
      lines.push(<line key={`vl-${o.id}`} x1={ox} y1={0} x2={ox} y2={artboardH} stroke="hsl(var(--destructive))" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />);
    }
    if (Math.abs(sy - oy) < threshold) {
      lines.push(<line key={`ht-${o.id}`} x1={0} y1={oy} x2={artboardW} y2={oy} stroke="hsl(var(--destructive))" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />);
    }
  });

  return (
    <svg className="absolute inset-0 pointer-events-none" width={artboardW} height={artboardH}>
      {lines}
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
  const { canvasZoom, canvasPanX, canvasPanY, setPan, setZoom, selectedIds, select, deselect, setHovered, hoveredId, snapEnabled, showGrid } = useEditorStore();
  const { currentScene, updateObject } = useSceneStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [panning, setPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(canvasZoom * delta);
    } else {
      setPan(canvasPanX - e.deltaX, canvasPanY - e.deltaY);
    }
  }, [canvasZoom, canvasPanX, canvasPanY]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Middle click or space+click for panning
    if (e.button === 1) {
      e.preventDefault();
      startPan(e);
      return;
    }

    // Click on empty canvas = deselect
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.artboard === "true") {
      deselect();
    }
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

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-hidden relative ${showGrid ? "scene-grid" : ""}`}
      style={{ cursor: panning ? "grabbing" : "default" }}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
    >
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${canvasPanX}px, ${canvasPanY}px) scale(${canvasZoom})`,
          willChange: "transform",
        }}
      >
        {/* Artboard */}
        <div
          className="relative shadow-xl rounded-sm border border-border/60"
          style={{
            width: artboardWidth,
            height: artboardHeight,
            backgroundColor: artboardBg,
            marginLeft: 100,
            marginTop: 80,
          }}
          data-artboard="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) deselect();
          }}
        >
          {/* Generated image as background */}
          {generatedImageUrl && (
            <img
              src={generatedImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-sm"
            />
          )}

          {/* Snap lines */}
          {snapEnabled && (
            <SnapLines
              objects={currentScene.objects}
              selectedId={firstSelectedId}
              artboardW={artboardWidth}
              artboardH={artboardHeight}
            />
          )}

          {/* Objects */}
          {currentScene.objects.map((obj) => (
            <CanvasObject
              key={obj.id}
              obj={obj}
              zoom={canvasZoom}
              isSelected={selectedIds.has(obj.id)}
              isHovered={hoveredId === obj.id}
              onSelect={(id, multi) => {
                select(id, multi);
                useSceneStore.getState().selectObject(id);
              }}
              onHover={setHovered}
              onMove={handleObjectMove}
              onResize={handleObjectResize}
            />
          ))}

          {/* Artboard label */}
          <div className="absolute -top-6 left-0 text-[10px] text-muted-foreground font-display font-medium">
            {artboardWidth} × {artboardHeight}
          </div>
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur border rounded-md px-2 py-1 text-[10px] text-muted-foreground font-mono z-10">
        {Math.round(canvasZoom * 100)}%
      </div>
    </div>
  );
}
