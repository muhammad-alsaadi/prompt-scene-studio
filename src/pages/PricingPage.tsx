import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, ExternalLink, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { PLANS, PlanDefinition, PlanId, TELEGRAM_PAYMENT_URL } from "@/lib/plans";
import { GENERATION_MODES } from "@/lib/providers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TEST_EMAIL = "muhammad.gruoth@gmail.com";
const planOrder: PlanDefinition[] = [PLANS.free, PLANS.pro, PLANS.ultra, PLANS.team];

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

    // Test user gets instant plan switching
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

    // Normal users go to Telegram
    window.open(TELEGRAM_PAYMENT_URL, "_blank");
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
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold font-display mb-3">Simple, transparent pricing</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Credits are compute units — not "number of images." Different generation modes and providers consume different amounts.
          </p>
          {isTestUser && (
            <p className="text-xs text-primary mt-2 font-medium">
              ✨ Test mode: Click any plan button to activate it instantly
            </p>
          )}
        </div>

        {/* Plan Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {planOrder.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-5 flex flex-col ${
                p.popular
                  ? "border-primary shadow-lg ring-1 ring-primary/20 relative"
                  : "bg-card"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full font-medium">
                  Most Popular
                </span>
              )}
              <h3 className="font-display font-semibold text-lg mb-1">{p.name}</h3>
              <div className="mb-1">
                <span className="text-3xl font-bold font-display">{p.price}</span>
                <span className="text-xs text-muted-foreground ml-1">{p.priceNote}</span>
              </div>
              <div className="flex items-center gap-1 mb-4">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">{p.credits} {p.creditsNote}</span>
              </div>
              <ul className="space-y-1.5 mb-5 flex-1">
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

        {/* Generation Modes Explanation */}
        <div className="mb-16">
          <h2 className="text-xl font-bold font-display text-center mb-2">Generation Modes</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">Different modes for different creative needs</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {GENERATION_MODES.map((m) => (
              <div key={m.id} className="rounded-xl border bg-card p-5">
                <h3 className="font-display font-semibold text-sm mb-1">{m.name}</h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{m.description}</p>
                <div className="flex flex-wrap gap-1">
                  {m.availableOnPlans.map(pl => (
                    <span key={pl} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground capitalize">{pl}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Explanation */}
        <div className="rounded-xl border bg-card p-6 max-w-2xl mx-auto text-center">
          <h3 className="font-display font-semibold mb-2">How credits work</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Credits are internal compute units. A standard scene render costs ~100 units.
            Higher resolutions, layered generation, background removal, and premium providers cost more.
            Free plan gets 3 daily standard renders. Paid plans get 10,000 units/month.
          </p>
          <p className="text-xs text-muted-foreground">
            Need more? Credits can be recharged anytime.{" "}
            <a href={TELEGRAM_PAYMENT_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Contact us via Telegram
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
