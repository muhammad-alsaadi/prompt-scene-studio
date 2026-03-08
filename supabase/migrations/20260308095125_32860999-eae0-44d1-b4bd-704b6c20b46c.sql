
-- Artboards table
CREATE TABLE public.artboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Artboard 1',
  width integer NOT NULL DEFAULT 1024,
  height integer NOT NULL DEFAULT 1024,
  preset_size text DEFAULT 'custom',
  background_color text DEFAULT '#ffffff',
  background_type text DEFAULT 'solid',
  scene_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_prompt text DEFAULT '',
  current_image_url text,
  image_metadata jsonb DEFAULT '{}'::jsonb,
  model_info text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own artboards" ON public.artboards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own artboards" ON public.artboards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own artboards" ON public.artboards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own artboards" ON public.artboards FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_artboards_updated_at BEFORE UPDATE ON public.artboards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Workspaces table
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  credit_balance integer NOT NULL DEFAULT 0,
  daily_credits_used integer NOT NULL DEFAULT 0,
  daily_credits_reset_at timestamptz DEFAULT now(),
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace owners can manage" ON public.workspaces FOR ALL USING (auth.uid() = owner_id);

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Workspace members
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'editor',
  invited_by uuid,
  invited_email text,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace members" ON public.workspace_members FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT owner_id FROM public.workspaces WHERE id = workspace_id
  ));
CREATE POLICY "Workspace owners can manage members" ON public.workspace_members FOR ALL
  USING (auth.uid() IN (SELECT owner_id FROM public.workspaces WHERE id = workspace_id));

-- Assets table
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'image',
  file_size integer DEFAULT 0,
  mime_type text,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,
  is_shared boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id OR is_shared = true);
CREATE POLICY "Users can create own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);

-- Brand kits
CREATE TABLE public.brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT 'My Brand',
  logo_url text,
  colors jsonb DEFAULT '[]'::jsonb,
  fonts jsonb DEFAULT '[]'::jsonb,
  style_notes text DEFAULT '',
  is_shared boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand kits" ON public.brand_kits FOR SELECT USING (auth.uid() = user_id OR is_shared = true);
CREATE POLICY "Users can create own brand kits" ON public.brand_kits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brand kits" ON public.brand_kits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own brand kits" ON public.brand_kits FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_brand_kits_updated_at BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Credit ledger
CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  balance_after integer NOT NULL DEFAULT 0,
  operation text NOT NULL,
  description text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger" ON public.credit_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ledger" ON public.credit_ledger FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity log
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add workspace_id to projects for team support
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Add artboard_id to scene_versions
ALTER TABLE public.scene_versions ADD COLUMN IF NOT EXISTS artboard_id uuid REFERENCES public.artboards(id) ON DELETE SET NULL;

-- Add generation_mode to scene_versions  
ALTER TABLE public.scene_versions ADD COLUMN IF NOT EXISTS generation_mode text DEFAULT 'scene';
ALTER TABLE public.scene_versions ADD COLUMN IF NOT EXISTS cost_units integer DEFAULT 0;
ALTER TABLE public.scene_versions ADD COLUMN IF NOT EXISTS provider text DEFAULT '';
