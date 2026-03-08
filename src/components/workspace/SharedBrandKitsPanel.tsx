import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Palette } from "lucide-react";

interface BrandKitItem {
  id: string;
  name: string;
  logo_url: string | null;
  colors: any[];
  style_notes: string | null;
  created_at: string;
}

export function SharedBrandKitsPanel() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const [kits, setKits] = useState<BrandKitItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    supabase
      .from("brand_kits")
      .select("id, name, logo_url, colors, style_notes, created_at")
      .eq("workspace_id", activeWorkspaceId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setKits((data || []) as BrandKitItem[]);
        setLoading(false);
      });
  }, [activeWorkspaceId]);

  if (loading) {
    return <p className="text-xs text-muted-foreground text-center py-8">Loading brand kits...</p>;
  }

  if (kits.length === 0) {
    return (
      <div className="text-center py-12">
        <Palette className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground mb-1">No brand kits</p>
        <p className="text-[10px] text-muted-foreground">
          {activeWorkspace?.type === "team"
            ? "Shared brand kits help your team maintain visual consistency"
            : "Create a brand kit to store your colors and style preferences"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {kits.map(k => (
        <div key={k.id} className="rounded-lg border bg-card p-3 hover:ring-1 hover:ring-primary/20 transition-all cursor-pointer">
          <div className="flex items-center gap-2">
            {k.logo_url ? (
              <img src={k.logo_url} alt={k.name} className="h-8 w-8 rounded object-contain bg-muted" />
            ) : (
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                <Palette className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{k.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {(Array.isArray(k.colors) ? k.colors.slice(0, 5) : []).map((c: any, i: number) => (
                  <span
                    key={i}
                    className="w-3 h-3 rounded-full border border-border"
                    style={{ backgroundColor: typeof c === "string" ? c : "#ccc" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
