
-- Generation jobs table
CREATE TABLE public.generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id),
  project_id uuid REFERENCES public.projects(id),
  artboard_id uuid REFERENCES public.artboards(id),
  user_id uuid NOT NULL,
  generation_mode text NOT NULL DEFAULT 'scene',
  provider text NOT NULL DEFAULT 'lovable-ai',
  model text NOT NULL DEFAULT 'gemini-flash-image',
  plan text NOT NULL DEFAULT 'free',
  input_prompt text,
  structured_scene_json jsonb DEFAULT '{}'::jsonb,
  uploaded_assets_used jsonb DEFAULT '[]'::jsonb,
  brand_kit_id uuid REFERENCES public.brand_kits(id),
  layered_generation boolean DEFAULT false,
  cost_units integer DEFAULT 0,
  output_urls jsonb DEFAULT '[]'::jsonb,
  layer_outputs jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_generation_jobs_user ON public.generation_jobs(user_id);
CREATE INDEX idx_generation_jobs_workspace ON public.generation_jobs(workspace_id);
CREATE INDEX idx_generation_jobs_project ON public.generation_jobs(project_id);
CREATE INDEX idx_generation_jobs_status ON public.generation_jobs(status);
CREATE INDEX idx_generation_jobs_created ON public.generation_jobs(created_at DESC);

-- RLS
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own jobs"
  ON public.generation_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view accessible jobs"
  ON public.generation_jobs FOR SELECT
  USING (
    auth.uid() = user_id
    OR (workspace_id IS NOT NULL AND is_workspace_member(auth.uid(), workspace_id))
  );

CREATE POLICY "Users can update their own jobs"
  ON public.generation_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Provider keys table for BYO (Ultra)
CREATE TABLE public.provider_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  provider text NOT NULL,
  encrypted_key text NOT NULL,
  is_active boolean DEFAULT true,
  last_validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, provider)
);

ALTER TABLE public.provider_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workspace provider keys"
  ON public.provider_keys FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_provider_keys_workspace ON public.provider_keys(workspace_id);
