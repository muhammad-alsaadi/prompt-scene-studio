
-- Templates table
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  preview_url TEXT,
  starter_prompt TEXT NOT NULL DEFAULT '',
  scene_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Templates are public readable
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view templates" ON public.templates FOR SELECT TO authenticated USING (true);

-- Usage events placeholder for future billing
CREATE TABLE public.usage_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  credits_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON public.usage_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.usage_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Expand scene_versions with new columns
ALTER TABLE public.scene_versions 
  ADD COLUMN IF NOT EXISTS source_prompt TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS model_info TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS version_label TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS image_metadata JSONB DEFAULT '{}'::jsonb;

-- Add preview_image_url to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS preview_image_url TEXT;

-- Seed some starter templates
INSERT INTO public.templates (title, category, description, starter_prompt, scene_json, is_featured, sort_order) VALUES
('Product Photography', 'commercial', 'Clean studio product shot with soft lighting', 'A photorealistic product photo on a clean white surface with soft studio lighting, close-up shot, ultra quality', '{"scene_title":"Product Shot","environment":{"location":"studio","time_of_day":"day","weather":"clear","lighting":"soft"},"camera":{"shot_type":"close-up","angle":"eye-level","lens":"85mm"},"style":{"visual_style":"photorealistic","quality":"ultra","color_palette":"natural"},"objects":[]}', true, 1),
('Cinematic Portrait', 'portrait', 'Dramatic portrait with cinematic lighting', 'A cinematic portrait with dramatic golden hour lighting, shallow depth of field, warm color palette, medium shot', '{"scene_title":"Cinematic Portrait","environment":{"location":"outdoor","time_of_day":"sunset","weather":"clear","lighting":"golden hour"},"camera":{"shot_type":"medium","angle":"eye-level","lens":"85mm"},"style":{"visual_style":"cinematic","quality":"high","color_palette":"warm"},"objects":[]}', true, 2),
('Fantasy Landscape', 'creative', 'Mystical fantasy landscape with ethereal elements', 'A fantasy landscape with floating islands, misty valleys, bioluminescent trees, aerial wide shot, vibrant colors', '{"scene_title":"Fantasy Landscape","environment":{"location":"mystical valley","time_of_day":"dusk","weather":"foggy","lighting":"dramatic"},"camera":{"shot_type":"wide","angle":"high-angle","lens":"24mm"},"style":{"visual_style":"illustration","quality":"high","color_palette":"vibrant"},"objects":[{"id":"t1","type":"floating island","material":"rock","color":"green","size":"large","position":"center","depth_layer":"midground","attributes":["mystical"]},{"id":"t2","type":"tree","material":"natural","color":"blue","size":"large","position":"left","depth_layer":"foreground","attributes":["bioluminescent"]}]}', true, 3),
('Architecture Scene', 'architecture', 'Modern architectural visualization', 'A photorealistic modern glass building exterior at golden hour with reflections, wide panoramic shot', '{"scene_title":"Modern Architecture","environment":{"location":"urban plaza","time_of_day":"sunset","weather":"clear","lighting":"golden hour"},"camera":{"shot_type":"wide","angle":"low-angle","lens":"24mm"},"style":{"visual_style":"photorealistic","quality":"ultra","color_palette":"warm"},"objects":[{"id":"a1","type":"glass building","material":"glass","color":"gray","size":"huge","position":"center","depth_layer":"midground","attributes":["modern","reflective"]}]}', true, 4),
('Anime Scene', 'creative', 'Vibrant anime-style illustration', 'An anime-style cherry blossom garden at sunset with a traditional Japanese bridge, vibrant pastel colors', '{"scene_title":"Anime Garden","environment":{"location":"cherry blossom garden","time_of_day":"sunset","weather":"clear","lighting":"warm"},"camera":{"shot_type":"wide","angle":"eye-level","lens":"35mm"},"style":{"visual_style":"anime","quality":"high","color_palette":"pastel"},"objects":[{"id":"an1","type":"bridge","material":"wood","color":"red","size":"medium","position":"center","depth_layer":"midground","attributes":["traditional","Japanese"]},{"id":"an2","type":"cherry tree","material":"natural","color":"pink","size":"large","position":"right","depth_layer":"foreground","attributes":["blooming"]}]}', true, 5),
('Editorial Ad', 'commercial', 'High-end editorial advertising shot', 'A high-end editorial fashion photo with dramatic studio lighting, monochrome palette, close-up shot, masterpiece quality', '{"scene_title":"Editorial Shot","environment":{"location":"studio","time_of_day":"day","weather":"clear","lighting":"dramatic"},"camera":{"shot_type":"close-up","angle":"eye-level","lens":"135mm"},"style":{"visual_style":"cinematic","quality":"masterpiece","color_palette":"monochrome"},"objects":[]}', true, 6);
