import { useState } from "react";
import { useSceneStore } from "@/store/scene-store";
import { PRESET_OBJECTS } from "@/lib/scene-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlan } from "@/hooks/use-plan";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import {
  Plus, Trash2, Box, Eye, EyeOff, Lock, Unlock, Copy, ChevronUp, ChevronDown,
  Layout, Layers, ImageIcon, Type, Sparkles, Star,
} from "lucide-react";
import { SceneObject, ObjectType } from "@/types/scene";
import { toast } from "sonner";

function ObjectRow({ obj, mode }: { obj: SceneObject; mode: string }) {
  const {
    selectedObjectId, selectObject, removeObject,
    toggleObjectVisibility, toggleObjectLock, duplicateObject,
  } = useSceneStore();
  const { features, requireFeature } = usePlan();

  const isSelected = selectedObjectId === obj.id;
  const isVisible = obj.visible ?? true;
  const isLocked = obj.locked ?? false;

  // Mode-specific label
  const getLabel = () => {
    if (mode === "advanced_layered") {
      const layer = obj.depth_layer || "midground";
      return `${obj.name || obj.type} [${layer}]`;
    }
    if (mode === "ad_composition") {
      const role = obj.visual_role || obj.objectType || "element";
      return `${obj.name || obj.type} (${role})`;
    }
    return obj.type;
  };

  return (
    <div
      className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${
        isSelected ? "bg-primary/10 text-primary" : "hover:bg-secondary/50"
      }`}
      onClick={() => selectObject(obj.id)}
    >
      <Box className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate capitalize font-medium">{getLabel()}</span>
      {mode === "advanced_layered" && (
        <span className={`text-[8px] px-1 py-0.5 rounded ${
          obj.importance === "high" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        }`}>
          {obj.importance || "med"}
        </span>
      )}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-0.5 hover:text-primary" onClick={(e) => { e.stopPropagation(); if (!requireFeature("lockHideObjects", "Hide/Show objects")) return; toggleObjectVisibility(obj.id); }}>
          {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
        </button>
        <button className="p-0.5 hover:text-primary" onClick={(e) => { e.stopPropagation(); if (!requireFeature("lockHideObjects", "Lock/Unlock objects")) return; toggleObjectLock(obj.id); }}>
          {isLocked ? <Lock className="h-3 w-3 text-warning" /> : <Unlock className="h-3 w-3" />}
        </button>
        <button className="p-0.5 hover:text-primary" onClick={(e) => { e.stopPropagation(); if (!requireFeature("duplicateObjects", "Duplicate objects")) return; duplicateObject(obj.id); }}>
          <Copy className="h-3 w-3" />
        </button>
        <button className="p-0.5 hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }}>
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function ObjectInspector({ obj, mode }: { obj: SceneObject; mode: string }) {
  const { updateObject, reorderObject } = useSceneStore();
  const isLocked = obj.locked ?? false;

  if (isLocked) {
    return (
      <div className="px-3 py-4 text-xs text-muted-foreground text-center">
        <Lock className="h-4 w-4 mx-auto mb-1" />
        Object is locked
      </div>
    );
  }

  return (
    <div className="px-3 py-3 space-y-2.5 border-t">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Properties</span>
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => reorderObject(obj.id, "up")}>
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => reorderObject(obj.id, "down")}>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Common fields */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground">Type</Label>
          <Input value={obj.type} onChange={(e) => updateObject(obj.id, { type: e.target.value })} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Material</Label>
          <Input value={obj.material} onChange={(e) => updateObject(obj.id, { material: e.target.value })} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Color</Label>
          <Input value={obj.color} onChange={(e) => updateObject(obj.id, { color: e.target.value })} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Size</Label>
          <Select value={obj.size} onValueChange={(v) => updateObject(obj.id, { size: v })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["tiny", "small", "medium", "large", "huge"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scene Mode fields */}
      {mode === "scene" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">Position</Label>
            <Select value={obj.position || "center"} onValueChange={(v) => updateObject(obj.id, { position: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["left", "center", "right", "foreground", "background"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Layer</Label>
            <Select value={obj.depth_layer} onValueChange={(v) => updateObject(obj.id, { depth_layer: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["foreground", "midground", "background"].map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Ad Composition Mode fields */}
      {mode === "ad_composition" && (
        <div className="space-y-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">Visual Role</Label>
            <Select value={obj.visual_role || "element"} onValueChange={(v) => updateObject(obj.id, { visual_role: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product (Hero)</SelectItem>
                <SelectItem value="logo">Logo / Branding</SelectItem>
                <SelectItem value="headline">Headline Text</SelectItem>
                <SelectItem value="cta">Call to Action</SelectItem>
                <SelectItem value="element">Decorative Element</SelectItem>
                <SelectItem value="background">Background</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Position</Label>
            <Select value={obj.position || "center"} onValueChange={(v) => updateObject(obj.id, { position: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["left", "center", "right", "top", "bottom", "hero-center"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Style Notes</Label>
            <Input
              value={obj.style_description || ""}
              onChange={(e) => updateObject(obj.id, { style_description: e.target.value })}
              className="h-7 text-xs"
              placeholder="e.g. glossy, shadow, floating..."
            />
          </div>
        </div>
      )}

      {/* Advanced Layered Mode fields */}
      {mode === "advanced_layered" && (
        <div className="space-y-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">Layer Depth</Label>
            <Select value={obj.depth_layer} onValueChange={(v) => updateObject(obj.id, { depth_layer: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="background">Background Layer</SelectItem>
                <SelectItem value="midground">Midground Layer</SelectItem>
                <SelectItem value="foreground">Foreground Layer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Importance (affects layer generation)</Label>
            <Select value={obj.importance || "medium"} onValueChange={(v) => updateObject(obj.id, { importance: v as any })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High — generates as separate layer</SelectItem>
                <SelectItem value="medium">Medium — generates as separate layer</SelectItem>
                <SelectItem value="low">Low — included in background</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Pose / Action</Label>
            <Input
              value={obj.pose_or_action || ""}
              onChange={(e) => updateObject(obj.id, { pose_or_action: e.target.value })}
              className="h-7 text-xs"
              placeholder="e.g. standing, flying, tilted..."
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Style Description</Label>
            <Input
              value={obj.style_description || ""}
              onChange={(e) => updateObject(obj.id, { style_description: e.target.value })}
              className="h-7 text-xs"
              placeholder="e.g. watercolor, photorealistic..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ObjectsPanel() {
  const { currentScene, addObject, selectedObjectId, generationMode } = useSceneStore();
  const { features } = usePlan();
  const [showPresets, setShowPresets] = useState(false);

  const selectedObj = currentScene.objects.find(o => o.id === selectedObjectId);
  const atLimit = features.maxObjectsPerArtboard > 0 && currentScene.objects.length >= features.maxObjectsPerArtboard;

  const handleAddObject = (obj?: Partial<SceneObject>) => {
    if (atLimit) {
      toast.error(`Maximum ${features.maxObjectsPerArtboard} objects on your plan`);
      return;
    }

    // Mode-specific defaults
    const modeDefaults: Partial<SceneObject> = {};
    if (generationMode === "ad_composition") {
      modeDefaults.visual_role = "element";
      modeDefaults.importance = "high";
    } else if (generationMode === "advanced_layered") {
      modeDefaults.importance = "high";
      modeDefaults.depth_layer = "midground";
    }

    addObject({ type: "new object", ...modeDefaults, ...obj });
  };

  const modeLabel = generationMode === "ad_composition" ? "Composition Elements"
    : generationMode === "advanced_layered" ? "Layer Stack"
    : "Scene Objects";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h3 className="font-display font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">{modeLabel}</h3>
        <div className="flex gap-0.5">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setShowPresets(!showPresets)}>
            Library
          </Button>
          <Button
            size="sm"
            className="h-6 text-[10px] px-2 gradient-primary text-primary-foreground"
            onClick={() => handleAddObject()}
            disabled={atLimit}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {atLimit && (
        <div className="px-3 py-2 border-b">
          <UpgradePrompt feature="More objects" planRequired="Pro" compact />
        </div>
      )}

      {showPresets && (
        <div className="px-3 py-2 border-b bg-secondary/30">
          <div className="flex flex-wrap gap-1">
            {PRESET_OBJECTS.map((p) => (
              <button
                key={p.type}
                className="px-2 py-0.5 text-[10px] rounded-md bg-card border hover:border-primary/40 transition-colors capitalize"
                onClick={() => { handleAddObject(p); setShowPresets(false); }}
              >
                {p.type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode-specific empty state */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5">
        {currentScene.objects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {generationMode === "scene" && <Box className="h-6 w-6 mx-auto mb-1.5 opacity-30" />}
            {generationMode === "ad_composition" && <Layout className="h-6 w-6 mx-auto mb-1.5 opacity-30" />}
            {generationMode === "advanced_layered" && <Layers className="h-6 w-6 mx-auto mb-1.5 opacity-30" />}
            <p className="text-[11px]">
              {generationMode === "scene" && "No scene objects"}
              {generationMode === "ad_composition" && "No composition elements"}
              {generationMode === "advanced_layered" && "No layers defined"}
            </p>
            <p className="text-[9px] mt-1 opacity-60">
              {generationMode === "scene" && "Add objects to build your scene"}
              {generationMode === "ad_composition" && "Add products, logos, and text for your ad"}
              {generationMode === "advanced_layered" && "Add elements — each becomes a separate layer"}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {currentScene.objects.map((obj) => <ObjectRow key={obj.id} obj={obj} mode={generationMode} />)}
          </div>
        )}
      </div>

      {selectedObj && <ObjectInspector obj={selectedObj} mode={generationMode} />}
    </div>
  );
}
