// Left sidebar: Mode-specific panels, layers, product images, artboards
import React, { useState, useEffect } from "react";
import { useSceneStore } from "@/store/scene-store";
import { useEditorStore } from "@/store/editor-store";
import { usePlan } from "@/hooks/use-plan";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { PRESET_OBJECTS } from "@/lib/scene-utils";
import { SceneObject, ObjectType } from "@/types/scene";
import { PROVIDERS, getProvidersForPlan, GENERATION_MODES, getModesForPlan } from "@/lib/providers";
import { ProductImagesPanel } from "@/components/editor/ProductImagesPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";
import {
  Plus, Trash2, Box, Eye, EyeOff, Lock, Unlock, Copy, Type, Image as ImageIcon,
  Star, Layers, ChevronDown, ChevronRight, GripVertical, Sparkles,
  Monitor, Palette, Cpu,
} from "lucide-react";

// ─── Object Type Icons ────────────────────────────────────────────

const OBJ_ICONS: Record<string, typeof Box> = {
  generic: Box,
  text: Type,
  uploaded_image: ImageIcon,
  decorative: Star,
  subject: Sparkles,
  background_element: Layers,
  rectangle: Box,
  ellipse: Box,
  line: Box,
  pen_path: Box,
  polygon: Box,
};

// ─── Layer Row ────────────────────────────────────────────────────

function LayerThumbnail({ obj }: { obj: SceneObject }) {
  if (obj.objectType === "uploaded_image" && obj.asset_url) {
    return (
      <div className="w-7 h-7 rounded border border-border/50 overflow-hidden shrink-0 bg-muted/30">
        <img src={obj.asset_url} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (obj.objectType === "text") {
    return (
      <div className="w-7 h-7 rounded border border-border/50 shrink-0 bg-muted/30 flex items-center justify-center">
        <Type className="h-3 w-3 text-muted-foreground" />
      </div>
    );
  }

  // Vector shapes - show color swatch
  if (["rectangle", "ellipse", "line", "pen_path", "polygon"].includes(obj.objectType || "")) {
    return (
      <div
        className="w-7 h-7 rounded border border-border/50 shrink-0 flex items-center justify-center"
        style={{ backgroundColor: obj.fill || "transparent" }}
      >
        {obj.objectType === "ellipse" && <div className="w-4 h-4 rounded-full border border-foreground/30" style={{ backgroundColor: obj.fill || "transparent" }} />}
        {obj.objectType === "rectangle" && <div className="w-4 h-3 border border-foreground/30" style={{ backgroundColor: obj.fill || "transparent" }} />}
        {obj.objectType === "line" && <div className="w-5 h-0.5 bg-foreground/50 rotate-45" />}
        {obj.objectType === "pen_path" && <Sparkles className="h-3 w-3 text-muted-foreground" />}
      </div>
    );
  }

  const Icon = OBJ_ICONS[obj.objectType || "generic"] || Box;
  return (
    <div className="w-7 h-7 rounded border border-border/50 shrink-0 bg-muted/30 flex items-center justify-center">
      <Icon className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}

function LayerRow({ obj, index, onDragStart, onDragOver, onDrop }: {
  obj: SceneObject;
  index: number;
  onDragStart: (e: React.DragEvent, idx: number) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
  onDrop: (e: React.DragEvent, idx: number) => void;
}) {
  const { removeObject, toggleObjectVisibility, toggleObjectLock, duplicateObject, selectObject, selectedObjectId } = useSceneStore();
  const { selectedIds, select, toggleSelect, setHovered } = useEditorStore();
  const { features, requireFeature } = usePlan();

  const isSelected = selectedIds.has(obj.id) || selectedObjectId === obj.id;
  const isVisible = obj.visible ?? true;
  const isLocked = obj.locked ?? false;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className={`group flex items-center gap-1.5 px-1.5 py-1 rounded-md cursor-pointer transition-all text-[11px] ${
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
      <GripVertical className="h-3 w-3 text-muted-foreground/30 shrink-0 cursor-grab" />
      <LayerThumbnail obj={obj} />
      <span className="flex-1 truncate font-medium capitalize text-[10px]">
        {obj.name || obj.type || `Object ${index + 1}`}
      </span>

      <div className="flex items-center gap-px opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-0.5 rounded hover:bg-secondary" onClick={(e) => { e.stopPropagation(); toggleObjectVisibility(obj.id); }}>
                {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[10px]">Toggle visibility</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-0.5 rounded hover:bg-secondary" onClick={(e) => { e.stopPropagation(); toggleObjectLock(obj.id); }}>
                {isLocked ? <Lock className="h-3 w-3 text-warning" /> : <Unlock className="h-3 w-3" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[10px]">Toggle lock</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-0.5 rounded hover:bg-secondary" onClick={(e) => { e.stopPropagation(); duplicateObject(obj.id); }}>
                <Copy className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[10px]">Duplicate</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-0.5 rounded hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }}>
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

// ─── Add Object Menu (mode-specific) ─────────────────────────────

function AddObjectMenu({ onClose, mode }: { onClose: () => void; mode: string }) {
  const { addObject } = useSceneStore();
  const { activeColor, activeStroke, activeStrokeWidth } = useEditorStore();

  // Scene mode: generic objects only
  const sceneTypes: { type: ObjectType; label: string; icon: typeof Box }[] = [
    { type: "generic", label: "Object", icon: Box },
    { type: "subject", label: "Subject", icon: Sparkles },
    { type: "background_element", label: "Background", icon: Layers },
  ];

  // Ad Composition: text, decorative, object only
  const adTypes: { type: ObjectType; label: string; icon: typeof Box }[] = [
    { type: "text", label: "Text", icon: Type },
    { type: "decorative", label: "Decorative", icon: Star },
    { type: "generic", label: "Object", icon: Box },
  ];

  // Advanced Layered: all types
  const advancedTypes: { type: ObjectType; label: string; icon: typeof Box }[] = [
    { type: "generic", label: "Object", icon: Box },
    { type: "text", label: "Text", icon: Type },
    { type: "subject", label: "Subject", icon: Sparkles },
    { type: "decorative", label: "Decorative", icon: Star },
    { type: "background_element", label: "Background", icon: Layers },
  ];

  const objectTypes = mode === "scene" ? sceneTypes : mode === "ad_composition" ? adTypes : advancedTypes;

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
    </div>
  );
}

// ─── Artboard Section ─────────────────────────────────────────────

interface ArtboardItem {
  id: string;
  name: string;
  width: number;
  height: number;
  preset_size: string | null;
}

function ArtboardSection({ onAddArtboard, projectId }: { onAddArtboard: () => void; projectId?: string | null }) {
  const [open, setOpen] = useState(true);
  const [artboards, setArtboards] = useState<ArtboardItem[]>([]);
  const { activeArtboardId, setActiveArtboard, setArtboards: setStoreArtboards } = useEditorStore();

  useEffect(() => {
    if (!projectId) return;
    const fetchArtboards = async () => {
      const { data } = await supabase
        .from("artboards")
        .select("id, name, width, height, preset_size")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });
      if (data) {
        setArtboards(data);
        // Sync to editor store for canvas rendering
        setStoreArtboards(data.map((a, i) => ({
          id: a.id,
          name: a.name,
          width: a.width,
          height: a.height,
          x: i * (a.width + 100),
          y: 0,
          backgroundColor: "#ffffff",
        })));
        if (data.length > 0 && !activeArtboardId) {
          setActiveArtboard(data[0].id);
        }
      }
    };
    fetchArtboards();

    const channel = supabase
      .channel(`artboards-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "artboards", filter: `project_id=eq.${projectId}` }, () => {
        fetchArtboards();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <CollapsibleTrigger className="flex items-center gap-1 text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Monitor className="h-3 w-3" />
          Artboards
          <span className="text-[9px] font-normal ml-1 tabular-nums">({artboards.length})</span>
        </CollapsibleTrigger>
        <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={onAddArtboard}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <CollapsibleContent>
        <div className="px-1.5 py-1 border-b space-y-0.5">
          {artboards.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-3">No artboards yet. Click + to create one.</p>
          ) : (
            artboards.map((ab) => (
              <button
                key={ab.id}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] transition-colors ${
                  activeArtboardId === ab.id ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "hover:bg-secondary/60"
                }`}
                onClick={() => setActiveArtboard(ab.id)}
              >
                <Monitor className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate font-medium text-left">{ab.name}</span>
                <span className="text-[9px] text-muted-foreground tabular-nums">{ab.width}×{ab.height}</span>
              </button>
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Provider Section ─────────────────────────────────────────────

function ProviderSection() {
  const { plan } = usePlan();
  const { selectedProvider, setSelectedProvider, selectedModel, setSelectedModel, generationMode, setGenerationMode } = useSceneStore();
  const providers = getProvidersForPlan(plan);
  const modes = getModesForPlan(plan);

  const currentProvider = providers.find(p => p.id === selectedProvider) || providers[0];
  const models = currentProvider?.models || [];

  return (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="w-full flex items-center gap-1 px-3 py-2 border-b text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
        <ChevronRight className="h-3 w-3" />
        <Cpu className="h-3 w-3" />
        Provider & Model
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 py-2 border-b space-y-2">
          <div>
            <label className="text-[9px] text-muted-foreground uppercase">Provider</label>
            <Select value={selectedProvider} onValueChange={(v) => { setSelectedProvider(v); const p = providers.find(x => x.id === v); if (p?.models[0]) setSelectedModel(p.models[0].id); }}>
              <SelectTrigger className="h-7 text-[10px] mt-0.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground uppercase">Model</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-7 text-[10px] mt-0.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {models.map(m => <SelectItem key={m.id} value={m.id}>{m.name} — {m.quality}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {currentProvider?.requiresApiKey && (
            <p className="text-[9px] text-warning">Requires your API key in Settings</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Main Left Sidebar ───────────────────────────────────────────

export function EditorLeftSidebar({ onAddArtboard, projectId }: { onAddArtboard?: () => void; projectId?: string | null }) {
  const { currentScene, generationMode, moveObjectToIndex } = useSceneStore();
  const { features } = usePlan();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [layersOpen, setLayersOpen] = useState(true);
  const dragRef = React.useRef<number | null>(null);

  const reversedObjects = [...currentScene.objects].reverse();

  // Filter objects based on mode for Ad Composition
  const displayObjects = generationMode === "ad_composition"
    ? reversedObjects.filter(o => ["text", "decorative", "generic", "uploaded_image"].includes(o.objectType || "generic"))
    : reversedObjects;

  const handleLayerDragStart = (e: React.DragEvent, displayIdx: number) => {
    dragRef.current = displayIdx;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleLayerDragOver = (e: React.DragEvent, _displayIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleLayerDrop = (e: React.DragEvent, displayIdx: number) => {
    e.preventDefault();
    if (dragRef.current === null || dragRef.current === displayIdx) return;
    const total = currentScene.objects.length;
    const fromReal = total - 1 - dragRef.current;
    const toReal = total - 1 - displayIdx;
    moveObjectToIndex(fromReal, toReal);
    dragRef.current = null;
  };

  const atLimit = features.maxObjectsPerArtboard > 0 && currentScene.objects.length >= features.maxObjectsPerArtboard;

  const layerTitle = generationMode === "scene"
    ? "Scene Objects"
    : generationMode === "ad_composition"
    ? "Composition Elements"
    : "Layer Stack";

  return (
    <div className="flex flex-col h-full">
      {/* Artboards — show in ad_composition and advanced_layered modes */}
      {generationMode !== "scene" && (
        <ArtboardSection onAddArtboard={onAddArtboard || (() => toast.info("Click + in the toolbar"))} projectId={projectId} />
      )}

      {/* Provider & Model */}
      <ProviderSection />

      {/* Product Images — Ad Composition only */}
      {generationMode === "ad_composition" && (
        <ProductImagesPanel projectId={projectId} />
      )}

      {/* Layers Section */}
      <Collapsible open={layersOpen} onOpenChange={setLayersOpen}>
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <CollapsibleTrigger className="flex items-center gap-1 text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            {layersOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {layerTitle}
            <span className="text-[9px] font-normal ml-1 tabular-nums">({displayObjects.length})</span>
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

        {showAddMenu && <AddObjectMenu onClose={() => setShowAddMenu(false)} mode={generationMode} />}

        {atLimit && (
          <div className="px-3 py-1.5 border-b">
            <UpgradePrompt feature="More objects" planRequired="Pro" compact />
          </div>
        )}

        <CollapsibleContent>
          {generationMode === "ad_composition" && displayObjects.length === 0 && (
            <div className="px-3 py-2 border-b bg-primary/5 text-[10px] text-muted-foreground">
              <p className="font-medium text-primary mb-0.5">Ad Composition Mode</p>
              <p>Add product images above, then add text & decorative elements here.</p>
            </div>
          )}
          {generationMode === "advanced_layered" && currentScene.objects.length === 0 && (
            <div className="px-3 py-2 border-b bg-accent/10 text-[10px] text-muted-foreground">
              <p className="font-medium text-accent-foreground mb-0.5">Layered Mode</p>
              <p>Add elements to generate as separate layers for compositing.</p>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-1.5 py-1">
            {displayObjects.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Box className="h-5 w-5 mx-auto mb-1 opacity-30" />
                <p className="text-[10px]">No elements yet</p>
                <p className="text-[9px] mt-0.5 opacity-60">Click + to add elements</p>
              </div>
            ) : (
              <div className="space-y-px">
                {displayObjects.map((obj, i) => (
                  <LayerRow
                    key={obj.id}
                    obj={obj}
                    index={currentScene.objects.length - 1 - i}
                    onDragStart={handleLayerDragStart}
                    onDragOver={handleLayerDragOver}
                    onDrop={handleLayerDrop}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
