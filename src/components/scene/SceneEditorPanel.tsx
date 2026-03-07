import { useSceneStore } from "@/store/scene-store";
import { ENVIRONMENT_OPTIONS, CAMERA_OPTIONS, STYLE_OPTIONS } from "@/lib/scene-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sun, Camera, Palette } from "lucide-react";

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="px-3 py-3 border-b last:border-b-0">
      <h3 className="font-display font-semibold text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
        <Icon className="h-3 w-3" /> {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function SceneEditorPanel() {
  const { currentScene, updateEnvironment, updateCamera, updateStyle, updateScene } = useSceneStore();

  return (
    <div className="overflow-y-auto">
      {/* Scene Title */}
      <div className="px-3 py-3 border-b">
        <Label className="text-[10px] text-muted-foreground">Scene Title</Label>
        <Input
          value={currentScene.scene_title}
          onChange={(e) => updateScene({ scene_title: e.target.value })}
          placeholder="Untitled scene"
          className="h-7 text-xs mt-0.5"
        />
      </div>

      <Section icon={Sun} title="Environment">
        <Field label="Location">
          <Input
            value={currentScene.environment.location}
            onChange={(e) => updateEnvironment({ location: e.target.value })}
            placeholder="e.g. forest, studio"
            className="h-7 text-xs"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Time">
            <Select value={currentScene.environment.time_of_day} onValueChange={(v) => updateEnvironment({ time_of_day: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENVIRONMENT_OPTIONS.time_of_day.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Weather">
            <Select value={currentScene.environment.weather} onValueChange={(v) => updateEnvironment({ weather: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENVIRONMENT_OPTIONS.weather.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Lighting">
          <Select value={currentScene.environment.lighting} onValueChange={(v) => updateEnvironment({ lighting: v })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENVIRONMENT_OPTIONS.lighting.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section icon={Camera} title="Camera">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Shot">
            <Select value={currentScene.camera.shot_type} onValueChange={(v) => updateCamera({ shot_type: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CAMERA_OPTIONS.shot_type.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Angle">
            <Select value={currentScene.camera.angle} onValueChange={(v) => updateCamera({ angle: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CAMERA_OPTIONS.angle.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Lens">
          <Select value={currentScene.camera.lens} onValueChange={(v) => updateCamera({ lens: v })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CAMERA_OPTIONS.lens.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section icon={Palette} title="Style">
        <Field label="Visual Style">
          <Select value={currentScene.style.visual_style} onValueChange={(v) => updateStyle({ visual_style: v })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STYLE_OPTIONS.visual_style.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Quality">
            <Select value={currentScene.style.quality} onValueChange={(v) => updateStyle({ quality: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.quality.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Palette">
            <Select value={currentScene.style.color_palette} onValueChange={(v) => updateStyle({ color_palette: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.color_palette.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>
    </div>
  );
}
