// Plan-aware feature gating hook
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, PlanId, PlanFeatures, TELEGRAM_PAYMENT_URL } from "@/lib/plans";
import { toast } from "sonner";

interface PlanState {
  plan: PlanId;
  creditBalance: number;
  dailyUsesRemaining: number;
  loading: boolean;
  workspaceId: string | null;
}

export function usePlan() {
  const { user } = useAuth();
  const [state, setState] = useState<PlanState>({
    plan: "free",
    creditBalance: 0,
    dailyUsesRemaining: 3,
    loading: true,
    workspaceId: null,
  });

  useEffect(() => {
    if (!user) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    loadPlanState();
  }, [user]);

  const loadPlanState = async () => {
    if (!user) return;
    try {
      // Check workspace
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id, plan, credit_balance, daily_credits_used, daily_credits_reset_at")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (workspace) {
        const plan = (workspace.plan || "free") as PlanId;
        const features = PLANS[plan]?.features;
        const dailyLimit = features?.dailyFreeUses ?? 3;
        const resetAt = new Date(workspace.daily_credits_reset_at || Date.now());
        const now = new Date();
        const isNewDay = now.toDateString() !== resetAt.toDateString();

        setState({
          plan,
          creditBalance: workspace.credit_balance || 0,
          dailyUsesRemaining: isNewDay ? dailyLimit : Math.max(0, dailyLimit - (workspace.daily_credits_used || 0)),
          loading: false,
          workspaceId: workspace.id,
        });
      } else {
        // Create default workspace for user
        const { data: newWs } = await supabase
          .from("workspaces")
          .insert({ name: "My Workspace", owner_id: user.id, plan: "free" })
          .select("id")
          .single();

        setState({
          plan: "free",
          creditBalance: 0,
          dailyUsesRemaining: 3,
          loading: false,
          workspaceId: newWs?.id || null,
        });
      }
    } catch (err) {
      console.error("Failed to load plan state:", err);
      setState(s => ({ ...s, loading: false }));
    }
  };

  const features: PlanFeatures = PLANS[state.plan]?.features || PLANS.free.features;

  const canUseFeature = useCallback((feature: keyof PlanFeatures): boolean => {
    return !!features[feature];
  }, [features]);

  const requireFeature = useCallback((feature: keyof PlanFeatures, featureName?: string): boolean => {
    if (canUseFeature(feature)) return true;
    toast.error(`${featureName || feature} requires a plan upgrade`, {
      action: {
        label: "Upgrade",
        onClick: () => window.open(TELEGRAM_PAYMENT_URL, "_blank"),
      },
    });
    return false;
  }, [canUseFeature]);

  const canGenerate = useCallback((): boolean => {
    if (state.plan === "free") {
      return state.dailyUsesRemaining > 0;
    }
    return state.creditBalance > 0;
  }, [state]);

  const consumeCredits = useCallback(async (amount: number, description: string) => {
    if (!user || !state.workspaceId) return false;

    const newBalance = Math.max(0, state.creditBalance - amount);

    await supabase.from("workspaces").update({
      credit_balance: newBalance,
      daily_credits_used: (state.plan === "free")
        ? (PLANS.free.features.dailyFreeUses - state.dailyUsesRemaining + 1)
        : undefined,
    }).eq("id", state.workspaceId);

    await supabase.from("credit_ledger").insert({
      user_id: user.id,
      workspace_id: state.workspaceId,
      amount: -amount,
      balance_after: newBalance,
      operation: "generation",
      description,
    });

    setState(s => ({
      ...s,
      creditBalance: newBalance,
      dailyUsesRemaining: s.plan === "free" ? Math.max(0, s.dailyUsesRemaining - 1) : s.dailyUsesRemaining,
    }));

    return true;
  }, [user, state]);

  return {
    ...state,
    features,
    canUseFeature,
    requireFeature,
    canGenerate,
    consumeCredits,
    refreshPlan: loadPlanState,
  };
}
