import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Settings, LayoutTemplate, Sparkles, FolderOpen, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSceneStore } from "@/store/scene-store";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePlan } from "@/hooks/use-plan";
import { PlanUsageBadge } from "@/components/PlanUsageBadge";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  preview_image_url: string | null;
  created_at: string;
  updated_at: string;
  workspace_id: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { resetScene } = useSceneStore();
  const { user } = useAuth();
  const { features, workspaceId } = usePlan();
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && activeWorkspaceId) loadProjects();
  }, [user, activeWorkspaceId]);

  const loadProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .or(`workspace_id.eq.${activeWorkspaceId},and(workspace_id.is.null,user_id.eq.${user?.id})`)
      .is("archived_at", null)
      .order("updated_at", { ascending: false });
    if (data) setProjects(data as ProjectRow[]);
    setLoading(false);
  };

  const createProject = async () => {
    if (!newName.trim() || !user) return;
    if (features.maxProjects > 0 && projects.length >= features.maxProjects) {
      toast.error(`You've reached the ${features.maxProjects} project limit on your plan`);
      return;
    }
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: newName,
        description: newDesc,
        user_id: user.id,
        workspace_id: activeWorkspaceId || workspaceId,
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
    } else if (data) {
      if (activeWorkspaceId) {
        await supabase.from("activity_log").insert({
          workspace_id: activeWorkspaceId,
          user_id: user.id,
          action: "project_created",
          entity_type: "project",
          entity_id: data.id,
          metadata: { name: newName },
        });
      }
      resetScene();
      setDialogOpen(false);
      setNewName("");
      setNewDesc("");
      navigate(`/builder/${data.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold gradient-text cursor-pointer" onClick={() => navigate("/")}>
              PromptScene
            </span>
            <WorkspaceSwitcher />
          </div>
          <div className="flex items-center gap-1.5">
            <PlanUsageBadge />
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/templates")}>
              <LayoutTemplate className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Templates</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4" />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary text-primary-foreground">
                  <Plus className="h-4 w-4 mr-1" /> New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input placeholder="Project name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                  {activeWorkspace?.type === "team" && (
                    <p className="text-[10px] text-muted-foreground">
                      This project will be shared with <strong>{activeWorkspace.name}</strong> team members.
                    </p>
                  )}
                  <Button className="w-full gradient-primary text-primary-foreground" onClick={createProject}>
                    Create & Open Builder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      <div className="container py-8 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold font-display">Projects</h1>
              {activeWorkspace?.type === "team" && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Shared in {activeWorkspace.name}
                </p>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
              {features.maxProjects > 0 && ` of ${features.maxProjects}`}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-muted-foreground">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            /* Empty state */
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display font-semibold text-lg mb-2">No projects yet</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first project or start from a template to begin building structured visual scenes.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button className="gradient-primary text-primary-foreground text-xs" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> New Project
                </Button>
                <Button variant="outline" className="text-xs" onClick={() => navigate("/templates")}>
                  <LayoutTemplate className="h-4 w-4 mr-1" /> Browse Templates
                </Button>
              </div>

              {/* Onboarding hints */}
              <div className="mt-12 grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                {[
                  { icon: Sparkles, title: "Write a prompt", desc: "Describe your scene in natural language. AI will structure it into editable objects." },
                  { icon: LayoutTemplate, title: "Use a template", desc: "Start from a pre-configured scene for product ads, portraits, or creative compositions." },
                  { icon: Zap, title: "Generate & iterate", desc: "Choose a rendering mode, generate your image, then tweak and regenerate with precision." },
                ].map(h => (
                  <div key={h.title} className="rounded-xl border bg-card p-4">
                    <h.icon className="h-5 w-5 text-primary mb-2" />
                    <h3 className="font-display font-semibold text-xs mb-1">{h.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{h.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border bg-card overflow-hidden cursor-pointer group transition-shadow hover:shadow-md"
                  onClick={() => navigate(`/builder/${p.id}`)}
                >
                  {p.preview_image_url ? (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img src={p.preview_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted/50 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-sm mb-0.5">{p.name}</h3>
                    {p.description && <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>}
                    <span className="text-[10px] text-muted-foreground mt-2 block">
                      {new Date(p.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))}
              <div
                className="rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors aspect-video sm:aspect-auto sm:min-h-[200px]"
                onClick={() => setDialogOpen(true)}
              >
                <div className="text-center text-muted-foreground">
                  <Plus className="h-6 w-6 mx-auto mb-1.5" />
                  <span className="text-xs">New Project</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
