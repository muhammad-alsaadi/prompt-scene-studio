export interface SceneObject {
  id: string;
  type: string;
  material: string;
  color: string;
  size: string;
  position: string;
  depth_layer: string;
  attributes: string[];
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
}

export interface SceneVersion {
  id: string;
  scene_data: SceneData;
  generated_prompt: string;
  image_url?: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  scenes: SceneVersion[];
  created_at: string;
  updated_at: string;
}
