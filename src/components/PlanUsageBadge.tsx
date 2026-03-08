import { usePlan } from "@/hooks/use-plan";
import { PlanBadge } from "@/components/UpgradePrompt";
import { Zap } from "lucide-react";

export function PlanUsageBadge() {
  const { plan, creditBalance, dailyUsesRemaining, loading } = usePlan();

  if (loading) return null;

  return (
    <div className="flex items-center gap-1.5">
      <PlanBadge plan={plan} />
      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
        <Zap className="h-2.5 w-2.5" />
        {plan === "free" ? `${dailyUsesRemaining}/3` : creditBalance.toLocaleString()}
      </span>
    </div>
  );
}
