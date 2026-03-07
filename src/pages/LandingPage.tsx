import { motion } from "framer-motion";
import { ArrowRight, Layers, Pencil, Sparkles, Wand2, Check, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";


const features = [
  { icon: Wand2, title: "AI Scene Analysis", desc: "Paste a prompt. AI breaks it into structured scene components you can edit individually." },
  { icon: Pencil, title: "Element-Level Editing", desc: "Change a single object, material, or lighting without rewriting the entire prompt." },
  { icon: Layers, title: "Version Control", desc: "Every generation is saved. Compare, restore, and iterate with full history." },
  { icon: Sparkles, title: "Smart Regeneration", desc: "Prompt is rebuilt automatically from your edits. One click to generate." },
];

const steps = [
  { num: "01", title: "Write a prompt", desc: "Describe the scene you want to create in plain language." },
  { num: "02", title: "AI structures it", desc: "Objects, environment, camera, and style are extracted into editable fields." },
  { num: "03", title: "Edit anything", desc: "Swap a tree for a building. Change lighting from noon to sunset." },
  { num: "04", title: "Generate", desc: "Prompt rebuilds automatically. Generate with one click." },
];

const testimonials = [
  { name: "Sarah K.", role: "Product Designer", quote: "Finally I can tweak one object without guessing the entire prompt again.", stars: 5 },
  { name: "Marcus R.", role: "Creative Director", quote: "This is how AI image tools should work. Structured, predictable, powerful.", stars: 5 },
  { name: "Lena T.", role: "Photographer", quote: "The version history alone saves me hours of work every week.", stars: 5 },
];

const plans = [
  { name: "Free", price: "$0", period: "/month", features: ["5 generations/day", "3 projects", "Basic templates", "720p export"], cta: "Get Started" },
  { name: "Pro", price: "$19", period: "/month", features: ["Unlimited generations", "Unlimited projects", "All templates", "4K export", "Priority support", "Version history"], cta: "Start Free Trial", popular: true },
  { name: "Team", price: "$49", period: "/month", features: ["Everything in Pro", "Team workspace", "API access", "Custom templates", "SSO"], cta: "Contact Sales" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  

  const handleCTA = () => navigate(user ? "/dashboard" : "/auth");

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container flex items-center justify-between h-14">
          <span className="font-display text-lg font-bold gradient-text">PromptScene</span>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/pricing")}>Pricing</Button>
            {user ? (
              <Button size="sm" className="text-xs" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/auth")}>Sign In</Button>
                <Button size="sm" className="gradient-primary text-primary-foreground text-xs" onClick={handleCTA}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="container relative z-10 text-center max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-block px-3 py-1 mb-5 text-[11px] font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              Structured AI image editing
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display leading-[1.1] mb-5">
              Edit scenes,{" "}
              <span className="gradient-text">not prompts.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
              Convert any image prompt into structured components. Edit individual elements. Regenerate with precision.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button size="lg" className="gradient-primary text-primary-foreground font-display text-sm h-11 px-6 rounded-xl" onClick={handleCTA}>
                Start Creating <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-sm h-11 px-6 rounded-xl" onClick={() => navigate("/templates")}>
                View Templates
              </Button>
            </div>
          </motion.div>

          {/* Mock editor */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14 rounded-xl border bg-card shadow-xl overflow-hidden"
          >
            <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-muted/30">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
              <span className="ml-2 text-[10px] text-muted-foreground">PromptScene Builder</span>
            </div>
            <div className="p-5 text-left font-mono text-xs text-muted-foreground space-y-1">
              <p><span className="text-primary">scene</span>.environment.lighting = <span className="text-green-500 dark:text-green-400">"golden hour"</span></p>
              <p><span className="text-primary">scene</span>.objects[0].color = <span className="line-through text-destructive/60">"red"</span> → <span className="text-green-500 dark:text-green-400">"blue"</span></p>
              <p><span className="text-primary">scene</span>.camera.angle = <span className="text-green-500 dark:text-green-400">"low-angle"</span></p>
              <p className="text-primary pt-1">→ Prompt rebuilt automatically ✓</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t">
        <div className="container max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-center mb-12">How it works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <span className="text-3xl font-display font-bold text-primary/20">{s.num}</span>
                <h3 className="font-display font-semibold mt-1 mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t">
        <div className="container max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-center mb-4">Built for precision</h2>
          <p className="text-muted-foreground text-center mb-12 text-sm">Change a single element without rewriting everything.</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 border-t">
        <div className="container max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-center mb-12">What people say</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border bg-card p-5"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm mb-3 leading-relaxed">"{t.quote}"</p>
                <div>
                  <p className="text-xs font-semibold">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 border-t" id="pricing">
        <div className="container max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-center mb-3">Simple pricing</h2>
          <p className="text-muted-foreground text-center mb-10 text-sm">Start free. Scale when you're ready.</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {plans.map((p) => (
              <div key={p.name} className={`rounded-xl border p-5 ${p.popular ? "border-primary shadow-lg ring-1 ring-primary/20 relative" : "bg-card"}`}>
                {p.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display font-semibold mb-1">{p.name}</h3>
                <div className="mb-4">
                  <span className="text-2xl font-bold font-display">{p.price}</span>
                  <span className="text-xs text-muted-foreground">{p.period}</span>
                </div>
                <ul className="space-y-1.5 mb-5">
                  {p.features.map((f) => (
                    <li key={f} className="text-xs flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full text-xs h-8 ${p.popular ? "gradient-primary text-primary-foreground" : ""}`}
                  variant={p.popular ? "default" : "outline"}
                  onClick={handleCTA}
                >
                  {p.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t">
        <div className="container text-center max-w-lg">
          <h2 className="text-2xl font-bold font-display mb-3">Ready to build scenes?</h2>
          <p className="text-sm text-muted-foreground mb-6">Stop guessing prompts. Start editing scenes.</p>
          <Button size="lg" className="gradient-primary text-primary-foreground font-display text-sm h-11 px-8 rounded-xl" onClick={handleCTA}>
            Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </section>

      <footer className="py-6 border-t">
        <div className="container text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} PromptScene. Scene-based AI image editing.
        </div>
      </footer>
    </div>
  );
}
