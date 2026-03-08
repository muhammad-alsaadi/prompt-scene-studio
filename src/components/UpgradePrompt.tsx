import { Button } from "@/components/ui/button";
import { TELEGRAM_PAYMENT_URL } from "@/lib/plans";
import { ExternalLink, Sparkles } from "lucide-react";

interface UpgradePromptProps {
  feature: string;
  planRequired?: string;
  compact?: boolean;
}

export function UpgradePrompt({ feature, planRequired = "Pro", compact = false }: UpgradePromptProps) {
  if (compact) {
    return (
      <button
        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
        onClick={() => window.open(TELEGRAM_PAYMENT_URL, "_blank")}
      >
        <Sparkles className="h-2.5 w-2.5" />
        {planRequired}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-primary/10 bg-primary/5 p-3 text-center">
      <Sparkles className="h-4 w-4 text-primary mx-auto mb-1.5" />
      <p className="text-xs font-medium mb-0.5">{feature} requires {planRequired}</p>
      <p className="text-[10px] text-muted-foreground mb-2">Upgrade to unlock this feature</p>
      <Button
        size="sm"
        className="h-6 text-[10px] px-3 gradient-primary text-primary-foreground"
        onClick={() => window.open(TELEGRAM_PAYMENT_URL, "_blank")}
      >
        <ExternalLink className="h-2.5 w-2.5 mr-1" /> Upgrade
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
