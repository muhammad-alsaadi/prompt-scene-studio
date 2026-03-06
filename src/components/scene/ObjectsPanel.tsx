import { useState } from "react";
import { useSceneStore } from "@/store/scene-store";
import { PRESET_OBJECTS } from "@/lib/scene-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Box, ChevronDown, ChevronUp } from "lucide-react";
import { SceneObject } from "@/types/scene";

function ObjectCard({ obj }: { obj: SceneObject }) {
  const [expanded, setExpanded] = useState(false);
  const { updateObject, removeObject } = useSceneStore();

  return (
    <div className="rounded-xl border bg-secondary/30 overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium capitalize">{obj.type}</span>
          {obj.color && (
            <span className="text-xs text-muted-foreground">({obj.color})</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              removeObject(obj.id);
            }}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t pt-2">
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Input value={obj.type} onChange={(e) => updateObject(obj.id, { type: e.target.value })} className="h-7 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Material</Label>
            <Input value={obj.material} onChange={(e) => updateObject(obj.id, { material: e.target.value })} className="h-7 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Color</Label>
            <Input value={obj.color} onChange={(e) => updateObject(obj.id, { color: e.target.value })} className="h-7 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Size</Label>
            <Select value={obj.size} onValueChange={(v) => updateObject(obj.id, { size: v })}>
              <SelectTrigger className="h-7 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["tiny", "small", "medium", "large", "huge"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Position</Label>
            <Select value={obj.position || "center"} onValueChange={(v) => updateObject(obj.id, { position: v })}>
              <SelectTrigger className="h-7 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["left", "center", "right", "foreground", "background"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

export function ObjectsPanel() {
  const { currentScene, addObject } = useSceneStore();
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-sm">Objects</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowPresets(!showPresets)}>
            Library
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs gradient-primary text-primary-foreground"
            onClick={() => addObject({ type: "new object" })}
          >
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Preset Library */}
      {showPresets && (
        <div className="mb-4 rounded-xl border bg-secondary/20 p-3">
          <p className="text-xs text-muted-foreground mb-2">Click to add:</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_OBJECTS.map((p) => (
              <button
                key={p.type}
                className="px-2.5 py-1 text-xs rounded-lg bg-card border hover:border-primary/50 hover:bg-primary/5 transition-colors capitalize"
                onClick={() => {
                  addObject(p);
                  setShowPresets(false);
                }}
              >
                {p.type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Objects list */}
      <div className="space-y-2">
        {currentScene.objects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Box className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No objects in scene</p>
            <p className="text-xs mt-1">Add from the library or create custom</p>
          </div>
        ) : (
          currentScene.objects.map((obj) => <ObjectCard key={obj.id} obj={obj} />)
        )}
      </div>
    </div>
  );
}
