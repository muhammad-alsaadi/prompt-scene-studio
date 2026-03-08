import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePlan } from "@/hooks/use-plan";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PLANS, TELEGRAM_PAYMENT_URL } from "@/lib/plans";
import { ArrowLeft, LogOut, User, Palette, Settings, Sparkles, Zap, ExternalLink, CreditCard } from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { plan, creditBalance, dailyUsesRemaining, features } = usePlan();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  const currentPlan = PLANS[plan];

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.display_name) setDisplayName(data.display_name);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center h-14 gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-display text-sm font-bold">Settings</span>
        </div>
      </nav>

      <div className="container max-w-lg py-8 space-y-6">
        {/* Profile */}
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-primary" /> Profile
          </h2>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input value={user?.email || ""} disabled className="h-8 text-xs mt-0.5 bg-muted" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-8 text-xs mt-0.5" />
            </div>
            <Button size="sm" className="text-xs h-8" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </section>

        {/* Plan & Usage */}
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-primary" /> Plan & Usage
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Current Plan</p>
                <p className="text-lg font-display font-bold">{currentPlan?.name || "Free"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {plan === "free" ? `${dailyUsesRemaining} uses remaining today` : `${creditBalance.toLocaleString()} credits`}
                </p>
              </div>
            </div>
            {plan === "free" && (
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Upgrade to unlock unlimited projects, Ad Composition mode, brand kits, and 10,000 compute units/month.
                </p>
                <Button
                  size="sm"
                  className="text-xs h-7 gradient-primary text-primary-foreground"
                  onClick={() => window.open(TELEGRAM_PAYMENT_URL, "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" /> Upgrade via Telegram
                </Button>
              </div>
            )}
            {plan !== "free" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => window.open(TELEGRAM_PAYMENT_URL, "_blank")}
                >
                  <Zap className="h-3 w-3 mr-1" /> Recharge Credits
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => navigate("/pricing")}
                >
                  View Plans
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Appearance */}
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4">
            <Palette className="h-4 w-4 text-primary" /> Appearance
          </h2>
          <div>
            <Label className="text-xs text-muted-foreground">Theme</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
              <SelectTrigger className="h-8 text-xs mt-0.5 w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Generation Defaults */}
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" /> Generation Defaults
          </h2>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Default Quality</Label>
              <Select defaultValue="high">
                <SelectTrigger className="h-8 text-xs mt-0.5 w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="ultra">Ultra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Default Generation Mode</Label>
              <Select defaultValue="scene">
                <SelectTrigger className="h-8 text-xs mt-0.5 w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scene">Scene Mode</SelectItem>
                  <SelectItem value="ad_composition" disabled={!features.adCompositionMode}>Ad Composition {!features.adCompositionMode && "(Pro)"}</SelectItem>
                  <SelectItem value="advanced_layered" disabled={!features.advancedLayeredMode}>Advanced Layered {!features.advancedLayeredMode && "(Ultra)"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Default Model</Label>
              <Select defaultValue="default">
                <SelectTrigger className="h-8 text-xs mt-0.5 w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (PromptScene AI)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Account */}
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-primary" /> Account
          </h2>
          <Button variant="outline" size="sm" className="text-xs h-8 text-destructive hover:text-destructive" onClick={handleSignOut}>
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
          </Button>
        </section>
      </div>
    </div>
  );
}
