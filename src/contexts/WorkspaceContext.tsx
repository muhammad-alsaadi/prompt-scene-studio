import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PlanId } from "@/lib/plans";

export interface Workspace {
  id: string;
  name: string;
  type: "personal" | "team";
  plan: PlanId;
  owner_id: string;
  credit_balance: number;
  daily_credits_used: number;
  daily_credits_reset_at: string | null;
}

export interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  role: string;
  status: string;
  invited_email: string | null;
  invited_by: string | null;
  accepted_at: string | null;
  created_at: string;
  display_name?: string;
  email?: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string | null;
  members: WorkspaceMember[];
  userRole: string | null;
  loading: boolean;
  setActiveWorkspaceId: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  createTeamWorkspace: (name: string) => Promise<Workspace | null>;
  inviteMember: (email: string, role?: string) => Promise<boolean>;
  updateMemberRole: (memberId: string, role: string) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || null;

  const refreshWorkspaces = useCallback(async () => {
    if (!user) { setWorkspaces([]); setLoading(false); return; }
    
    // Get owned workspaces
    const { data: owned } = await supabase
      .from("workspaces")
      .select("id, name, type, plan, owner_id, credit_balance, daily_credits_used, daily_credits_reset_at")
      .eq("owner_id", user.id)
      .is("archived_at", null);

    // Get workspaces user is a member of
    const { data: memberOf } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .eq("status", "active");

    let memberWorkspaces: Workspace[] = [];
    if (memberOf && memberOf.length > 0) {
      const wsIds = memberOf.map(m => m.workspace_id);
      const { data: mws } = await supabase
        .from("workspaces")
        .select("id, name, type, plan, owner_id, credit_balance, daily_credits_used, daily_credits_reset_at")
        .in("id", wsIds)
        .is("archived_at", null);
      memberWorkspaces = (mws || []) as Workspace[];
    }

    const all = [...(owned || []), ...memberWorkspaces] as Workspace[];
    // Dedupe
    const unique = Array.from(new Map(all.map(w => [w.id, w])).values());
    setWorkspaces(unique);

    // Auto-select personal workspace if none active
    if (!activeWorkspaceId || !unique.find(w => w.id === activeWorkspaceId)) {
      const personal = unique.find(w => w.type === "personal");
      if (personal) setActiveWorkspaceIdState(personal.id);
      else if (unique.length > 0) setActiveWorkspaceIdState(unique[0].id);
    }

    setLoading(false);
  }, [user, activeWorkspaceId]);

  const refreshMembers = useCallback(async () => {
    if (!activeWorkspaceId || !user) { setMembers([]); return; }

    const { data } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", activeWorkspaceId);

    // Enrich with profile data
    const enriched: WorkspaceMember[] = [];
    if (data) {
      const userIds = data.filter(m => m.user_id).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      for (const m of data) {
        const profile = profileMap.get(m.user_id);
        enriched.push({
          ...m,
          display_name: profile?.display_name || undefined,
          email: profile?.email || m.invited_email || undefined,
        });
      }
    }

    setMembers(enriched);

    // Set user role
    const ws = workspaces.find(w => w.id === activeWorkspaceId);
    if (ws?.owner_id === user.id) {
      setUserRole("owner");
    } else {
      const myMembership = enriched.find(m => m.user_id === user.id);
      setUserRole(myMembership?.role || null);
    }
  }, [activeWorkspaceId, user, workspaces]);

  useEffect(() => {
    if (user) refreshWorkspaces();
    else { setWorkspaces([]); setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (activeWorkspaceId) refreshMembers();
  }, [activeWorkspaceId, refreshMembers]);

  const setActiveWorkspaceId = (id: string) => {
    setActiveWorkspaceIdState(id);
    localStorage.setItem("ps_active_workspace", id);
  };

  // Restore from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ps_active_workspace");
    if (saved && workspaces.find(w => w.id === saved)) {
      setActiveWorkspaceIdState(saved);
    }
  }, [workspaces]);

  const createTeamWorkspace = async (name: string): Promise<Workspace | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name, owner_id: user.id, type: "team", plan: "team" })
      .select("id, name, type, plan, owner_id, credit_balance, daily_credits_used, daily_credits_reset_at")
      .single();
    if (error || !data) return null;

    // Create subscription state
    await supabase.from("subscription_state").insert({
      workspace_id: data.id,
      current_plan: "team",
      status: "active",
    });

    await refreshWorkspaces();
    setActiveWorkspaceId(data.id);
    return data as Workspace;
  };

  const inviteMember = async (email: string, role = "editor"): Promise<boolean> => {
    if (!user || !activeWorkspaceId) return false;
    
    // Check for existing invite
    const { data: existing } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", activeWorkspaceId)
      .eq("invited_email", email)
      .maybeSingle();
    if (existing) return false;

    // Try to find user by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    const { error } = await supabase.from("workspace_members").insert({
      workspace_id: activeWorkspaceId,
      user_id: profile?.user_id || user.id, // fallback to inviter for placeholder
      role,
      status: profile ? "active" : "invited",
      invited_email: email,
      invited_by: user.id,
      accepted_at: profile ? new Date().toISOString() : null,
    });

    if (error) return false;

    // Log activity
    await supabase.from("activity_log").insert({
      workspace_id: activeWorkspaceId,
      user_id: user.id,
      action: "member_invited",
      entity_type: "workspace_member",
      metadata: { email, role },
    });

    await refreshMembers();
    return true;
  };

  const updateMemberRole = async (memberId: string, role: string): Promise<boolean> => {
    const { error } = await supabase
      .from("workspace_members")
      .update({ role })
      .eq("id", memberId);
    if (error) return false;
    await refreshMembers();
    return true;
  };

  const removeMember = async (memberId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("id", memberId);
    if (error) return false;
    await refreshMembers();
    return true;
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces, activeWorkspace, activeWorkspaceId, members, userRole, loading,
      setActiveWorkspaceId, refreshWorkspaces, refreshMembers,
      createTeamWorkspace, inviteMember, updateMemberRole, removeMember,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
