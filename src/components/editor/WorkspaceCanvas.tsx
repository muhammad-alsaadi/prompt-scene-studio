// Workspace canvas with pan/zoom, artboard rendering, object selection, context menu, drag-drop upload
import React, { useRef, useState, useCallback, useEffect } from "react";
import { useEditorStore } from "@/store/editor-store";
import { useSceneStore } from "@/store/scene-store";
import { SceneObject } from "@/types/scene";
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

  const handleResizeDown = (e: React.MouseEvent) => {
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
        className={`w-full h-full rounded border transition-colors ${
          isSelected
            ? "border-primary ring-2 ring-primary/30 bg-primary/5"
            : isHovered
              ? "border-primary/40 bg-muted/20"
              : "border-border/40 bg-card/20"
        }`}
      >
        {renderContent()}
      </div>

      {/* Selection handles */}
      {isSelected && !isLocked && (
        <>
          {/* Corner handles */}
          <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-primary rounded-sm border border-primary-foreground cursor-nw-resize" />
          <div className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-primary rounded-sm border border-primary-foreground cursor-ne-resize" />
          <div className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-sm border border-primary-foreground cursor-sw-resize" />
          <div
            className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-sm border border-primary-foreground cursor-se-resize"
            onMouseDown={handleResizeDown}
          />
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

  if (hasSelection) {
    if (!targetObj) items.push({ label: "", icon: Box, action: () => {}, separator: true });
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

  if (!targetObj && !hasSelection && clipboard.length === 0) {
    items.push({
      label: "Add Object",
      icon: Box,
      action: () => {
        addObject({ type: "object", objectType: "generic", x: 100, y: 100, width: 120, height: 80 });
        closeContextMenu();
      },
    });
    items.push({
      label: "Add Text",
      icon: Type,
      action: () => {
        addObject({ type: "text", objectType: "text", textContent: "Edit me", x: 100, y: 100, width: 200, height: 40, fontSize: 16 });
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
        if (item.separator) {
          return <div key={`sep-${i}`} className="h-px bg-border my-1" />;
        }
        return (
          <button
            key={item.label}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors ${
              item.danger ? "text-destructive hover:text-destructive" : ""
            } ${item.disabled ? "opacity-40 pointer-events-none" : ""}`}
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
    zoomToFit,
  } = useEditorStore();
  const { currentScene, updateObject, addObject } = useSceneStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [panning, setPanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const [fitted, setFitted] = useState(false);

  // Auto zoom-to-fit on first render
  useEffect(() => {
    if (!fitted && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      zoomToFit(artboardWidth, artboardHeight, rect.width, rect.height);
      setFitted(true);
    }
  }, [artboardWidth, artboardHeight, fitted]);

  const isInPanMode = spaceHeld || panning;

  // Wheel: ctrl/meta = zoom, otherwise = pan
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      const newZoom = Math.max(0.05, Math.min(5, canvasZoom * factor));
      // Zoom toward cursor
      const newPanX = mouseX - (mouseX - canvasPanX) * (newZoom / canvasZoom);
      const newPanY = mouseY - (mouseY - canvasPanY) * (newZoom / canvasZoom);
      setZoom(newZoom);
      setPan(newPanX, newPanY);
    } else {
      setPan(canvasPanX - e.deltaX, canvasPanY - e.deltaY);
    }
  }, [canvasZoom, canvasPanX, canvasPanY]);

  // Attach wheel with { passive: false } to prevent page scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    closeContextMenu();

    // Middle click or space held = panning
    if (e.button === 1 || (e.button === 0 && spaceHeld)) {
      e.preventDefault();
      startPan(e);
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

  // ─── Drag & Drop Image Upload ─────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setDragOver(true);
    }
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

    // Calculate drop position relative to artboard
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

        // Get image dimensions
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
        console.error("Upload error:", err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  }, [canvasZoom, canvasPanX, canvasPanY, addObject]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-hidden relative ${showGrid ? "scene-grid" : ""} ${dragOver ? "ring-2 ring-primary ring-inset" : ""}`}
      style={{ cursor: isInPanMode ? (panning ? "grabbing" : "grab") : "default" }}
      onMouseDown={handleCanvasMouseDown}
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
        {/* Artboard */}
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
            if (e.button === 0 && !spaceHeld && e.target === e.currentTarget) {
              deselect();
              useSceneStore.getState().selectObject(null);
            }
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

          {/* Artboard label */}
          <div className="absolute -top-7 left-0 text-[11px] text-muted-foreground font-display font-medium whitespace-nowrap">
            {artboardWidth} × {artboardHeight}
          </div>
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur border rounded-md px-2.5 py-1.5 text-[10px] text-muted-foreground font-mono z-10 select-none">
        {Math.round(canvasZoom * 100)}%
      </div>

      {/* Context menu */}
      <CanvasContextMenu />
    </div>
  );
}
