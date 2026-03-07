import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, LayoutTemplate } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TemplateRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  starter_prompt: string;
  scene_json: any;
  is_featured: boolean;
}

const CATEGORIES = ["all", "commercial", "portrait", "creative", "architecture"];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    supabase.from("templates").select("*").order("sort_order").then(({ data }) => {
      if (data) setTemplates(data as TemplateRow[]);
    });
  }, []);

  const filtered = category === "all" ? templates : templates.filter(t => t.category === category);

  const useTemplate = async (t: TemplateRow) => {
    if (!user) { navigate("/auth"); return; }

    const { data, error } = await supabase
      .from("projects")
      .insert({ name: t.title, description: t.description || "", user_id: user.id })
      .select()
      .single();

    if (error) { toast.error(error.message); return; }
    if (!data) return;

    // Create initial scene from template
    await supabase.from("scenes").insert({
      project_id: data.id,
      user_id: user.id,
      original_prompt: t.starter_prompt,
      scene_json: t.scene_json,
      generated_prompt: t.starter_prompt,
    });

    navigate(`/builder/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center h-14 gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-display text-sm font-bold">Templates</span>
        </div>
      </nav>

      <div className="container max-w-4xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-display mb-2">Start from a template</h1>
          <p className="text-sm text-muted-foreground">Pre-configured scenes to jumpstart your projects.</p>
        </div>

        {/* Category filter */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {CATEGORIES.map(c => (
            <Button
              key={c}
              variant={category === c ? "secondary" : "ghost"}
              size="sm"
              className="text-xs h-7 capitalize"
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border bg-card overflow-hidden group"
            >
              <div className="aspect-video bg-muted flex items-center justify-center relative">
                <LayoutTemplate className="h-8 w-8 text-muted-foreground/20" />
                {t.is_featured && (
                  <span className="absolute top-2 right-2 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5" /> Featured
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wider">{t.category}</span>
                </div>
                <h3 className="font-display font-semibold text-sm mb-1">{t.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.description}</p>
                <Button size="sm" className="w-full text-xs h-7" onClick={() => useTemplate(t)}>
                  Use Template
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
