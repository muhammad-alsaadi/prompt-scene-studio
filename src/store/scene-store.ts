import { create } from "zustand";
import { SceneData, SceneVersion, SceneObject } from "@/types/scene";
import { DEFAULT_SCENE, buildPromptFromScene } from "@/lib/scene-utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SceneStore {
  currentScene: SceneData;
  originalPrompt: string;
  generatedPrompt: string;
  generatedImageUrl: string | null;
  isAnalyzing: boolean;
  isGenerating: boolean;
  versions: SceneVersion[];
  currentProjectId: string | null;

  setOriginalPrompt: (prompt: string) => void;
  analyzePrompt: () => void;
  updateScene: (scene: Partial<SceneData>) => void;
  updateEnvironment: (env: Partial<SceneData["environment"]>) => void;
  updateCamera: (cam: Partial<SceneData["camera"]>) => void;
  updateStyle: (style: Partial<SceneData["style"]>) => void;
  addObject: (obj: Partial<SceneObject>) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  removeObject: (id: string) => void;
  rebuildPrompt: () => void;
  generateImage: () => void;
  saveVersion: () => void;
  loadVersion: (version: SceneVersion) => void;
  resetScene: () => void;
  setCurrentProjectId: (id: string | null) => void;
}

export const useSceneStore = create<SceneStore>((set, get) => ({
  currentScene: { ...DEFAULT_SCENE },
  originalPrompt: "",
  generatedPrompt: "",
  generatedImageUrl: null,
  isAnalyzing: false,
  isGenerating: false,
  versions: [],
  currentProjectId: null,

  setOriginalPrompt: (prompt) => set({ originalPrompt: prompt }),

  analyzePrompt: async () => {
    set({ isAnalyzing: true });
    const { originalPrompt } = get();

    try {
      const { data, error } = await supabase.functions.invoke("analyze-prompt", {
        body: { prompt: originalPrompt },
      });

      if (error) throw error;

      if (data?.scene) {
        const scene = data.scene as SceneData;
        const generatedPrompt = buildPromptFromScene(scene);
        set({ currentScene: scene, generatedPrompt, isAnalyzing: false });
        toast.success("Scene analyzed successfully!");
      } else {
        throw new Error("No scene data returned");
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error(err.message || "Failed to analyze prompt");
      // Fallback to local parser
      const { parsePromptToScene } = await import("@/lib/scene-utils");
      const scene = parsePromptToScene(originalPrompt);
      const generatedPrompt = buildPromptFromScene(scene);
      set({ currentScene: scene, generatedPrompt, isAnalyzing: false });
    }
  },

  updateScene: (updates) => {
    const { currentScene } = get();
    const newScene = { ...currentScene, ...updates };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene) });
  },

  updateEnvironment: (env) => {
    const { currentScene } = get();
    const newScene = { ...currentScene, environment: { ...currentScene.environment, ...env } };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene) });
  },

  updateCamera: (cam) => {
    const { currentScene } = get();
    const newScene = { ...currentScene, camera: { ...currentScene.camera, ...cam } };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene) });
  },

  updateStyle: (style) => {
    const { currentScene } = get();
    const newScene = { ...currentScene, style: { ...currentScene.style, ...style } };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene) });
  },

  addObject: (obj) => {
    const { currentScene } = get();
    const newObj: SceneObject = {
      id: crypto.randomUUID(),
      type: obj.type || "object",
      material: obj.material || "",
      color: obj.color || "",
      size: obj.size || "medium",
      position: obj.position || "",
      depth_layer: obj.depth_layer || "midground",
      attributes: obj.attributes || [],
    };
    const newScene = { ...currentScene, objects: [...currentScene.objects, newObj] };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene) });
  },

  updateObject: (id, updates) => {
    const { currentScene } = get();
    const newScene = {
      ...currentScene,
      objects: currentScene.objects.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene) });
  },

  removeObject: (id) => {
    const { currentScene } = get();
    const newScene = { ...currentScene, objects: currentScene.objects.filter((o) => o.id !== id) };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene) });
  },

  rebuildPrompt: () => {
    const { currentScene } = get();
    set({ generatedPrompt: buildPromptFromScene(currentScene) });
  },

  generateImage: async () => {
    set({ isGenerating: true });
    const { generatedPrompt } = get();

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: generatedPrompt },
      });

      if (error) throw error;

      if (data?.image_url) {
        set({ generatedImageUrl: data.image_url, isGenerating: false });
        toast.success("Image generated!");
        get().saveVersion();
      } else {
        throw new Error("No image returned");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      toast.error(err.message || "Failed to generate image");
      set({ isGenerating: false });
    }
  },

  saveVersion: () => {
    const { currentScene, generatedPrompt, generatedImageUrl, versions } = get();
    const version: SceneVersion = {
      id: crypto.randomUUID(),
      scene_data: { ...currentScene },
      generated_prompt: generatedPrompt,
      image_url: generatedImageUrl || undefined,
      created_at: new Date().toISOString(),
    };
    set({ versions: [version, ...versions] });
  },

  loadVersion: (version) => {
    set({
      currentScene: { ...version.scene_data },
      generatedPrompt: version.generated_prompt,
      generatedImageUrl: version.image_url || null,
    });
  },

  resetScene: () => {
    set({
      currentScene: { ...DEFAULT_SCENE, objects: [] },
      originalPrompt: "",
      generatedPrompt: "",
      generatedImageUrl: null,
    });
  },

  setCurrentProjectId: (id) => set({ currentProjectId: id }),
}));
