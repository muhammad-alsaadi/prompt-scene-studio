import { useState } from "react";
import { useSceneStore } from "@/store/scene-store";
import { PRESET_OBJECTS } from "@/lib/scene-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Trash2, Box, Eye, EyeOff, Lock, Unlock, Copy, ChevronUp, ChevronDown,
} from "lucide-react";
import { SceneObject } from "@/types/scene";

function ObjectRow({ obj }: { obj: SceneObject }) {
  const {
    selectedObjectId, selectObject, removeObject,
    toggleObjectVisibility, toggleObjectLock, duplicateObject,
  } = useSceneStore();

  const isSelected = selectedObjectId === obj.id;
  const isVisible = obj.visible ?? true;
  const isLocked = obj.locked ?? false;

  return (
    <div
      className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${
        isSelected ? "bg-primary/10 text-primary" : "hover:bg-secondary/50"
      }`}
      onClick={() => selectObject(obj.id)}
    >
      <Box className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate capitalize font-medium">{obj.type}</span>
      {obj.color && <span className="text-[10px] text-muted-foreground hidden group-hover:inline">({obj.color})</span>}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-0.5 hover:text-primary" onClick={(e) => { e.stopPropagation(); toggleObjectVisibility(obj.id); }}>
          {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
        </button>
        <button className="p-0.5 hover:text-primary" onClick={(e) => { e.stopPropagation(); toggleObjectLock(obj.id); }}>
          {isLocked ? <Lock className="h-3 w-3 text-warning" /> : <Unlock className="h-3 w-3" />}
        </button>
        <button className="p-0.5 hover:text-primary" onClick={(e) => { e.stopPropagation(); duplicateObject(obj.id); }}>
          <Copy className="h-3 w-3" />
        </button>
        <button className="p-0.5 hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }}>
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function ObjectInspector({ obj }: { obj: SceneObject }) {
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
    </div>
  );
}

export function ObjectsPanel() {
  const { currentScene, addObject, selectedObjectId } = useSceneStore();
  const [showPresets, setShowPresets] = useState(false);

  const selectedObj = currentScene.objects.find(o => o.id === selectedObjectId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h3 className="font-display font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Layers</h3>
        <div className="flex gap-0.5">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setShowPresets(!showPresets)}>
            Library
          </Button>
          <Button
            size="sm"
            className="h-6 text-[10px] px-2 gradient-primary text-primary-foreground"
            onClick={() => addObject({ type: "new object" })}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {showPresets && (
        <div className="px-3 py-2 border-b bg-secondary/30">
          <div className="flex flex-wrap gap-1">
            {PRESET_OBJECTS.map((p) => (
              <button
                key={p.type}
                className="px-2 py-0.5 text-[10px] rounded-md bg-card border hover:border-primary/40 transition-colors capitalize"
                onClick={() => { addObject(p); setShowPresets(false); }}
              >
                {p.type}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-1.5 py-1.5">
        {currentScene.objects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Box className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
            <p className="text-[11px]">No objects</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {currentScene.objects.map((obj) => <ObjectRow key={obj.id} obj={obj} />)}
          </div>
        )}
      </div>

      {/* Inline inspector for selected object */}
      {selectedObj && <ObjectInspector obj={selectedObj} />}
    </div>
  );
}
