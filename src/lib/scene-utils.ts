import { SceneData, SceneObject } from "@/types/scene";

export const DEFAULT_SCENE: SceneData = {
  scene_title: "",
  environment: {
    location: "",
    time_of_day: "day",
    weather: "clear",
    lighting: "natural",
  },
  camera: {
    shot_type: "wide",
    angle: "eye-level",
    lens: "35mm",
  },
  style: {
    visual_style: "photorealistic",
    quality: "high",
    color_palette: "natural",
  },
  objects: [],
};

export const PRESET_OBJECTS: Partial<SceneObject>[] = [
  { type: "tree", material: "natural", color: "green", size: "large" },
  { type: "car", material: "metal", color: "red", size: "medium" },
  { type: "chair", material: "wood", color: "brown", size: "small" },
  { type: "table", material: "wood", color: "brown", size: "medium" },
  { type: "house", material: "brick", color: "white", size: "large" },
  { type: "swing", material: "wood", color: "brown", size: "medium" },
  { type: "slide", material: "plastic", color: "yellow", size: "medium" },
  { type: "lamp", material: "metal", color: "black", size: "small" },
  { type: "bench", material: "wood", color: "brown", size: "medium" },
  { type: "fountain", material: "stone", color: "gray", size: "large" },
];

export const ENVIRONMENT_OPTIONS = {
  time_of_day: ["dawn", "morning", "day", "afternoon", "sunset", "dusk", "night", "midnight"],
  weather: ["clear", "cloudy", "rainy", "stormy", "foggy", "snowy", "windy"],
  lighting: ["natural", "dramatic", "soft", "harsh", "backlit", "neon", "warm", "cool", "golden hour"],
};

export const CAMERA_OPTIONS = {
  shot_type: ["wide", "medium", "close-up", "extreme close-up", "aerial", "panoramic"],
  angle: ["eye-level", "low-angle", "high-angle", "bird's eye", "worm's eye", "dutch angle"],
  lens: ["14mm", "24mm", "35mm", "50mm", "85mm", "135mm", "200mm"],
};

export const STYLE_OPTIONS = {
  visual_style: ["photorealistic", "cinematic", "illustration", "watercolor", "oil painting", "anime", "3D render", "pixel art"],
  quality: ["draft", "standard", "high", "ultra", "masterpiece"],
  color_palette: ["natural", "warm", "cool", "muted", "vibrant", "pastel", "monochrome", "neon"],
};

export function buildPromptFromScene(scene: SceneData): string {
  const parts: string[] = [];

  if (scene.style.visual_style) {
    parts.push(`A ${scene.style.visual_style}`);
  }

  if (scene.environment.location) {
    parts.push(scene.environment.location);
  }

  if (scene.environment.time_of_day) {
    parts.push(`at ${scene.environment.time_of_day}`);
  }

  if (scene.objects.length > 0) {
    const objectDescs = scene.objects.map((obj) => {
      const attrs = [obj.color, obj.material, obj.type].filter(Boolean).join(" ");
      const pos = obj.position ? ` on the ${obj.position}` : "";
      return `a ${obj.size || ""} ${attrs}${pos}`.replace(/\s+/g, " ").trim();
    });

    if (objectDescs.length === 1) {
      parts.push(`with ${objectDescs[0]}`);
    } else {
      parts.push(`with ${objectDescs.slice(0, -1).join(", ")} and ${objectDescs[objectDescs.length - 1]}`);
    }
  }

  if (scene.environment.weather && scene.environment.weather !== "clear") {
    parts.push(`${scene.environment.weather} weather`);
  }

  if (scene.environment.lighting) {
    parts.push(`${scene.environment.lighting} lighting`);
  }

  if (scene.camera.shot_type) {
    parts.push(`${scene.camera.shot_type} shot`);
  }

  if (scene.style.quality) {
    parts.push(`${scene.style.quality} quality`);
  }

  return parts.join(", ") + ".";
}

export function parsePromptToScene(prompt: string): SceneData {
  const scene: SceneData = { ...DEFAULT_SCENE, objects: [] };
  const lower = prompt.toLowerCase();

  scene.scene_title = prompt.slice(0, 50);

  // Extract time of day
  for (const time of ENVIRONMENT_OPTIONS.time_of_day) {
    if (lower.includes(time)) {
      scene.environment.time_of_day = time;
      break;
    }
  }

  // Extract weather
  for (const weather of ENVIRONMENT_OPTIONS.weather) {
    if (lower.includes(weather)) {
      scene.environment.weather = weather;
      break;
    }
  }

  // Extract lighting
  for (const lighting of ENVIRONMENT_OPTIONS.lighting) {
    if (lower.includes(lighting)) {
      scene.environment.lighting = lighting;
      break;
    }
  }

  // Extract style
  for (const style of STYLE_OPTIONS.visual_style) {
    if (lower.includes(style)) {
      scene.style.visual_style = style;
      break;
    }
  }

  // Extract camera
  for (const shot of CAMERA_OPTIONS.shot_type) {
    if (lower.includes(shot)) {
      scene.camera.shot_type = shot;
      break;
    }
  }

  // Extract objects from presets
  for (const preset of PRESET_OBJECTS) {
    if (preset.type && lower.includes(preset.type)) {
      scene.objects.push({
        id: crypto.randomUUID(),
        type: preset.type,
        material: preset.material || "",
        color: preset.color || "",
        size: preset.size || "medium",
        position: "",
        depth_layer: "midground",
        attributes: [],
      });
    }
  }

  // Try to extract location
  const locationMatch = prompt.match(/(?:in |at |inside |outside )(?:a |an |the )?([^,.]+)/i);
  if (locationMatch) {
    scene.environment.location = locationMatch[1].trim();
  }

  return scene;
}
