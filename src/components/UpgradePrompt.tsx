import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TELEGRAM_PAYMENT_URL } from "@/lib/plans";
import { Sparkles, ArrowRight } from "lucide-react";

interface UpgradePromptProps {
  feature: string;
  planRequired?: string;
  compact?: boolean;
}

export function UpgradePrompt({ feature, planRequired = "Pro", compact = false }: UpgradePromptProps) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <button
        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
        onClick={() => navigate("/pricing")}
      >
        <Sparkles className="h-2.5 w-2.5" />
        {planRequired}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-center">
      <Sparkles className="h-5 w-5 text-primary mx-auto mb-2" />
      <p className="text-xs font-medium mb-0.5">{feature} requires {planRequired}</p>
      <p className="text-[10px] text-muted-foreground mb-3">Upgrade your plan to unlock this feature.</p>
      <Button
        size="sm"
        className="h-7 text-[10px] px-4 gradient-primary text-primary-foreground"
        onClick={() => navigate("/pricing")}
      >
        View Plans <ArrowRight className="h-2.5 w-2.5 ml-1" />
      </Button>
    </div>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    pro: "bg-primary/10 text-primary",
    ultra: "bg-accent text-accent-foreground",
    team: "bg-secondary text-secondary-foreground",
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${colors[plan] || colors.free}`}>
      {plan}
    </span>
  );
}
