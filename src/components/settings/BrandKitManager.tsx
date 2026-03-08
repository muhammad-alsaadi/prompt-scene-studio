import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Palette, Save, X } from "lucide-react";

interface BrandKitData {
  id: string;
  name: string;
  logo_url: string | null;
  colors: string[];
  fonts: string[];
  style_notes: string;
  created_at: string;
}

export function BrandKitManager() {
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const [kits, setKits] = useState<BrandKitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKit, setEditingKit] = useState<BrandKitData | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [colors, setColors] = useState<string[]>(["#000000"]);
  const [fonts, setFonts] = useState<string[]>([""]);
  const [styleNotes, setStyleNotes] = useState("");

  const fetchKits = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("brand_kits")
      .select("id, name, logo_url, colors, fonts, style_notes, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const parsed = (data || []).map((k: any) => ({
      ...k,
      colors: Array.isArray(k.colors) ? k.colors : [],
      fonts: Array.isArray(k.fonts) ? k.fonts : [],
      style_notes: k.style_notes || "",
    }));
    setKits(parsed);
    setLoading(false);
  };

  useEffect(() => { fetchKits(); }, [user]);

  const resetForm = () => {
    setName("");
    setLogoUrl("");
    setColors(["#000000"]);
    setFonts([""]);
    setStyleNotes("");
    setEditingKit(null);
    setIsCreating(false);
  };

  const startEdit = (kit: BrandKitData) => {
    setEditingKit(kit);
    setIsCreating(false);
    setName(kit.name);
    setLogoUrl(kit.logo_url || "");
    setColors(kit.colors.length > 0 ? kit.colors : ["#000000"]);
    setFonts(kit.fonts.length > 0 ? kit.fonts : [""]);
    setStyleNotes(kit.style_notes);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) {
      toast.error("Name is required");
      return;
    }

    const payload = {
      name: name.trim(),
      logo_url: logoUrl.trim() || null,
      colors: colors.filter(c => c.trim()),
      fonts: fonts.filter(f => f.trim()),
      style_notes: styleNotes.trim(),
      user_id: user.id,
      workspace_id: activeWorkspaceId || null,
    };

    if (editingKit) {
      const { error } = await supabase
        .from("brand_kits")
        .update(payload)
        .eq("id", editingKit.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Brand kit updated");
    } else {
      const { error } = await supabase
        .from("brand_kits")
        .insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Brand kit created");
    }

    resetForm();
    fetchKits();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("brand_kits").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Brand kit deleted");
    if (editingKit?.id === id) resetForm();
    fetchKits();
  };

  const addColor = () => setColors([...colors, "#cccccc"]);
  const removeColor = (i: number) => setColors(colors.filter((_, idx) => idx !== i));
  const updateColor = (i: number, val: string) => setColors(colors.map((c, idx) => idx === i ? val : c));

  const addFont = () => setFonts([...fonts, ""]);
  const removeFont = (i: number) => setFonts(fonts.filter((_, idx) => idx !== i));
  const updateFont = (i: number, val: string) => setFonts(fonts.map((f, idx) => idx === i ? val : f));

  const showForm = isCreating || editingKit;

  if (loading) {
    return <p className="text-xs text-muted-foreground text-center py-6">Loading brand kits...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Kit list */}
      {!showForm && (
        <>
          {kits.length === 0 ? (
            <div className="text-center py-8">
              <Palette className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-3">No brand kits yet. Create one to store your brand colors, fonts, and style.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {kits.map(kit => (
                <div key={kit.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:ring-1 hover:ring-primary/20 transition-all">
                  {kit.logo_url ? (
                    <img src={kit.logo_url} alt={kit.name} className="h-10 w-10 rounded object-contain bg-muted" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <Palette className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{kit.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {kit.colors.slice(0, 6).map((c, i) => (
                        <span key={i} className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: c }} />
                      ))}
                      {kit.fonts.length > 0 && (
                        <span className="text-[10px] text-muted-foreground ml-2">{kit.fonts[0]}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2" onClick={() => startEdit(kit)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 text-destructive hover:text-destructive" onClick={() => handleDelete(kit.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => { resetForm(); setIsCreating(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Brand Kit
          </Button>
        </>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <div className="space-y-4 p-4 rounded-lg border bg-secondary/20">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold">{editingKit ? "Edit Brand Kit" : "New Brand Kit"}</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetForm}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div>
            <Label className="text-[10px] text-muted-foreground">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs mt-0.5" placeholder="e.g. My Brand" />
          </div>

          <div>
            <Label className="text-[10px] text-muted-foreground">Logo URL (optional)</Label>
            <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="h-8 text-xs mt-0.5" placeholder="https://..." />
            {logoUrl && <img src={logoUrl} alt="preview" className="h-10 w-10 mt-1 rounded object-contain bg-muted" />}
          </div>

          <div>
            <Label className="text-[10px] text-muted-foreground">Brand Colors</Label>
            <div className="space-y-1.5 mt-1">
              {colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="color" value={c} onChange={(e) => updateColor(i, e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
                  <Input value={c} onChange={(e) => updateColor(i, e.target.value)} className="h-7 text-xs flex-1 font-mono" />
                  {colors.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeColor(i)}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={addColor}>
                <Plus className="h-3 w-3 mr-1" /> Add Color
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-[10px] text-muted-foreground">Fonts</Label>
            <div className="space-y-1.5 mt-1">
              {fonts.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={f} onChange={(e) => updateFont(i, e.target.value)} className="h-7 text-xs flex-1" placeholder="e.g. Inter, Playfair Display" />
                  {fonts.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeFont(i)}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={addFont}>
                <Plus className="h-3 w-3 mr-1" /> Add Font
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-[10px] text-muted-foreground">Style Notes</Label>
            <Textarea
              value={styleNotes}
              onChange={(e) => setStyleNotes(e.target.value)}
              className="text-xs mt-0.5 min-h-[60px]"
              placeholder="Describe your brand's visual style, tone, and preferences..."
            />
          </div>

          <Button className="w-full gradient-primary text-primary-foreground text-xs" onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1" /> {editingKit ? "Update" : "Create"} Brand Kit
          </Button>
        </div>
      )}
    </div>
  );
}
