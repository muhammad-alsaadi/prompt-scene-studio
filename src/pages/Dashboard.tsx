import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, FolderOpen, Clock, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSceneStore } from "@/store/scene-store";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { resetScene, versions, setCurrentProjectId } = useSceneStore();
  const { user, signOut } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  const loadProjects = async () => {
    const { data } = await supabase.from("projects").select("*").order("updated_at", { ascending: false });
    if (data) setProjects(data);
  };

  const createProject = async () => {
    if (!newName.trim() || !user) return;
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: newName, description: newDesc, user_id: user.id })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
    } else if (data) {
      setCurrentProjectId(data.id);
      resetScene();
      setDialogOpen(false);
      navigate("/builder");
    }
  };

  const handleProjectClick = (project: ProjectRow) => {
    setCurrentProjectId(project.id);
    navigate("/builder");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b glass sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <span className="font-display text-lg font-bold gradient-text cursor-pointer" onClick={() => navigate("/")}>
            PromptScene
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary text-primary-foreground">
                  <Plus className="h-4 w-4 mr-1" /> New Scene
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input placeholder="Project name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                  <Button className="w-full gradient-primary text-primary-foreground" onClick={createProject}>
                    Create & Open Builder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold font-display mb-8">Dashboard</h1>

          <section className="mb-12">
            <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" /> Projects
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border bg-card p-5 hover:glow-border transition-shadow cursor-pointer"
                  onClick={() => handleProjectClick(p)}
                >
                  <h3 className="font-display font-semibold mb-1">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              <div
                className="rounded-xl border-2 border-dashed border-border p-5 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setDialogOpen(true)}
              >
                <div className="text-center text-muted-foreground">
                  <Plus className="h-8 w-8 mx-auto mb-2" />
                  <span className="text-sm">New Project</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Recent Scenes
            </h2>
            {versions.length === 0 ? (
              <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                <p>No scenes yet. Create your first scene to get started.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {versions.slice(0, 6).map((v) => (
                  <div
                    key={v.id}
                    className="rounded-xl border bg-card overflow-hidden cursor-pointer hover:glow-border transition-shadow"
                    onClick={() => {
                      useSceneStore.getState().loadVersion(v);
                      navigate("/builder");
                    }}
                  >
                    {v.image_url && (
                      <img src={v.image_url} alt="Scene" className="w-full h-40 object-cover" />
                    )}
                    <div className="p-4">
                      <p className="text-sm font-medium truncate">{v.scene_data.scene_title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(v.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </motion.div>
      </div>
    </div>
  );
}
