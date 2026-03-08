// Artboard preset sizes
export interface ArtboardPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  category: string;
}

export const ARTBOARD_PRESETS: ArtboardPreset[] = [
  { id: "ig-post", name: "Instagram Post", width: 1080, height: 1080, category: "Social" },
  { id: "ig-story", name: "Instagram Story", width: 1080, height: 1920, category: "Social" },
  { id: "yt-thumb", name: "YouTube Thumbnail", width: 1280, height: 720, category: "Video" },
  { id: "poster", name: "Poster", width: 1080, height: 1440, category: "Print" },
  { id: "square-ad", name: "Square Ad", width: 1080, height: 1080, category: "Ads" },
  { id: "landscape-ad", name: "Landscape Ad", width: 1200, height: 628, category: "Ads" },
  { id: "presentation", name: "Presentation Slide", width: 1920, height: 1080, category: "Presentation" },
  { id: "fb-cover", name: "Facebook Cover", width: 1640, height: 624, category: "Social" },
  { id: "twitter-header", name: "Twitter Header", width: 1500, height: 500, category: "Social" },
  { id: "custom", name: "Custom Size", width: 1024, height: 1024, category: "Custom" },
];

export function getPresetById(id: string): ArtboardPreset | undefined {
  return ARTBOARD_PRESETS.find(p => p.id === id);
}
