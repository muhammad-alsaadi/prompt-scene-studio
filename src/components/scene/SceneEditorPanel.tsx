import { useSceneStore } from "@/store/scene-store";
import { ENVIRONMENT_OPTIONS, CAMERA_OPTIONS, STYLE_OPTIONS } from "@/lib/scene-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sun, Camera, Palette } from "lucide-react";

export function SceneEditorPanel() {
  const { currentScene, updateEnvironment, updateCamera, updateStyle } = useSceneStore();

  return (
    <div className="p-4 space-y-6">
      {/* Environment */}
      <section>
        <h3 className="font-display font-semibold text-sm flex items-center gap-2 mb-3">
          <Sun className="h-4 w-4 text-primary" /> Environment
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Location</Label>
            <Input
              value={currentScene.environment.location}
              onChange={(e) => updateEnvironment({ location: e.target.value })}
              placeholder="e.g. playground, forest, city"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Time of Day</Label>
            <Select value={currentScene.environment.time_of_day} onValueChange={(v) => updateEnvironment({ time_of_day: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENVIRONMENT_OPTIONS.time_of_day.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Weather</Label>
            <Select value={currentScene.environment.weather} onValueChange={(v) => updateEnvironment({ weather: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENVIRONMENT_OPTIONS.weather.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Lighting</Label>
            <Select value={currentScene.environment.lighting} onValueChange={(v) => updateEnvironment({ lighting: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENVIRONMENT_OPTIONS.lighting.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Separator />

      {/* Camera */}
      <section>
        <h3 className="font-display font-semibold text-sm flex items-center gap-2 mb-3">
          <Camera className="h-4 w-4 text-primary" /> Camera
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Shot Type</Label>
            <Select value={currentScene.camera.shot_type} onValueChange={(v) => updateCamera({ shot_type: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CAMERA_OPTIONS.shot_type.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Angle</Label>
            <Select value={currentScene.camera.angle} onValueChange={(v) => updateCamera({ angle: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CAMERA_OPTIONS.angle.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Lens</Label>
            <Select value={currentScene.camera.lens} onValueChange={(v) => updateCamera({ lens: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CAMERA_OPTIONS.lens.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Separator />

      {/* Style */}
      <section>
        <h3 className="font-display font-semibold text-sm flex items-center gap-2 mb-3">
          <Palette className="h-4 w-4 text-primary" /> Style
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Visual Style</Label>
            <Select value={currentScene.style.visual_style} onValueChange={(v) => updateStyle({ visual_style: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.visual_style.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Quality</Label>
            <Select value={currentScene.style.quality} onValueChange={(v) => updateStyle({ quality: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.quality.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Color Palette</Label>
            <Select value={currentScene.style.color_palette} onValueChange={(v) => updateStyle({ color_palette: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.color_palette.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </div>
  );
}
