// Left sidebar: Artboard list + Layer/Object navigator
import React, { useState } from "react";
import { useSceneStore } from "@/store/scene-store";
import { useEditorStore } from "@/store/editor-store";
import { usePlan } from "@/hooks/use-plan";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { PRESET_OBJECTS } from "@/lib/scene-utils";
import { ARTBOARD_PRESETS } from "@/lib/artboard-presets";
import { SceneObject, ObjectType } from "@/types/scene";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Plus, Trash2, Box, Eye, EyeOff, Lock, Unlock, Copy, Type, Image as ImageIcon,
  Star, Layers, ChevronDown, ChevronRight, GripVertical, LayoutGrid, Sparkles,
} from "lucide-react";

// ─── Object Type Icons ────────────────────────────────────────────

const OBJ_ICONS: Record<string, typeof Box> = {
  generic: Box,
  text: Type,
  uploaded_image: ImageIcon,
  decorative: Star,
  subject: Sparkles,
  background_element: Layers,
};

function getObjIcon(obj: SceneObject) {
  return OBJ_ICONS[obj.objectType || "generic"] || Box;
}

// ─── Layer Row ────────────────────────────────────────────────────

function LayerRow({ obj, index }: { obj: SceneObject; index: number }) {
  const { removeObject, toggleObjectVisibility, toggleObjectLock, duplicateObject, selectObject, selectedObjectId } = useSceneStore();
  const { selectedIds, select, toggleSelect, setHovered } = useEditorStore();
  const { features, requireFeature } = usePlan();

  const isSelected = selectedIds.has(obj.id) || selectedObjectId === obj.id;
  const isVisible = obj.visible ?? true;
  const isLocked = obj.locked ?? false;
  const Icon = getObjIcon(obj);

  return (
    <div
      className={`group flex items-center gap-1 px-1.5 py-1 rounded-md cursor-pointer transition-all text-[11px] ${
        isSelected ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "hover:bg-secondary/60"
      } ${!isVisible ? "opacity-40" : ""}`}
      onClick={(e) => {
        if (e.shiftKey) {
          toggleSelect(obj.id);
        } else {
          select(obj.id);
          selectObject(obj.id);
        }
      }}
      onMouseEnter={() => setHovered(obj.id)}
      onMouseLeave={() => setHovered(null)}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground/30 shrink-0 opacity-0 group-hover:opacity-100 cursor-grab" />
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate font-medium capitalize">
        {obj.name || obj.type || `Object ${index + 1}`}
      </span>

      <div className="flex items-center gap-px opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-0.5 rounded hover:bg-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!requireFeature("lockHideObjects", "Visibility toggle")) return;
                  toggleObjectVisibility(obj.id);
                }}
              >
                {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[10px]">Toggle visibility</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-0.5 rounded hover:bg-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!requireFeature("lockHideObjects", "Lock toggle")) return;
                  toggleObjectLock(obj.id);
                }}
              >
                {isLocked ? <Lock className="h-3 w-3 text-warning" /> : <Unlock className="h-3 w-3" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[10px]">Toggle lock</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-0.5 rounded hover:bg-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!requireFeature("duplicateObjects", "Duplicate")) return;
                  duplicateObject(obj.id);
                }}
              >
                <Copy className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[10px]">Duplicate</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-0.5 rounded hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[10px]">Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// ─── Add Object Menu ──────────────────────────────────────────────

function AddObjectMenu({ onClose }: { onClose: () => void }) {
  const { addObject } = useSceneStore();
  const { features } = usePlan();

  const objectTypes: { type: ObjectType; label: string; icon: typeof Box }[] = [
    { type: "generic", label: "Object", icon: Box },
    { type: "text", label: "Text", icon: Type },
    { type: "subject", label: "Subject", icon: Sparkles },
    { type: "decorative", label: "Decorative", icon: Star },
    { type: "background_element", label: "Background", icon: Layers },
  ];

  const handleAdd = (objType: ObjectType) => {
    const defaults: Partial<SceneObject> = {
      objectType: objType,
      type: objType === "text" ? "text" : objType === "generic" ? "object" : objType,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: objType === "text" ? 200 : 120,
      height: objType === "text" ? 40 : 80,
    };

    if (objType === "text") {
      defaults.textContent = "Edit me";
      defaults.textAlignment = "center";
      defaults.fontSize = 16;
      defaults.fontWeight = "normal";
    }

    addObject(defaults);
    onClose();
  };

  return (
    <div className="px-2 py-1.5 border-b bg-secondary/30">
      <div className="grid grid-cols-2 gap-1">
        {objectTypes.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] rounded-md bg-card border hover:border-primary/40 transition-colors"
            onClick={() => handleAdd(type)}
          >
            <Icon className="h-3 w-3 text-muted-foreground" />
            {label}
          </button>
        ))}
      </div>

      {/* Preset objects */}
      <div className="mt-2 pt-2 border-t">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Presets</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {PRESET_OBJECTS.slice(0, 6).map((p) => (
            <button
              key={p.type}
              className="px-2 py-0.5 text-[10px] rounded bg-card border hover:border-primary/30 capitalize"
              onClick={() => {
                addObject({ ...p, x: 100 + Math.random() * 200, y: 100 + Math.random() * 200, width: 100, height: 80 });
                onClose();
              }}
            >
              {p.type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Left Sidebar ───────────────────────────────────────────

export function EditorLeftSidebar() {
  const { currentScene } = useSceneStore();
  const { features } = usePlan();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [layersOpen, setLayersOpen] = useState(true);

  const atLimit = features.maxObjectsPerArtboard > 0 && currentScene.objects.length >= features.maxObjectsPerArtboard;

  return (
    <div className="flex flex-col h-full">
      {/* Layers Section */}
      <Collapsible open={layersOpen} onOpenChange={setLayersOpen}>
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <CollapsibleTrigger className="flex items-center gap-1 text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            {layersOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Layers
            <span className="text-[9px] font-normal ml-1 tabular-nums">({currentScene.objects.length})</span>
          </CollapsibleTrigger>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0"
            onClick={() => {
              if (atLimit) {
                toast.error(`Max ${features.maxObjectsPerArtboard} objects on your plan`);
                return;
              }
              setShowAddMenu(!showAddMenu);
            }}
            disabled={atLimit}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {showAddMenu && <AddObjectMenu onClose={() => setShowAddMenu(false)} />}

        {atLimit && (
          <div className="px-3 py-1.5 border-b">
            <UpgradePrompt feature="More objects" planRequired="Pro" compact />
          </div>
        )}

        <CollapsibleContent>
          <div className="flex-1 overflow-y-auto px-1.5 py-1">
            {currentScene.objects.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Box className="h-5 w-5 mx-auto mb-1 opacity-30" />
                <p className="text-[10px]">No objects yet</p>
                <p className="text-[9px] mt-0.5 opacity-60">Click + to add</p>
              </div>
            ) : (
              <div className="space-y-px">
                {[...currentScene.objects].reverse().map((obj, i) => (
                  <LayerRow key={obj.id} obj={obj} index={currentScene.objects.length - 1 - i} />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
