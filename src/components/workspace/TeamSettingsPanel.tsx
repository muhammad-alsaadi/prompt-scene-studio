import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlanBadge } from "@/components/UpgradePrompt";
import { toast } from "sonner";
import {
  Building2, Crown, Mail, Shield, Pencil, Eye, UserMinus, UserPlus, Zap,
} from "lucide-react";

const ROLE_ICONS: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  editor: Pencil,
  viewer: Eye,
};

export function TeamSettingsPanel() {
  const { user } = useAuth();
  const {
    activeWorkspace, members, userRole,
    inviteMember, updateMemberRole, removeMember,
  } = useWorkspace();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);

  const isAdmin = userRole === "owner" || userRole === "admin";

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const ok = await inviteMember(inviteEmail.trim(), inviteRole);
    setInviting(false);
    if (ok) {
      toast.success(`Invited ${inviteEmail}`);
      setInviteEmail("");
    } else {
      toast.error("Failed to invite — user may already be a member");
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    const ok = await updateMemberRole(memberId, role);
    if (ok) toast.success("Role updated");
    else toast.error("Failed to update role");
  };

  const handleRemove = async (memberId: string, name?: string) => {
    const ok = await removeMember(memberId);
    if (ok) toast.success(`Removed ${name || "member"}`);
    else toast.error("Failed to remove member");
  };

  if (!activeWorkspace || activeWorkspace.type !== "team") {
    return (
      <div className="text-center py-12">
        <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Select a team workspace to manage members</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Info */}
      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-primary" />
          <h2 className="font-display font-semibold text-sm">Team Workspace</h2>
          <PlanBadge plan={activeWorkspace.plan} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Name</span>
            <p className="font-medium">{activeWorkspace.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Your Role</span>
            <p className="font-medium capitalize">{userRole || "member"}</p>
          </div>
          <div>
            <span className="text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" /> Credits</span>
            <p className="font-medium">{activeWorkspace.credit_balance.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Members</span>
            <p className="font-medium">{members.length + 1}</p>
          </div>
        </div>
      </section>

      {/* Invite */}
      {isAdmin && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-3">
            <UserPlus className="h-4 w-4 text-primary" /> Invite Member
          </h2>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Email address"
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="h-8 text-xs flex-1"
              onKeyDown={e => e.key === "Enter" && handleInvite()}
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="h-8 w-24 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8 text-xs" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              <Mail className="h-3 w-3 mr-1" /> {inviting ? "..." : "Invite"}
            </Button>
          </div>
        </section>
      )}

      {/* Members List */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-display font-semibold text-sm mb-3">Members</h2>
        <div className="space-y-2">
          {/* Owner row */}
          <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/50">
            <Crown className="h-3.5 w-3.5 text-warning" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {activeWorkspace.owner_id === user?.id ? "You" : "Owner"}
              </p>
              <p className="text-[10px] text-muted-foreground">Owner</p>
            </div>
          </div>

          {members.map(m => {
            const RoleIcon = ROLE_ICONS[m.role] || Eye;
            const isMe = m.user_id === user?.id;
            return (
              <div key={m.id} className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-secondary/30 transition-colors">
                <RoleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {m.display_name || m.email || m.invited_email || "Unknown"}
                    {isMe && <span className="text-muted-foreground ml-1">(you)</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {m.role} · {m.status}
                  </p>
                </div>
                {isAdmin && !isMe && (
                  <div className="flex items-center gap-1">
                    <Select value={m.role} onValueChange={v => handleRoleChange(m.id, v)}>
                      <SelectTrigger className="h-6 w-20 text-[10px] border-0 bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(m.id, m.display_name || m.email)}
                    >
                      <UserMinus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {members.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No team members yet. Invite someone to get started.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
