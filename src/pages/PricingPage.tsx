import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, ExternalLink, Zap, MessageCircle, ArrowRight, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { PLANS, PlanDefinition, PlanId, TELEGRAM_PAYMENT_URL } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TEST_EMAIL = "muhammad.gruoth@gmail.com";
const planOrder: PlanDefinition[] = [PLANS.free, PLANS.pro, PLANS.ultra, PLANS.team];

const planDescriptions: Record<PlanId, string> = {
  free: "Try PromptScene with basic scene generation. Perfect for exploring the platform.",
  pro: "For creators and marketers who need ad compositions, brand kits, and unlimited projects.",
  ultra: "For power users who want full control — bring your own API keys, choose providers, and access advanced layered rendering.",
  team: "For organizations that need shared workspaces, pooled credits, and collaborative creative workflows.",
};

const comparisonFeatures = [
  { label: "Scene Mode", free: true, pro: true, ultra: true, team: true },
  { label: "Ad Composition Mode", free: false, pro: true, ultra: true, team: true },
  { label: "Advanced Layered Mode", free: false, pro: false, ultra: true, team: true },
  { label: "Projects", free: "3", pro: "Unlimited", ultra: "Unlimited", team: "Unlimited" },
  { label: "Artboards per project", free: "1", pro: "10", ultra: "50", team: "50" },
  { label: "Objects per artboard", free: "5", pro: "50", ultra: "100", team: "100" },
  { label: "Asset uploads", free: false, pro: true, ultra: true, team: true },
  { label: "Brand kits", free: false, pro: true, ultra: true, team: true },
  { label: "Custom object fields", free: false, pro: true, ultra: true, team: true },
  { label: "BYO API keys", free: false, pro: false, ultra: true, team: true },
  { label: "Provider/model selection", free: false, pro: false, ultra: true, team: true },
  { label: "High-res export (4K)", free: false, pro: false, ultra: true, team: true },
  { label: "Shared workspace", free: false, pro: false, ultra: false, team: true },
  { label: "Shared credit pool", free: false, pro: false, ultra: false, team: true },
  { label: "Team roles & activity log", free: false, pro: false, ultra: false, team: true },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWorkspaceId, refreshWorkspaces } = useWorkspace();

  const isTestUser = user?.email === TEST_EMAIL;

  const handleUpgrade = async (plan: PlanDefinition) => {
    if (plan.id === "free") {
      navigate(user ? "/dashboard" : "/auth");
      return;
    }

    if (isTestUser && activeWorkspaceId) {
      try {
        await supabase.from("workspaces").update({
          plan: plan.id,
          credit_balance: plan.features.monthlyCredits || 10000,
        }).eq("id", activeWorkspaceId);

        await supabase.from("subscription_state").update({
          current_plan: plan.id,
          status: "active",
        }).eq("workspace_id", activeWorkspaceId);

        await refreshWorkspaces();
        toast.success(`Switched to ${plan.name} plan!`);
        navigate("/dashboard");
      } catch (err: any) {
        toast.error(err.message || "Failed to switch plan");
      }
      return;
    }

    window.open(TELEGRAM_PAYMENT_URL, "_blank");
  };

  const renderCell = (val: boolean | string) => {
    if (typeof val === "string") return <span className="text-xs">{val}</span>;
    return val ? <Check className="h-3.5 w-3.5 text-primary mx-auto" /> : <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center h-14 gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-display text-sm font-bold gradient-text cursor-pointer" onClick={() => navigate("/")}>PromptScene</span>
        </div>
      </nav>

      <div className="container max-w-5xl py-16">
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl font-bold font-display mb-3">Choose your plan</h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
            Credits are internal compute units — not image counts. Different modes, resolutions, and providers use different amounts, giving you flexible, transparent pricing.
          </p>
          {isTestUser && (
            <p className="text-xs text-primary mt-3 font-medium bg-primary/10 inline-block px-3 py-1 rounded-full">
              ✨ Test mode — click any plan to activate instantly
            </p>
          )}
        </div>

        {/* Plan Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {planOrder.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-6 flex flex-col ${
                p.popular ? "border-primary shadow-lg ring-1 ring-primary/20 relative" : "bg-card"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full font-medium">
                  Most Popular
                </span>
              )}
              <h3 className="font-display font-semibold text-lg mb-0.5">{p.name}</h3>
              <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">{planDescriptions[p.id]}</p>
              <div className="mb-1">
                <span className="text-3xl font-bold font-display">{p.price}</span>
                <span className="text-xs text-muted-foreground ml-1">{p.priceNote}</span>
              </div>
              <div className="flex items-center gap-1 mb-5">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">{p.credits} {p.creditsNote}</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {p.featureList.map((f) => (
                  <li key={f} className="text-xs flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full text-xs ${p.ctaVariant === "gradient" ? "gradient-primary text-primary-foreground" : ""}`}
                variant={p.ctaVariant === "gradient" ? "default" : p.ctaVariant as any}
                onClick={() => handleUpgrade(p)}
              >
                {isTestUser ? (
                  p.id === "free" ? "Go Free" : `Activate ${p.name}`
                ) : (
                  <>
                    {p.id !== "free" && <ExternalLink className="h-3 w-3 mr-1" />}
                    {p.cta}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mb-16">
          <h2 className="text-xl font-bold font-display text-center mb-8">Compare all features</h2>
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground min-w-[180px]">Feature</th>
                    {planOrder.map(p => (
                      <th key={p.id} className="p-3 font-semibold text-center min-w-[90px]">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((f, i) => (
                    <tr key={f.label} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                      <td className="p-3 text-muted-foreground">{f.label}</td>
                      <td className="p-3 text-center">{renderCell(f.free)}</td>
                      <td className="p-3 text-center">{renderCell(f.pro)}</td>
                      <td className="p-3 text-center">{renderCell(f.ultra)}</td>
                      <td className="p-3 text-center">{renderCell(f.team)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Credit Explanation */}
        <div className="rounded-xl border bg-card p-8 max-w-2xl mx-auto text-center mb-16">
          <Zap className="h-6 w-6 text-primary mx-auto mb-3" />
          <h3 className="font-display font-semibold text-lg mb-2">How credits work</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4 max-w-md mx-auto">
            Credits are internal compute units. A standard 720p scene render costs ~100 units. Higher resolutions, ad compositions, layered generation, and premium providers cost more.
            Free plan gets 3 daily renders. Paid plans get 10,000 units/month.
          </p>
          <p className="text-xs text-muted-foreground">
            Need more? Credits can be recharged anytime.
          </p>
        </div>

        {/* Contact CTA */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Have questions or need a custom plan?</p>
          <Button variant="outline" className="text-xs" onClick={() => window.open(TELEGRAM_PAYMENT_URL, "_blank")}>
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Chat with us on Telegram
          </Button>
        </div>
      </div>
    </div>
  );
}
