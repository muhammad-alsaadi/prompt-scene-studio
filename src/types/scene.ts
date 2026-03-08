export interface CustomField {
  key: string;
  value: string;
  type: "text" | "number" | "select" | "color";
}

export type ObjectType =
  | "generic"
  | "text"
  | "uploaded_image"
  | "decorative"
  | "subject"
  | "background_element";

export interface SceneObject {
  id: string;
  name?: string;
  type: string;
  objectType?: ObjectType;
  material: string;
  color: string;
  size: string;
  position: string;
  depth_layer: string;
  attributes: string[];
  // Transform
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  blendMode?: string;
  // State
  visible?: boolean;
  locked?: boolean;
  // Creative
  importance?: "low" | "medium" | "high";
  pose_or_action?: string;
  mood?: string;
  style_description?: string;
  lighting_hint?: string;
  prompt_notes?: string;
  negative_notes?: string;
  visual_role?: string;
  // Text object fields
  textContent?: string;
  textAlignment?: "left" | "center" | "right";
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: number;
  textColor?: string;
  // Uploaded image fields
  asset_url?: string;
  native_width?: number;
  native_height?: number;
  // Dynamic fields
  custom_fields?: CustomField[];
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
  generation_mode?: string;
  provider?: string;
  cost_units?: number;
  artboard_id?: string;
  created_at: string;
}

export interface Artboard {
  id: string;
  project_id: string;
  name: string;
  width: number;
  height: number;
  preset_size: string;
  background_color: string;
  background_type: string;
  scene_json: SceneData;
  generated_prompt: string;
  current_image_url?: string;
  image_metadata?: Record<string, unknown>;
  model_info?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  scenes: SceneVersion[];
  preview_image_url?: string;
  workspace_id?: string;
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

export interface Asset {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  mime_type?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  is_shared: boolean;
  created_at: string;
}

export interface BrandKit {
  id: string;
  name: string;
  logo_url?: string;
  colors: string[];
  fonts: string[];
  style_notes: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}
