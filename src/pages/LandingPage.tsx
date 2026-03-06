import { motion } from "framer-motion";
import { ArrowRight, Layers, Pencil, Sparkles, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Wand2,
    title: "Prompt to Structure",
    desc: "AI analyzes your prompt and converts it into editable scene components.",
  },
  {
    icon: Pencil,
    title: "Edit Elements",
    desc: "Modify individual objects, lighting, camera angles, and styles independently.",
  },
  {
    icon: Layers,
    title: "Version History",
    desc: "Save and compare different scene versions. Iterate with confidence.",
  },
  {
    icon: Sparkles,
    title: "Smart Regeneration",
    desc: "Rebuild optimized prompts from your edits and generate new images instantly.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass">
        <div className="container flex items-center justify-between h-16">
          <span className="font-display text-xl font-bold gradient-text">PromptScene</span>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 scene-grid opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-glow/5 blur-[120px]" />

        <div className="container relative z-10 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              Scene-based AI image editing
            </span>

            <h1 className="text-5xl md:text-7xl font-bold font-display leading-tight mb-6">
              Stop guessing
              <br />
              <span className="gradient-text">prompts.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10">
              Convert prompts into structured scenes. Edit individual elements. 
              Regenerate with precision.
            </p>

            <Button
              size="lg"
              className="gradient-primary text-primary-foreground font-display text-base px-8 h-12 rounded-xl glow-border"
              onClick={() => navigate("/builder")}
            >
              Start Creating
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

          {/* Mock editor preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-16 rounded-2xl border bg-card p-1 shadow-2xl"
          >
            <div className="rounded-xl bg-secondary/50 p-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="font-mono text-sm text-muted-foreground space-y-1">
                <p><span className="text-primary">scene</span>.environment.lighting = <span className="text-accent">"golden hour"</span></p>
                <p><span className="text-primary">scene</span>.objects[0].color = <span className="text-accent">"red"</span> → <span className="text-success">"blue"</span></p>
                <p><span className="text-primary">scene</span>.camera.angle = <span className="text-accent">"low-angle"</span></p>
                <p className="text-primary pt-2">→ Rebuilding prompt... ✓</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Scene editing, not prompt wrestling
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Change a single object without rewriting everything.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-2xl border bg-card p-6 hover:glow-border transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t">
        <div className="container text-center">
          <h2 className="text-3xl font-bold font-display mb-4">Ready to build scenes?</h2>
          <Button
            size="lg"
            className="gradient-primary text-primary-foreground font-display px-8 h-12 rounded-xl"
            onClick={() => navigate("/builder")}
          >
            Open Scene Builder
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container text-center text-sm text-muted-foreground">
          PromptScene — Scene-based AI image editing
        </div>
      </footer>
    </div>
  );
}
