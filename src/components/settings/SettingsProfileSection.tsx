import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "lucide-react";

export function SettingsProfileSection() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

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
    else toast.success("Profile saved");
  };

  return (
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
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-8 text-xs mt-0.5" placeholder="Your name" />
        </div>
        <Button size="sm" className="text-xs h-8" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </section>
  );
}
