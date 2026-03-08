import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanBadge } from "@/components/UpgradePrompt";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Building2, ChevronDown, Plus, User } from "lucide-react";
import { toast } from "sonner";

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspaceId, createTeamWorkspace } = useWorkspace();
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!teamName.trim()) return;
    setCreating(true);
    const ws = await createTeamWorkspace(teamName.trim());
    setCreating(false);
    if (ws) {
      toast.success("Team workspace created!");
      setShowCreate(false);
      setTeamName("");
    } else {
      toast.error("Failed to create workspace");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium max-w-[180px]">
            {activeWorkspace?.type === "team" ? (
              <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : (
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="truncate">{activeWorkspace?.name || "Workspace"}</span>
            <PlanBadge plan={activeWorkspace?.plan || "free"} />
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {workspaces.map(ws => (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => setActiveWorkspaceId(ws.id)}
              className="flex items-center gap-2"
            >
              {ws.type === "team" ? (
                <Building2 className="h-3.5 w-3.5 text-primary" />
              ) : (
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="truncate flex-1 text-xs">{ws.name}</span>
              <PlanBadge plan={ws.plan} />
              {ws.id === activeWorkspace?.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5 mr-2" />
            <span className="text-xs">Create Team Workspace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base">Create Team Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Input
              placeholder="Team name"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              className="h-9 text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Team workspaces share projects, assets, brand kits, and a credit pool across members.
            </p>
            <Button
              className="w-full gradient-primary text-primary-foreground text-xs h-8"
              onClick={handleCreate}
              disabled={creating || !teamName.trim()}
            >
              {creating ? "Creating..." : "Create Workspace"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
