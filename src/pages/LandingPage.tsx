import { motion } from "framer-motion";
import {
  ArrowRight, Layers, Pencil, Sparkles, Wand2, Check, Star,
  Image as ImageIcon, Layout, Zap, ExternalLink, ChevronDown,
  Upload, Palette, Users, Shield, Monitor, MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PLANS, TELEGRAM_PAYMENT_URL } from "@/lib/plans";
import { useState } from "react";

const features = [
  { icon: Wand2, title: "AI Scene Analysis", desc: "Paste a prompt — AI breaks it into structured scene components you can edit individually." },
  { icon: Pencil, title: "Element-Level Editing", desc: "Change a single object's material, color, or lighting without rewriting the entire prompt." },
  { icon: Layers, title: "Multi-Artboard Workspace", desc: "Work across multiple artboards per project with different sizes and compositions." },
  { icon: Sparkles, title: "Smart Regeneration", desc: "Prompt is rebuilt automatically from your edits. One click to generate." },
  { icon: Layout, title: "Ad Composition Mode", desc: "Upload products and logos. Generate polished ad-style compositions with brand kits." },
  { icon: Upload, title: "Asset Library & Brand Kits", desc: "Organize logos, product shots, and brand colors. Reuse them across every project." },
];

const steps = [
  { num: "01", title: "Describe your scene", desc: "Write a natural-language prompt — or start from a template." },
  { num: "02", title: "AI structures it", desc: "Objects, environment, camera, lighting, and style are extracted into editable fields." },
  { num: "03", title: "Edit visually", desc: "Swap objects, tweak materials, adjust camera — all without rewriting." },
  { num: "04", title: "Generate with precision", desc: "Choose Scene, Ad Composition, or Layered mode. One click to render." },
];

const testimonials = [
  { name: "Sarah K.", role: "Product Designer", quote: "Finally I can tweak one object without guessing the entire prompt again. This is how AI image tools should work.", stars: 5 },
  { name: "Marcus R.", role: "Creative Director", quote: "The ad composition mode is a game-changer for our marketing team. Brand kits make it even better.", stars: 5 },
  { name: "Lena T.", role: "Photographer", quote: "Multi-artboard workspace and version history save me hours every week. Love the structured approach.", stars: 5 },
];

const faqs = [
  { q: "How are credits different from image counts?", a: "Credits are internal compute units. Different modes, resolutions, and providers consume different amounts — a 720p scene render costs less than a 4K layered composition. This gives you flexible, transparent pricing." },
  { q: "What is Ad Composition Mode?", a: "It lets you upload product images, logos, and brand assets, then generates polished marketing visuals that incorporate them. Think product ads, social media campaigns, and branded content." },
  { q: "Can I bring my own API keys?", a: "Yes — Ultra plan users can connect their own OpenAI, Stability AI, or fal.ai keys for direct provider access. All other plans use our curated, built-in AI engine." },
  { q: "What's the Team plan?", a: "Team gives your organization a shared workspace with shared projects, assets, brand kits, and a pooled credit balance. Everyone works from the same creative infrastructure." },
  { q: "How do I upgrade or pay?", a: "Currently, upgrades are handled through our Telegram support channel. We'll walk you through activation in under a minute. Stripe checkout is coming soon." },
];

const audiences = [
  { icon: Monitor, title: "Content creators", desc: "Create social posts, thumbnails, and illustrations faster with structured editing." },
  { icon: Palette, title: "Marketers & advertisers", desc: "Build ad compositions with product images, logos, and brand consistency." },
  { icon: Users, title: "Creative teams", desc: "Collaborate on shared projects with team workspaces and pooled credits." },
];

const planCards = [PLANS.free, PLANS.pro, PLANS.ultra, PLANS.team];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleCTA = () => navigate(user ? "/dashboard" : "/auth");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container flex items-center justify-between h-14">
          <span className="font-display text-lg font-bold gradient-text cursor-pointer" onClick={() => navigate("/")}>PromptScene</span>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="text-xs hidden sm:inline-flex" onClick={() => navigate("/templates")}>Templates</Button>
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
      <section className="pt-28 pb-24 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="container relative z-10 text-center max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-block px-3 py-1 mb-6 text-[11px] font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              Structured visual composition platform
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display leading-[1.08] mb-5">
              Edit scenes,{" "}
              <span className="gradient-text">not prompts.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
              Stop rewriting entire prompts to change one detail. PromptScene converts your ideas into structured scenes you can edit object-by-object — then renders with precision.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="lg" className="gradient-primary text-primary-foreground font-display text-sm h-12 px-7 rounded-xl" onClick={handleCTA}>
                Start Creating Free <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-sm h-12 px-7 rounded-xl" onClick={() => navigate("/templates")}>
                Browse Templates
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-4">Free plan · No credit card · 3 renders/day</p>
          </motion.div>

          {/* Mock editor */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 rounded-xl border bg-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b bg-muted/30">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
              <span className="ml-3 text-[10px] text-muted-foreground font-medium">PromptScene Editor — Product Ad Campaign</span>
            </div>
            <div className="grid grid-cols-[1fr_2fr_1fr] divide-x min-h-[200px]">
              <div className="p-3 text-left space-y-2">
                <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Layers</p>
                <div className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary font-medium">▸ Product Hero</div>
                <div className="text-[10px] px-2 py-1 rounded text-muted-foreground">　Logo</div>
                <div className="text-[10px] px-2 py-1 rounded text-muted-foreground">　Background</div>
                <div className="text-[10px] px-2 py-1 rounded text-muted-foreground">　Headline Text</div>
              </div>
              <div className="p-4 flex items-center justify-center bg-muted/20">
                <div className="w-full aspect-video rounded-lg border-2 border-dashed border-primary/20 flex items-center justify-center">
                  <div className="text-center">
                    <Layout className="h-8 w-8 text-primary/30 mx-auto mb-2" />
                    <p className="text-[10px] text-muted-foreground">1080 × 1080 · Instagram Ad</p>
                  </div>
                </div>
              </div>
              <div className="p-3 text-left space-y-2">
                <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Inspector</p>
                <div className="space-y-1.5">
                  <div><span className="text-[9px] text-muted-foreground">Type</span><p className="text-[10px]">Subject</p></div>
                  <div><span className="text-[9px] text-muted-foreground">Material</span><p className="text-[10px]">Glossy ceramic</p></div>
                  <div><span className="text-[9px] text-muted-foreground">Lighting</span><p className="text-[10px]">Studio soft</p></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t bg-muted/30">
        <div className="container max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-3">How it works</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">From prompt to polished visual in four steps — with full control at every stage.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <span className="text-4xl font-display font-bold text-primary/15">{s.num}</span>
                <h3 className="font-display font-semibold mt-1 mb-1.5 text-sm">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Generation Modes */}
      <section className="py-20 border-t">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-3">Three rendering modes</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">Each mode is designed for a different creative workflow — from quick scenes to advanced layered compositions.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: ImageIcon, title: "Scene Mode", desc: "Generate the full scene as one coherent image. Best for natural scenes, illustrations, and quick concepts.", plans: "All plans", badge: "Default" },
              { icon: Layout, title: "Ad Composition", desc: "Upload product images and logos. Generate polished marketing visuals with brand consistency.", plans: "Pro, Ultra, Team", badge: "Pro+" },
              { icon: Layers, title: "Advanced Layered", desc: "Generate background and elements as separate layers for maximum creative control and compositing.", plans: "Ultra, Team", badge: "Ultra+" },
            ].map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border bg-card p-6 relative"
              >
                <span className="absolute top-4 right-4 text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{m.badge}</span>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <m.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2">{m.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{m.desc}</p>
                <p className="text-[10px] text-muted-foreground">{m.plans}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t bg-muted/30">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-3">Built for precision</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">A visual composition platform — not another prompt box.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 border-t">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-3">Who it's for</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {audiences.map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <a.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-sm mb-1">{a.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 border-t bg-muted/30">
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
                <p className="text-sm mb-4 leading-relaxed">"{t.quote}"</p>
                <div>
                  <p className="text-xs font-semibold">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 border-t" id="pricing">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-3">Simple, transparent pricing</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">Start free. Upgrade when you need more power, modes, or team features.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {planCards.map((p) => (
              <div key={p.id} className={`rounded-xl border p-5 flex flex-col ${p.popular ? "border-primary shadow-lg ring-1 ring-primary/20 relative" : "bg-card"}`}>
                {p.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full font-medium">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display font-semibold mb-1">{p.name}</h3>
                <div className="mb-1">
                  <span className="text-2xl font-bold font-display">{p.price}</span>
                  <span className="text-xs text-muted-foreground ml-1">{p.priceNote}</span>
                </div>
                <div className="flex items-center gap-1 mb-4">
                  <Zap className="h-3 w-3 text-primary" />
                  <span className="text-[10px] text-muted-foreground">{p.credits}</span>
                </div>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {p.featureList.slice(0, 4).map((f) => (
                    <li key={f} className="text-xs flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full text-xs h-8 ${p.ctaVariant === "gradient" ? "gradient-primary text-primary-foreground" : ""}`}
                  variant={p.ctaVariant === "gradient" ? "default" : p.ctaVariant as any}
                  onClick={() => p.id === "free" ? handleCTA() : navigate("/pricing")}
                >
                  {p.cta}
                </Button>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/pricing")}>
              Compare all features <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t bg-muted/30">
        <div className="container max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 ml-2 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="px-4 pb-4"
                  >
                    <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t">
        <div className="container text-center max-w-lg">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold font-display mb-3">Ready to build scenes?</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">Stop guessing prompts. Start editing structured scenes with precision and control.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" className="gradient-primary text-primary-foreground font-display text-sm h-12 px-8 rounded-xl" onClick={handleCTA}>
              Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="text-sm h-12 px-6 rounded-xl" onClick={() => window.open(TELEGRAM_PAYMENT_URL, "_blank")}>
              <MessageCircle className="h-4 w-4 mr-1.5" /> Talk to Us
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-sm font-bold gradient-text">PromptScene</span>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button onClick={() => navigate("/pricing")} className="hover:text-foreground transition-colors">Pricing</button>
            <button onClick={() => navigate("/templates")} className="hover:text-foreground transition-colors">Templates</button>
            <a href={TELEGRAM_PAYMENT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} PromptScene</p>
        </div>
      </footer>
    </div>
  );
}
