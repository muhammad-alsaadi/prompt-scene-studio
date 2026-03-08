import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/use-plan";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { PLANS, TELEGRAM_PAYMENT_URL } from "@/lib/plans";
import { CreditCard, Zap, MessageCircle } from "lucide-react";

export function SettingsPlanSection() {
  const navigate = useNavigate();
  const { plan, creditBalance, dailyUsesRemaining, features } = usePlan();
  const { activeWorkspace } = useWorkspace();
  const currentPlan = PLANS[plan];
  const isTeam = activeWorkspace?.type === "team";

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4">
        <CreditCard className="h-4 w-4 text-primary" /> Plan & Usage
      </h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Current Plan</p>
            <p className="text-xl font-display font-bold">{currentPlan?.name || "Free"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {plan === "free"
                ? `${dailyUsesRemaining} of 3 daily renders left`
                : `${creditBalance.toLocaleString()} credits remaining`}
            </p>
            {isTeam && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                <Zap className="h-2.5 w-2.5" /> Shared team pool
              </p>
            )}
          </div>
        </div>

        {/* Usage bar */}
        {plan !== "free" && currentPlan?.features.monthlyCredits > 0 && (
          <div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>Credits used</span>
              <span>{(currentPlan.features.monthlyCredits - creditBalance).toLocaleString()} / {currentPlan.features.monthlyCredits.toLocaleString()}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full gradient-primary transition-all"
                style={{ width: `${Math.min(100, ((currentPlan.features.monthlyCredits - creditBalance) / currentPlan.features.monthlyCredits) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {plan === "free" ? (
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
            <p className="text-xs font-medium mb-1">Unlock more with Pro</p>
            <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
              Unlimited projects, Ad Composition mode, brand kits, asset uploads, and 10,000 compute units/month.
            </p>
            <Button
              size="sm"
              className="text-xs h-7 gradient-primary text-primary-foreground"
              onClick={() => navigate("/pricing")}
            >
              View Plans
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => window.open(TELEGRAM_PAYMENT_URL, "_blank")}>
              <Zap className="h-3 w-3 mr-1" /> Recharge Credits
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => navigate("/pricing")}>
              Change Plan
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => window.open(TELEGRAM_PAYMENT_URL, "_blank")}>
              <MessageCircle className="h-3 w-3 mr-1" /> Support
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
