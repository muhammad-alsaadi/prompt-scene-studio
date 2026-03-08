import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Image, Upload } from "lucide-react";

interface AssetItem {
  id: string;
  name: string;
  file_url: string;
  asset_type: string;
  file_type: string;
  created_at: string;
}

export function SharedAssetsPanel() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    supabase
      .from("assets")
      .select("id, name, file_url, asset_type, file_type, created_at")
      .eq("workspace_id", activeWorkspaceId)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setAssets((data || []) as AssetItem[]);
        setLoading(false);
      });
  }, [activeWorkspaceId]);

  if (loading) {
    return <p className="text-xs text-muted-foreground text-center py-8">Loading assets...</p>;
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <Image className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground mb-1">No shared assets yet</p>
        <p className="text-[10px] text-muted-foreground">
          {activeWorkspace?.type === "team"
            ? "Team assets uploaded to projects will appear here"
            : "Upload assets in your projects to see them here"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {assets.map(a => (
        <div key={a.id} className="rounded-lg border bg-card overflow-hidden group cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all">
          {a.file_type === "image" ? (
            <div className="aspect-square bg-muted">
              <img src={a.file_url} alt={a.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-square bg-muted flex items-center justify-center">
              <Upload className="h-5 w-5 text-muted-foreground/40" />
            </div>
          )}
          <div className="p-1.5">
            <p className="text-[10px] font-medium truncate">{a.name}</p>
            <p className="text-[9px] text-muted-foreground capitalize">{a.asset_type}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
