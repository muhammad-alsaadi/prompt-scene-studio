// Right inspector panel — contextual properties for selected object, artboard, or scene
import React, { useState } from "react";
import { useSceneStore } from "@/store/scene-store";
import { useEditorStore } from "@/store/editor-store";
import { usePlan } from "@/hooks/use-plan";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { SceneObject, CustomField } from "@/types/scene";
import { ENVIRONMENT_OPTIONS, CAMERA_OPTIONS, STYLE_OPTIONS } from "@/lib/scene-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sun, Camera, Palette, Box, Type, Move, RotateCw, Maximize2, Layers, Eye, Lock,
  Plus, Trash2, Lightbulb, Paintbrush, MessageSquare, Tag, ChevronDown, ChevronRight, ImageIcon,
  Eraser, Loader2, Blend,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// ─── Helpers ──────────────────────────────────────────────────────

function Section({ icon: Icon, title, defaultOpen = true, children }: {
  icon: any; title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center gap-1.5 px-3 py-2 border-b hover:bg-secondary/30 transition-colors">
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="font-display font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">{title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 py-2.5 space-y-2 border-b">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground mb-0.5 block">{label}</Label>
      {children}
    </div>
  );
}

// ─── Transform Inspector ──────────────────────────────────────────

function TransformInspector({ obj }: { obj: SceneObject }) {
  const { updateObject } = useSceneStore();
  const id = obj.id;

  return (
    <Section icon={Move} title="Transform">
      <div className="grid grid-cols-2 gap-2">
        <Field label="X">
          <Input type="number" value={Math.round(obj.x ?? 0)} onChange={(e) => updateObject(id, { x: Number(e.target.value) })} className="h-7 text-xs" />
        </Field>
        <Field label="Y">
          <Input type="number" value={Math.round(obj.y ?? 0)} onChange={(e) => updateObject(id, { y: Number(e.target.value) })} className="h-7 text-xs" />
        </Field>
        <Field label="Width">
          <Input type="number" value={Math.round(obj.width ?? 120)} onChange={(e) => updateObject(id, { width: Number(e.target.value) })} className="h-7 text-xs" />
        </Field>
        <Field label="Height">
          <Input type="number" value={Math.round(obj.height ?? 80)} onChange={(e) => updateObject(id, { height: Number(e.target.value) })} className="h-7 text-xs" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Rotation">
          <Input type="number" value={obj.rotation ?? 0} onChange={(e) => updateObject(id, { rotation: Number(e.target.value) })} className="h-7 text-xs" />
        </Field>
        <Field label="Z-Index">
          <Input type="number" value={obj.zIndex ?? 1} onChange={(e) => updateObject(id, { zIndex: Number(e.target.value) })} className="h-7 text-xs" />
        </Field>
      </div>
      <Field label="Opacity">
        <div className="flex items-center gap-2">
          <Slider
            value={[Math.round((obj.opacity ?? 1) * 100)]}
            onValueChange={([v]) => updateObject(id, { opacity: v / 100 })}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-[10px] text-muted-foreground w-7 text-right tabular-nums">{Math.round((obj.opacity ?? 1) * 100)}%</span>
        </div>
      </Field>
    </Section>
  );
}

// ─── Appearance Inspector ─────────────────────────────────────────

function AppearanceInspector({ obj }: { obj: SceneObject }) {
  const { updateObject } = useSceneStore();
  const id = obj.id;

  return (
    <Section icon={Paintbrush} title="Appearance">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Material">
          <Input value={obj.material} onChange={(e) => updateObject(id, { material: e.target.value })} className="h-7 text-xs" placeholder="e.g. wood, metal" />
        </Field>
        <Field label="Color">
          <Input value={obj.color} onChange={(e) => updateObject(id, { color: e.target.value })} className="h-7 text-xs" placeholder="e.g. red, #ff0" />
        </Field>
        <Field label="Size">
          <Select value={obj.size || "medium"} onValueChange={(v) => updateObject(id, { size: v })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["tiny", "small", "medium", "large", "huge"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Layer">
          <Select value={obj.depth_layer || "midground"} onValueChange={(v) => updateObject(id, { depth_layer: v })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["foreground", "midground", "background"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </Section>
  );
}

// ─── Creative Inspector ───────────────────────────────────────────

function CreativeInspector({ obj }: { obj: SceneObject }) {
  const { updateObject } = useSceneStore();
  const id = obj.id;

  return (
    <Section icon={Lightbulb} title="Creative" defaultOpen={false}>
      <Field label="Importance">
        <Select value={obj.importance || "medium"} onValueChange={(v) => updateObject(id, { importance: v as any })}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["low", "medium", "high"].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Style Description">
        <Input value={obj.style_description || ""} onChange={(e) => updateObject(id, { style_description: e.target.value })} className="h-7 text-xs" placeholder="Artistic style" />
      </Field>
      <Field label="Mood">
        <Input value={obj.mood || ""} onChange={(e) => updateObject(id, { mood: e.target.value })} className="h-7 text-xs" placeholder="e.g. serene, dramatic" />
      </Field>
      <Field label="Lighting Hint">
        <Input value={obj.lighting_hint || ""} onChange={(e) => updateObject(id, { lighting_hint: e.target.value })} className="h-7 text-xs" placeholder="e.g. rim light" />
      </Field>
      <Field label="Prompt Notes">
        <Textarea value={obj.prompt_notes || ""} onChange={(e) => updateObject(id, { prompt_notes: e.target.value })} className="text-xs min-h-[48px] resize-none" placeholder="Additional generation hints..." />
      </Field>
      <Field label="Negative Notes">
        <Textarea value={obj.negative_notes || ""} onChange={(e) => updateObject(id, { negative_notes: e.target.value })} className="text-xs min-h-[48px] resize-none" placeholder="What to avoid..." />
      </Field>
    </Section>
  );
}

// ─── Text Inspector ───────────────────────────────────────────────

function TextInspector({ obj }: { obj: SceneObject }) {
  const { updateObject } = useSceneStore();
  const id = obj.id;

  if (obj.objectType !== "text") return null;

  return (
    <Section icon={Type} title="Text">
      <Field label="Content">
        <Textarea
          value={obj.textContent || ""}
          onChange={(e) => updateObject(id, { textContent: e.target.value })}
          className="text-xs min-h-[48px] resize-none"
          placeholder="Enter text..."
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Font Size">
          <Input type="number" value={obj.fontSize ?? 16} onChange={(e) => updateObject(id, { fontSize: Number(e.target.value) })} className="h-7 text-xs" />
        </Field>
        <Field label="Weight">
          <Select value={obj.fontWeight || "normal"} onValueChange={(v) => updateObject(id, { fontWeight: v })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["normal", "medium", "semibold", "bold"].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Alignment">
          <Select value={obj.textAlignment || "center"} onValueChange={(v) => updateObject(id, { textAlignment: v as any })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["left", "center", "right"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Color">
          <Input value={obj.textColor || ""} onChange={(e) => updateObject(id, { textColor: e.target.value })} className="h-7 text-xs" placeholder="#000000" />
        </Field>
      </div>
    </Section>
  );
}

// ─── Custom Fields Inspector ──────────────────────────────────────

function CustomFieldsInspector({ obj }: { obj: SceneObject }) {
  const { updateObject } = useSceneStore();
  const { features, requireFeature } = usePlan();
  const id = obj.id;
  const fields = obj.custom_fields || [];

  const addField = () => {
    if (!requireFeature("customFields", "Custom fields")) return;
    const newField: CustomField = { key: "", value: "", type: "text" };
    updateObject(id, { custom_fields: [...fields, newField] });
  };

  const updateField = (idx: number, updates: Partial<CustomField>) => {
    const updated = fields.map((f, i) => i === idx ? { ...f, ...updates } : f);
    updateObject(id, { custom_fields: updated });
  };

  const removeField = (idx: number) => {
    updateObject(id, { custom_fields: fields.filter((_, i) => i !== idx) });
  };

  return (
    <Section icon={Tag} title="Custom Fields" defaultOpen={false}>
      {!features.customFields ? (
        <UpgradePrompt feature="Custom fields" planRequired="Pro" compact />
      ) : (
        <>
          {fields.map((f, i) => (
            <div key={i} className="flex gap-1 items-end">
              <div className="flex-1">
                <Input value={f.key} onChange={(e) => updateField(i, { key: e.target.value })} className="h-6 text-[10px]" placeholder="Key" />
              </div>
              <div className="flex-1">
                <Input value={f.value} onChange={(e) => updateField(i, { value: e.target.value })} className="h-6 text-[10px]" placeholder="Value" />
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeField(i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="h-6 text-[10px] w-full" onClick={addField}>
            <Plus className="h-3 w-3 mr-1" /> Add Field
          </Button>
        </>
      )}
    </Section>
  );
}

// ─── Layer Compositing (Blend Mode + Remove BG) ──────────────────

const BLEND_MODES = [
  "normal", "multiply", "screen", "overlay", "darken", "lighten",
  "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion",
];

function LayerCompositing({ obj }: { obj: SceneObject }) {
  const { updateObject } = useSceneStore();
  const [removingBg, setRemovingBg] = React.useState(false);
  const id = obj.id;
  const hasImage = obj.objectType === "uploaded_image" || (obj.asset_url && obj.asset_url.length > 0);

  const handleRemoveBackground = async () => {
    if (!obj.asset_url) return;
    setRemovingBg(true);
    try {
      const { data, error } = await supabase.functions.invoke("remove-background", {
        body: { image_url: obj.asset_url },
      });
      if (error) throw error;
      if (data?.transparent_url) {
        updateObject(id, { asset_url: data.transparent_url });
        toast.success("Background removed!");
      } else {
        throw new Error("No result returned");
      }
    } catch (err: any) {
      console.error("Remove background error:", err);
      toast.error(err.message || "Failed to remove background");
    } finally {
      setRemovingBg(false);
    }
  };

  return (
    <Section icon={Paintbrush} title="Layer">
      <Field label="Blend Mode">
        <Select value={obj.blendMode || "normal"} onValueChange={(v) => updateObject(id, { blendMode: v })}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {BLEND_MODES.map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Opacity">
        <div className="flex items-center gap-2">
          <Slider
            value={[Math.round((obj.opacity ?? 1) * 100)]}
            onValueChange={([v]) => updateObject(id, { opacity: v / 100 })}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-[10px] text-muted-foreground w-7 text-right tabular-nums">{Math.round((obj.opacity ?? 1) * 100)}%</span>
        </div>
      </Field>
      {hasImage && (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-[10px] mt-1"
          onClick={handleRemoveBackground}
          disabled={removingBg}
        >
          {removingBg ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Eraser className="h-3 w-3 mr-1" />}
          {removingBg ? "Removing..." : "Remove Background"}
        </Button>
      )}
    </Section>
  );
}

// ─── Scene Inspector (when nothing selected) ─────────────────────

function SceneInspector() {
  const { currentScene, updateEnvironment, updateCamera, updateStyle, updateScene } = useSceneStore();

  return (
    <>
      <div className="px-3 py-2 border-b">
        <Label className="text-[10px] text-muted-foreground">Scene Title</Label>
        <Input value={currentScene.scene_title} onChange={(e) => updateScene({ scene_title: e.target.value })} placeholder="Untitled scene" className="h-7 text-xs mt-0.5" />
      </div>

      <Section icon={Sun} title="Environment">
        <Field label="Location">
          <Input value={currentScene.environment.location} onChange={(e) => updateEnvironment({ location: e.target.value })} placeholder="e.g. forest, studio" className="h-7 text-xs" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Time">
            <Select value={currentScene.environment.time_of_day} onValueChange={(v) => updateEnvironment({ time_of_day: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{ENVIRONMENT_OPTIONS.time_of_day.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Weather">
            <Select value={currentScene.environment.weather} onValueChange={(v) => updateEnvironment({ weather: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{ENVIRONMENT_OPTIONS.weather.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Lighting">
          <Select value={currentScene.environment.lighting} onValueChange={(v) => updateEnvironment({ lighting: v })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{ENVIRONMENT_OPTIONS.lighting.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </Section>

      <Section icon={Camera} title="Camera">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Shot">
            <Select value={currentScene.camera.shot_type} onValueChange={(v) => updateCamera({ shot_type: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{CAMERA_OPTIONS.shot_type.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Angle">
            <Select value={currentScene.camera.angle} onValueChange={(v) => updateCamera({ angle: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{CAMERA_OPTIONS.angle.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Lens">
          <Select value={currentScene.camera.lens} onValueChange={(v) => updateCamera({ lens: v })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{CAMERA_OPTIONS.lens.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </Section>

      <Section icon={Palette} title="Style">
        <Field label="Visual Style">
          <Select value={currentScene.style.visual_style} onValueChange={(v) => updateStyle({ visual_style: v })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{STYLE_OPTIONS.visual_style.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Quality">
            <Select value={currentScene.style.quality} onValueChange={(v) => updateStyle({ quality: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{STYLE_OPTIONS.quality.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Palette">
            <Select value={currentScene.style.color_palette} onValueChange={(v) => updateStyle({ color_palette: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{STYLE_OPTIONS.color_palette.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
      </Section>
    </>
  );
}

// ─── Main Inspector ──────────────────────────────────────────────

export function EditorRightInspector() {
  const { selectedObjectId, currentScene } = useSceneStore();
  const { selectedIds } = useEditorStore();

  const activeId = selectedObjectId || (selectedIds.size === 1 ? Array.from(selectedIds)[0] : null);
  const selectedObj = activeId ? currentScene.objects.find(o => o.id === activeId) : null;

  if (selectedIds.size > 1) {
    return (
      <div className="overflow-y-auto">
        <div className="px-3 py-3 border-b">
          <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground">
            {selectedIds.size} Objects Selected
          </span>
        </div>
        <div className="px-3 py-4 text-center text-[11px] text-muted-foreground">
          Select a single object to edit properties,<br />or use keyboard shortcuts to modify all.
        </div>
      </div>
    );
  }

  if (!selectedObj) {
    return (
      <div className="overflow-y-auto">
        <div className="px-3 py-2 border-b">
          <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground">Scene Properties</span>
        </div>
        <SceneInspector />
      </div>
    );
  }

  const isLocked = selectedObj.locked ?? false;

  return (
    <div className="overflow-y-auto">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div>
          <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground">Object</span>
          <Input
            value={selectedObj.name || selectedObj.type}
            onChange={(e) => useSceneStore.getState().updateObject(selectedObj.id, { name: e.target.value })}
            className="h-6 text-xs mt-0.5 font-medium"
            placeholder="Object name"
          />
        </div>
        <div className="flex gap-1 items-center">
          {isLocked && <Lock className="h-3 w-3 text-warning" />}
        </div>
      </div>

      {isLocked ? (
        <div className="px-3 py-6 text-xs text-muted-foreground text-center">
          <Lock className="h-5 w-5 mx-auto mb-2 opacity-40" />
          Object is locked. Unlock to edit.
        </div>
      ) : (
        <>
          <TransformInspector obj={selectedObj} />
          <LayerCompositing obj={selectedObj} />
          <AppearanceInspector obj={selectedObj} />
          {selectedObj.objectType === "text" && <TextInspector obj={selectedObj} />}
          <CreativeInspector obj={selectedObj} />
          <CustomFieldsInspector obj={selectedObj} />
        </>
      )}
    </div>
  );
}
