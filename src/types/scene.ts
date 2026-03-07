export interface SceneObject {
  id: string;
  type: string;
  material: string;
  color: string;
  size: string;
  position: string;
  depth_layer: string;
  attributes: string[];
  // Extended fields
  visible?: boolean;
  locked?: boolean;
  importance?: "low" | "medium" | "high";
  pose_or_action?: string;
  mood?: string;
}

export interface SceneData {
  scene_title: string;
  environment: {
    location: string;
    time_of_day: string;
    weather: string;
    lighting: string;
  };
  camera: {
    shot_type: string;
    angle: string;
    lens: string;
  };
  style: {
    visual_style: string;
    quality: string;
    color_palette: string;
  };
  objects: SceneObject[];
  // Extended
  negative_constraints?: string[];
  style_overrides?: Record<string, string>;
}

export interface SceneVersion {
  id: string;
  scene_data: SceneData;
  generated_prompt: string;
  source_prompt?: string;
  image_url?: string;
  version_label?: string;
  model_info?: string;
  image_metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  scenes: SceneVersion[];
  preview_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  title: string;
  category: string;
  description: string;
  preview_url?: string;
  starter_prompt: string;
  scene_json: SceneData;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}
