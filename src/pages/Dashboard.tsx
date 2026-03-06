import { motion } from "framer-motion";
import { Plus, FolderOpen, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSceneStore } from "@/store/scene-store";

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects, versions, resetScene } = useSceneStore();

  const handleNewScene = () => {
    resetScene();
    navigate("/builder");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b glass sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <span
            className="font-display text-lg font-bold gradient-text cursor-pointer"
            onClick={() => navigate("/")}
          >
            PromptScene
          </span>
          <Button size="sm" className="gradient-primary text-primary-foreground" onClick={handleNewScene}>
            <Plus className="h-4 w-4 mr-1" /> New Scene
          </Button>
        </div>
      </nav>

      <div className="container py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold font-display mb-8">Dashboard</h1>

          {/* Projects */}
          <section className="mb-12">
            <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" /> Projects
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border bg-card p-5 hover:glow-border transition-shadow cursor-pointer"
                  onClick={() => navigate("/builder")}
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
                onClick={handleNewScene}
              >
                <div className="text-center text-muted-foreground">
                  <Plus className="h-8 w-8 mx-auto mb-2" />
                  <span className="text-sm">New Project</span>
                </div>
              </div>
            </div>
          </section>

          {/* Recent versions */}
          <section>
            <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Recent Scenes
            </h2>
            {versions.length === 0 ? (
              <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                <p className="mb-3">No scenes yet. Create your first scene to get started.</p>
                <Button variant="outline" onClick={handleNewScene}>
                  Create Scene
                </Button>
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
