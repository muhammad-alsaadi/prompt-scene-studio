import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlan } from "@/hooks/use-plan";
import { Sparkles } from "lucide-react";

export function SettingsGenerationSection() {
  const { features } = usePlan();

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" /> Generation Defaults
      </h2>
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Default Mode</Label>
          <Select defaultValue="scene">
            <SelectTrigger className="h-8 text-xs mt-0.5 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="scene">Scene Mode</SelectItem>
              <SelectItem value="ad_composition" disabled={!features.adCompositionMode}>
                Ad Composition {!features.adCompositionMode && "(Pro)"}
              </SelectItem>
              <SelectItem value="advanced_layered" disabled={!features.advancedLayeredMode}>
                Advanced Layered {!features.advancedLayeredMode && "(Ultra)"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Default Quality</Label>
          <Select defaultValue="standard">
            <SelectTrigger className="h-8 text-xs mt-0.5 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft (faster)</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="high" disabled={!features.highResOutput}>
                High Quality {!features.highResOutput && "(Pro+)"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
