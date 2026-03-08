// Plan-aware feature gating hook with workspace context
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
  workspaceType: "personal" | "team";
}

export function usePlan() {
  const { user } = useAuth();
  const [state, setState] = useState<PlanState>({
    plan: "free",
    creditBalance: 0,
    dailyUsesRemaining: 3,
    loading: true,
    workspaceId: null,
    workspaceType: "personal",
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
      // Check active workspace from localStorage first
      const savedWs = localStorage.getItem("ps_active_workspace");

      // Load from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("personal_workspace_id")
        .eq("user_id", user.id)
        .maybeSingle();

      let workspaceId = savedWs || profile?.personal_workspace_id;

      // Validate workspace access
      if (workspaceId) {
        const { data: ws } = await supabase
          .from("workspaces")
          .select("id, plan, credit_balance, daily_credits_used, daily_credits_reset_at, type")
          .eq("id", workspaceId)
          .maybeSingle();

        if (ws) {
          const plan = (ws.plan || "free") as PlanId;
          const features = PLANS[plan]?.features;
          const dailyLimit = features?.dailyFreeUses ?? 3;
          const resetAt = new Date(ws.daily_credits_reset_at || Date.now());
          const now = new Date();
          const isNewDay = now.toDateString() !== resetAt.toDateString();

          if (plan === "free" && isNewDay) {
            await supabase.from("workspaces").update({
              daily_credits_used: 0,
              daily_credits_reset_at: now.toISOString(),
            }).eq("id", ws.id);
          }

          setState({
            plan,
            creditBalance: ws.credit_balance || 0,
            dailyUsesRemaining: isNewDay ? dailyLimit : Math.max(0, dailyLimit - (ws.daily_credits_used || 0)),
            loading: false,
            workspaceId: ws.id,
            workspaceType: (ws.type as "personal" | "team") || "personal",
          });
          return;
        }
      }

      // Fallback: find personal workspace
      if (!workspaceId) {
        const { data: workspace } = await supabase
          .from("workspaces")
          .select("id, plan, credit_balance, daily_credits_used, daily_credits_reset_at, type")
          .eq("owner_id", user.id)
          .eq("type", "personal")
          .limit(1)
          .maybeSingle();

        if (workspace) {
          workspaceId = workspace.id;
          const plan = (workspace.plan || "free") as PlanId;
          const features = PLANS[plan]?.features;
          const dailyLimit = features?.dailyFreeUses ?? 3;

          setState({
            plan,
            creditBalance: workspace.credit_balance || 0,
            dailyUsesRemaining: dailyLimit,
            loading: false,
            workspaceId: workspace.id,
            workspaceType: "personal",
          });
          return;
        }
      }

      setState(s => ({ ...s, loading: false, workspaceId: workspaceId || null }));
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

    if (state.plan === "free") {
      const newUsed = PLANS.free.features.dailyFreeUses - state.dailyUsesRemaining + 1;
      await supabase.from("workspaces").update({
        daily_credits_used: newUsed,
        daily_credits_reset_at: new Date().toISOString(),
      }).eq("id", state.workspaceId);

      await supabase.from("usage_events").insert({
        user_id: user.id,
        workspace_id: state.workspaceId,
        event_type: "generation",
        credits_used: 0,
        metadata: { description, plan: "free" },
      });

      setState(s => ({ ...s, dailyUsesRemaining: Math.max(0, s.dailyUsesRemaining - 1) }));
      return true;
    }

    const newBalance = Math.max(0, state.creditBalance - amount);

    await supabase.from("workspaces").update({
      credit_balance: newBalance,
    }).eq("id", state.workspaceId);

    const { data: usageEvent } = await supabase.from("usage_events").insert({
      user_id: user.id,
      workspace_id: state.workspaceId,
      event_type: "generation",
      credits_used: amount,
      metadata: { description },
    }).select("id").single();

    await supabase.from("credit_ledger").insert({
      user_id: user.id,
      workspace_id: state.workspaceId,
      amount: -amount,
      balance_after: newBalance,
      operation: "generation",
      description,
      related_usage_event_id: usageEvent?.id || null,
    });

    setState(s => ({ ...s, creditBalance: newBalance }));
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
