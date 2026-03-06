import { create } from "zustand";
import { SceneData, SceneVersion, Project, SceneObject } from "@/types/scene";
import { DEFAULT_SCENE, buildPromptFromScene, parsePromptToScene } from "@/lib/scene-utils";

interface SceneStore {
  // Current scene
  currentScene: SceneData;
  originalPrompt: string;
  generatedPrompt: string;
  generatedImageUrl: string | null;
  isAnalyzing: boolean;
  isGenerating: boolean;

  // Versions
  versions: SceneVersion[];

  // Projects
  projects: Project[];
  currentProjectId: string | null;

  // Actions
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
  createProject: (name: string, description: string) => void;
}

export const useSceneStore = create<SceneStore>((set, get) => ({
  currentScene: { ...DEFAULT_SCENE },
  originalPrompt: "",
  generatedPrompt: "",
  generatedImageUrl: null,
  isAnalyzing: false,
  isGenerating: false,
  versions: [],
  projects: [
    {
      id: "demo-1",
      name: "Playground Scene",
      description: "A sunset playground with various elements",
      scenes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  currentProjectId: null,

  setOriginalPrompt: (prompt) => set({ originalPrompt: prompt }),

  analyzePrompt: () => {
    set({ isAnalyzing: true });
    const { originalPrompt } = get();
    // Simulate AI analysis delay
    setTimeout(() => {
      const scene = parsePromptToScene(originalPrompt);
      const generatedPrompt = buildPromptFromScene(scene);
      set({ currentScene: scene, generatedPrompt, isAnalyzing: false });
    }, 1200);
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

  generateImage: () => {
    set({ isGenerating: true });
    // Simulate image generation
    setTimeout(() => {
      set({
        isGenerating: false,
        generatedImageUrl: `https://picsum.photos/seed/${Date.now()}/800/600`,
      });
      get().saveVersion();
    }, 2500);
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

  createProject: (name, description) => {
    const { projects } = get();
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      scenes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set({ projects: [...projects, project], currentProjectId: project.id });
  },
}));
