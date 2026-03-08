import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, LayoutTemplate, Search, Image as ImageIcon, Layout, Layers, Film, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";

interface TemplateRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  starter_prompt: string;
  scene_json: any;
  is_featured: boolean;
  tags: string[] | null;
  preview_url: string | null;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: LayoutTemplate },
  { id: "commercial", label: "Product & Ads", icon: ShoppingBag },
  { id: "portrait", label: "Portraits", icon: ImageIcon },
  { id: "creative", label: "Creative", icon: Sparkles },
  { id: "architecture", label: "Architecture", icon: Layout },
  { id: "cinematic", label: "Cinematic", icon: Film },
  { id: "social", label: "Social Media", icon: Layers },
];

// Fallback templates when DB is empty
const STARTER_TEMPLATES: Omit<TemplateRow, "id">[] = [
  { title: "Product Hero Shot", category: "commercial", description: "Clean product photography with studio lighting and soft shadows. Perfect for e-commerce.", starter_prompt: "A premium wireless headphone on a marble surface with soft studio lighting, minimalist background", scene_json: { objects: [{ name: "Headphone", type: "subject" }, { name: "Surface", type: "background" }] }, is_featured: true, tags: ["product", "ecommerce", "studio"], preview_url: null },
  { title: "Social Media Ad", category: "commercial", description: "Eye-catching social media advertisement layout with product placement and brand colors.", starter_prompt: "Modern social media ad layout with a smartphone product, gradient background, and bold typography space", scene_json: { objects: [{ name: "Phone", type: "subject" }, { name: "Background", type: "background" }] }, is_featured: true, tags: ["social", "ad", "marketing"], preview_url: null },
  { title: "Cinematic Portrait", category: "portrait", description: "Dramatic portrait with cinematic lighting and depth of field.", starter_prompt: "Cinematic portrait with dramatic rim lighting, bokeh background, moody atmosphere", scene_json: { objects: [{ name: "Subject", type: "subject" }, { name: "Background", type: "background" }] }, is_featured: false, tags: ["portrait", "cinematic"], preview_url: null },
  { title: "Fantasy Landscape", category: "creative", description: "Magical fantasy environment with ethereal lighting and epic scale.", starter_prompt: "Epic fantasy landscape with floating islands, magical aurora sky, crystal waterfalls, ethereal fog", scene_json: { objects: [{ name: "Islands", type: "subject" }, { name: "Sky", type: "background" }, { name: "Waterfalls", type: "decorative" }] }, is_featured: true, tags: ["fantasy", "landscape", "environment"], preview_url: null },
  { title: "Modern Interior", category: "architecture", description: "Clean modern interior with natural lighting and contemporary furniture.", starter_prompt: "Minimalist modern living room with floor-to-ceiling windows, natural light, designer furniture", scene_json: { objects: [{ name: "Room", type: "background" }, { name: "Furniture", type: "subject" }] }, is_featured: false, tags: ["interior", "architecture", "modern"], preview_url: null },
  { title: "Food Photography", category: "commercial", description: "Appetizing food scene with warm lighting and styled composition.", starter_prompt: "Overhead food photography of a gourmet breakfast spread on a rustic wooden table, warm morning light", scene_json: { objects: [{ name: "Food", type: "subject" }, { name: "Table", type: "background" }] }, is_featured: false, tags: ["food", "photography", "overhead"], preview_url: null },
  { title: "Instagram Story", category: "social", description: "Vertical story-format template optimized for Instagram engagement.", starter_prompt: "Trendy Instagram story design with gradient overlay, lifestyle photo, modern sans-serif text area", scene_json: { objects: [{ name: "Photo", type: "subject" }, { name: "Overlay", type: "decorative" }] }, is_featured: false, tags: ["instagram", "story", "vertical"], preview_url: null },
  { title: "YouTube Thumbnail", category: "social", description: "High-impact thumbnail designed to maximize click-through rates.", starter_prompt: "Bold YouTube thumbnail with dramatic expression, vibrant background, large readable text area", scene_json: { objects: [{ name: "Subject", type: "subject" }, { name: "Background", type: "background" }, { name: "Text", type: "text" }] }, is_featured: false, tags: ["youtube", "thumbnail", "video"], preview_url: null },
  { title: "Sci-Fi Environment", category: "cinematic", description: "Futuristic sci-fi scene with neon lighting and advanced technology.", starter_prompt: "Cyberpunk cityscape at night with neon signs, rain-slicked streets, holographic advertisements", scene_json: { objects: [{ name: "City", type: "background" }, { name: "Neon Signs", type: "decorative" }] }, is_featured: true, tags: ["scifi", "cyberpunk", "cinematic"], preview_url: null },
];

const categoryIcons: Record<string, typeof LayoutTemplate> = {
  commercial: ShoppingBag,
  portrait: ImageIcon,
  creative: Sparkles,
  architecture: Layout,
  cinematic: Film,
  social: Layers,
};

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from("templates").select("*").order("sort_order").then(({ data }) => {
      if (data && data.length > 0) {
        setTemplates(data as TemplateRow[]);
      } else {
        // Use starter templates as fallback
        setTemplates(STARTER_TEMPLATES.map((t, i) => ({ ...t, id: `starter-${i}` })) as TemplateRow[]);
      }
      setLoading(false);
    });
  }, []);

  const filtered = templates.filter(t => {
    const matchCat = category === "all" || t.category === category;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = filtered.filter(t => t.is_featured);
  const rest = filtered.filter(t => !t.is_featured);

  const useTemplate = async (t: TemplateRow) => {
    if (!user) { navigate("/auth"); return; }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: t.title,
        description: t.description || "",
        user_id: user.id,
        workspace_id: activeWorkspaceId || null,
      })
      .select()
      .single();

    if (error) { toast.error(error.message); return; }
    if (!data) return;

    await supabase.from("scenes").insert({
      project_id: data.id,
      user_id: user.id,
      original_prompt: t.starter_prompt,
      scene_json: t.scene_json,
      generated_prompt: t.starter_prompt,
    });

    toast.success(`Project "${t.title}" created from template`);
    navigate(`/builder/${data.id}`);
  };

  const CategoryIcon = (cat: string) => categoryIcons[cat] || LayoutTemplate;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center h-14 gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-display text-sm font-bold gradient-text cursor-pointer" onClick={() => navigate("/")}>PromptScene</span>
          <div className="flex-1" />
          {user && (
            <Button size="sm" className="text-xs" onClick={() => navigate("/dashboard")}>Dashboard</Button>
          )}
        </div>
      </nav>

      <div className="container max-w-5xl py-10">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">Templates</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Pre-configured scenes to jumpstart your projects. Choose a template, customize it, and generate.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-xs pl-9"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {CATEGORIES.map(c => (
              <Button
                key={c.id}
                variant={category === c.id ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setCategory(c.id)}
              >
                <c.icon className="h-3 w-3 mr-1" />
                {c.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">Loading templates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <LayoutTemplate className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">No templates found</p>
            <p className="text-xs text-muted-foreground">Try a different category or search term.</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && (
              <div className="mb-10">
                <h2 className="text-sm font-display font-semibold mb-4 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Featured
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featured.map((t, i) => (
                    <TemplateCard key={t.id} t={t} i={i} onUse={useTemplate} />
                  ))}
                </div>
              </div>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <div>
                {featured.length > 0 && <h2 className="text-sm font-display font-semibold mb-4">All templates</h2>}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rest.map((t, i) => (
                    <TemplateCard key={t.id} t={t} i={i} onUse={useTemplate} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TemplateCard({ t, i, onUse }: { t: TemplateRow; i: number; onUse: (t: TemplateRow) => void }) {
  const Icon = categoryIcons[t.category] || LayoutTemplate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className="rounded-xl border bg-card overflow-hidden group hover:shadow-md transition-shadow"
    >
      <div className="aspect-video bg-muted/50 flex items-center justify-center relative overflow-hidden">
        {t.preview_url ? (
          <img src={t.preview_url} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="text-center">
            <Icon className="h-8 w-8 text-muted-foreground/20 mx-auto mb-1" />
            <p className="text-[9px] text-muted-foreground/40 capitalize">{t.category}</p>
          </div>
        )}
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
        {t.tags && t.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {t.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{tag}</span>
            ))}
          </div>
        )}
        <Button size="sm" className="w-full text-xs h-8 gradient-primary text-primary-foreground" onClick={() => onUse(t)}>
          Use Template
        </Button>
      </div>
    </motion.div>
  );
}
