
-- ============================================================
-- Phase 2: Full schema expansion for PromptScene
-- ============================================================

-- 1) Add workspace_type to workspaces
ALTER TABLE public.workspaces 
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

-- 2) Expand profiles with personal_workspace_id
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS personal_workspace_id uuid REFERENCES public.workspaces(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email text DEFAULT NULL;

-- 3) Expand workspace_members with status and updated_at
ALTER TABLE public.workspace_members 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'invited',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 4) Expand projects with last_opened_at, archived_at
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS last_opened_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

-- 5) Expand artboards with archived_at
ALTER TABLE public.artboards 
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

-- 6) Expand assets with width, height, asset_type
ALTER TABLE public.assets 
  ADD COLUMN IF NOT EXISTS width integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS height integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS asset_type text NOT NULL DEFAULT 'other';

-- 7) Expand usage_events with more context fields
ALTER TABLE public.usage_events 
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS artboard_id uuid REFERENCES public.artboards(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS provider text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS model text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS generation_mode text DEFAULT 'scene',
  ADD COLUMN IF NOT EXISTS action_type text DEFAULT NULL;

-- 8) Expand credit_ledger with related_usage_event_id
ALTER TABLE public.credit_ledger 
  ADD COLUMN IF NOT EXISTS related_usage_event_id uuid REFERENCES public.usage_events(id) DEFAULT NULL;

-- 9) Expand activity_log with target_type, target_id
ALTER TABLE public.activity_log 
  ADD COLUMN IF NOT EXISTS target_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS target_id uuid DEFAULT NULL;

-- 10) Expand templates with tags, is_global, created_by
ALTER TABLE public.templates 
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid DEFAULT NULL;

-- 11) Expand brand_kits with logo_asset_id, richer color structure
ALTER TABLE public.brand_kits 
  ADD COLUMN IF NOT EXISTS logo_asset_id uuid REFERENCES public.assets(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS secondary_colors jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS typography jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS style_preferences jsonb DEFAULT '{}'::jsonb;

-- ============================================================
-- 12) Create subscription_state table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscription_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  current_plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  seat_count integer NOT NULL DEFAULT 1,
  billing_mode text DEFAULT 'telegram',
  telegram_payment_reference text DEFAULT NULL,
  active_from timestamptz NOT NULL DEFAULT now(),
  active_until timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id)
);

ALTER TABLE public.subscription_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace subscription"
  ON public.subscription_state FOR SELECT
  USING (workspace_id IN (
    SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    UNION
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Workspace owners can manage subscription"
  ON public.subscription_state FOR ALL
  USING (workspace_id IN (
    SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
  ));

-- ============================================================
-- 13) Create user-assets storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-assets', 'user-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can manage their own files
CREATE POLICY "Users can upload own assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- 14) Helper function: check workspace membership
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces WHERE id = _workspace_id AND owner_id = _user_id
    UNION ALL
    SELECT 1 FROM public.workspace_members WHERE workspace_id = _workspace_id AND user_id = _user_id AND status = 'active'
  )
$$;

-- ============================================================
-- 15) Helper function: get workspace role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_workspace_role(_user_id uuid, _workspace_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM public.workspaces WHERE id = _workspace_id AND owner_id = _user_id)
    THEN 'owner'
    ELSE (SELECT role FROM public.workspace_members WHERE workspace_id = _workspace_id AND user_id = _user_id AND status = 'active' LIMIT 1)
  END
$$;

-- ============================================================
-- 16) Auto-create personal workspace on new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws_id uuid;
BEGIN
  -- Create personal workspace
  INSERT INTO public.workspaces (name, owner_id, type, plan)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Workspace', NEW.id, 'personal', 'free')
  RETURNING id INTO ws_id;
  
  -- Create profile linked to workspace
  INSERT INTO public.profiles (user_id, display_name, email, personal_workspace_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, ws_id);
  
  -- Create subscription state
  INSERT INTO public.subscription_state (workspace_id, current_plan, status)
  VALUES (ws_id, 'free', 'active');
  
  RETURN NEW;
END;
$$;

-- Recreate trigger (drop if exists to avoid conflict)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 17) Updated_at triggers for new/expanded tables
-- ============================================================
DROP TRIGGER IF EXISTS update_subscription_state_updated_at ON public.subscription_state;
CREATE TRIGGER update_subscription_state_updated_at
  BEFORE UPDATE ON public.subscription_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspace_members_updated_at ON public.workspace_members;
CREATE TRIGGER update_workspace_members_updated_at
  BEFORE UPDATE ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 18) Team-aware RLS for projects (owner OR workspace member)
-- ============================================================
-- Drop old policies first
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

CREATE POLICY "Users can view accessible projects"
  ON public.projects FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  );

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update accessible projects"
  ON public.projects FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR (workspace_id IS NOT NULL AND public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin', 'editor'))
  );

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (
    auth.uid() = user_id 
    OR (workspace_id IS NOT NULL AND public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin'))
  );

-- ============================================================
-- 19) Team-aware RLS for assets
-- ============================================================
DROP POLICY IF EXISTS "Users can view own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can create own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can update own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can delete own assets" ON public.assets;

CREATE POLICY "Users can view accessible assets"
  ON public.assets FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_shared = true
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  );

CREATE POLICY "Users can create assets"
  ON public.assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON public.assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON public.assets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 20) Team-aware RLS for brand_kits
-- ============================================================
DROP POLICY IF EXISTS "Users can view own brand kits" ON public.brand_kits;
DROP POLICY IF EXISTS "Users can create own brand kits" ON public.brand_kits;
DROP POLICY IF EXISTS "Users can update own brand kits" ON public.brand_kits;
DROP POLICY IF EXISTS "Users can delete own brand kits" ON public.brand_kits;

CREATE POLICY "Users can view accessible brand kits"
  ON public.brand_kits FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_shared = true
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  );

CREATE POLICY "Users can create brand kits"
  ON public.brand_kits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand kits"
  ON public.brand_kits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand kits"
  ON public.brand_kits FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 21) Team-aware RLS for activity_log
-- ============================================================
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;
DROP POLICY IF EXISTS "Users can insert own activity" ON public.activity_log;

CREATE POLICY "Users can view accessible activity"
  ON public.activity_log FOR SELECT
  USING (
    auth.uid() = user_id
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  );

CREATE POLICY "Users can insert activity"
  ON public.activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 22) Team-aware RLS for usage_events
-- ============================================================
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_events;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_events;

CREATE POLICY "Users can view accessible usage"
  ON public.usage_events FOR SELECT
  USING (
    auth.uid() = user_id
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  );

CREATE POLICY "Users can insert usage"
  ON public.usage_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 23) Team-aware RLS for credit_ledger
-- ============================================================
DROP POLICY IF EXISTS "Users can view own ledger" ON public.credit_ledger;
DROP POLICY IF EXISTS "Users can insert own ledger" ON public.credit_ledger;

CREATE POLICY "Users can view accessible ledger"
  ON public.credit_ledger FOR SELECT
  USING (
    auth.uid() = user_id
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  );

CREATE POLICY "Users can insert ledger entries"
  ON public.credit_ledger FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 24) Team-aware RLS for artboards
-- ============================================================
DROP POLICY IF EXISTS "Users can view own artboards" ON public.artboards;
DROP POLICY IF EXISTS "Users can create own artboards" ON public.artboards;
DROP POLICY IF EXISTS "Users can update own artboards" ON public.artboards;
DROP POLICY IF EXISTS "Users can delete own artboards" ON public.artboards;

CREATE POLICY "Users can view accessible artboards"
  ON public.artboards FOR SELECT
  USING (
    auth.uid() = user_id
    OR project_id IN (
      SELECT id FROM public.projects WHERE workspace_id IS NOT NULL 
      AND public.is_workspace_member(auth.uid(), workspace_id)
    )
  );

CREATE POLICY "Users can create artboards"
  ON public.artboards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update accessible artboards"
  ON public.artboards FOR UPDATE
  USING (
    auth.uid() = user_id
    OR project_id IN (
      SELECT id FROM public.projects WHERE workspace_id IS NOT NULL 
      AND public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Users can delete accessible artboards"
  ON public.artboards FOR DELETE
  USING (
    auth.uid() = user_id
    OR project_id IN (
      SELECT id FROM public.projects WHERE workspace_id IS NOT NULL 
      AND public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 25) Indexes for query performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_artboards_project_id ON public.artboards(project_id);
CREATE INDEX IF NOT EXISTS idx_artboards_user_id ON public.artboards(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON public.scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_scene_versions_scene_id ON public.scene_versions(scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_versions_artboard_id ON public.scene_versions(artboard_id);
CREATE INDEX IF NOT EXISTS idx_scene_versions_created_at ON public.scene_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_workspace_id ON public.assets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON public.assets(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_kits_workspace_id ON public.brand_kits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON public.usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_workspace_id ON public.usage_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON public.usage_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id ON public.credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_workspace_id ON public.credit_ledger(workspace_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_created_at ON public.credit_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_workspace_id ON public.activity_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_state_workspace_id ON public.subscription_state(workspace_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_featured ON public.templates(is_featured);
