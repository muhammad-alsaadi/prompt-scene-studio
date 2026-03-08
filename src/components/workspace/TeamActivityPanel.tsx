import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Image, CreditCard, UserPlus, FolderPlus, Upload } from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  user_id: string;
  metadata: Record<string, any> | null;
  created_at: string;
  entity_type: string | null;
}

const ACTION_ICONS: Record<string, typeof Activity> = {
  member_invited: UserPlus,
  project_created: FolderPlus,
  generation: Image,
  credit_used: CreditCard,
  asset_uploaded: Upload,
};

export function TeamActivityPanel() {
  const { activeWorkspaceId } = useWorkspace();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    supabase
      .from("activity_log")
      .select("*")
      .eq("workspace_id", activeWorkspaceId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setActivities((data || []) as ActivityItem[]);
        setLoading(false);
      });
  }, [activeWorkspaceId]);

  if (loading) {
    return <p className="text-xs text-muted-foreground text-center py-8">Loading activity...</p>;
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map(a => {
        const Icon = ACTION_ICONS[a.action] || Activity;
        const meta = a.metadata || {};
        return (
          <div key={a.id} className="flex items-start gap-2 py-2 px-3 rounded-lg hover:bg-secondary/30 transition-colors">
            <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px]">
                <span className="font-medium">{a.action.replace(/_/g, " ")}</span>
                {meta.email && <span className="text-muted-foreground"> · {meta.email}</span>}
                {meta.description && <span className="text-muted-foreground"> · {meta.description}</span>}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(a.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
