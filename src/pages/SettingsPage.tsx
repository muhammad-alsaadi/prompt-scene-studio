import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { usePlan } from "@/hooks/use-plan";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PLANS, TELEGRAM_PAYMENT_URL } from "@/lib/plans";
import {
  ArrowLeft, LogOut, User, Palette, Sparkles, Zap,
  CreditCard, Building2, Image, Activity, MessageCircle,
} from "lucide-react";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";
import { TeamSettingsPanel } from "@/components/workspace/TeamSettingsPanel";
import { TeamActivityPanel } from "@/components/workspace/TeamActivityPanel";
import { SharedAssetsPanel } from "@/components/workspace/SharedAssetsPanel";
import { SharedBrandKitsPanel } from "@/components/workspace/SharedBrandKitsPanel";
import { SettingsProfileSection } from "@/components/settings/SettingsProfileSection";
import { SettingsPlanSection } from "@/components/settings/SettingsPlanSection";
import { SettingsAppearanceSection } from "@/components/settings/SettingsAppearanceSection";
import { SettingsGenerationSection } from "@/components/settings/SettingsGenerationSection";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { activeWorkspace } = useWorkspace();

  const isTeam = activeWorkspace?.type === "team";

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
          <div className="flex-1" />
          <WorkspaceSwitcher />
        </div>
      </nav>

      <div className="container max-w-2xl py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="profile" className="text-xs">
              <User className="h-3 w-3 mr-1" /> Profile
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs">
              <Building2 className="h-3 w-3 mr-1" /> Team
            </TabsTrigger>
            <TabsTrigger value="assets" className="text-xs">
              <Image className="h-3 w-3 mr-1" /> Assets
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">
              <Activity className="h-3 w-3 mr-1" /> Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <SettingsProfileSection />
            <SettingsPlanSection />
            <SettingsAppearanceSection />
            <SettingsGenerationSection />

            {/* Account */}
            <section className="rounded-xl border bg-card p-5">
              <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4">
                <LogOut className="h-4 w-4 text-destructive" /> Account
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs h-8 text-destructive hover:text-destructive" onClick={handleSignOut}>
                  <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => window.open(TELEGRAM_PAYMENT_URL, "_blank")}>
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Contact Support
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="team">
            <TeamSettingsPanel />
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <section className="rounded-xl border bg-card p-5">
              <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4">
                <Palette className="h-4 w-4 text-primary" /> Brand Kits
              </h2>
              <SharedBrandKitsPanel />
            </section>
            <section className="rounded-xl border bg-card p-5">
              <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4">
                <Image className="h-4 w-4 text-primary" /> Shared Assets
              </h2>
              <SharedAssetsPanel />
            </section>
          </TabsContent>

          <TabsContent value="activity">
            <section className="rounded-xl border bg-card p-5">
              <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-primary" /> Workspace Activity
              </h2>
              <TeamActivityPanel />
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
