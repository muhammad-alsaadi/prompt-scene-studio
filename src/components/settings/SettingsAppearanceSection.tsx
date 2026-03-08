import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";
import { Palette } from "lucide-react";

export function SettingsAppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4">
        <Palette className="h-4 w-4 text-primary" /> Appearance
      </h2>
      <div>
        <Label className="text-xs text-muted-foreground">Theme</Label>
        <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
          <SelectTrigger className="h-8 text-xs mt-0.5 w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
