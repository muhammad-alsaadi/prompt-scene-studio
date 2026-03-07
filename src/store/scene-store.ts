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
  currentSceneId: string | null;
  selectedObjectId: string | null;
  isDirty: boolean;
  previewTab: "image" | "prompt" | "json" | "metadata";

  setOriginalPrompt: (prompt: string) => void;
  analyzePrompt: () => void;
  updateScene: (scene: Partial<SceneData>) => void;
  updateEnvironment: (env: Partial<SceneData["environment"]>) => void;
  updateCamera: (cam: Partial<SceneData["camera"]>) => void;
  updateStyle: (style: Partial<SceneData["style"]>) => void;
  addObject: (obj: Partial<SceneObject>) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  removeObject: (id: string) => void;
  duplicateObject: (id: string) => void;
  toggleObjectVisibility: (id: string) => void;
  toggleObjectLock: (id: string) => void;
  reorderObject: (id: string, direction: "up" | "down") => void;
  selectObject: (id: string | null) => void;
  rebuildPrompt: () => void;
  generateImage: () => void;
  saveVersion: (label?: string) => Promise<void>;
  loadVersion: (version: SceneVersion) => void;
  resetScene: () => void;
  setCurrentProjectId: (id: string | null) => void;
  setPreviewTab: (tab: "image" | "prompt" | "json" | "metadata") => void;
  loadProjectScene: (projectId: string) => Promise<void>;
  loadVersionsFromDB: (projectId: string) => Promise<void>;
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
  currentSceneId: null,
  selectedObjectId: null,
  isDirty: false,
  previewTab: "image",

  setOriginalPrompt: (prompt) => set({ originalPrompt: prompt, isDirty: true }),

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
        // Ensure visibility/locked defaults
        scene.objects = scene.objects.map(o => ({
          ...o,
          visible: o.visible ?? true,
          locked: o.locked ?? false,
        }));
        const generatedPrompt = buildPromptFromScene(scene);
        set({ currentScene: scene, generatedPrompt, isAnalyzing: false, isDirty: true });
        toast.success("Scene analyzed successfully");
      } else {
        throw new Error("No scene data returned");
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error(err.message || "Failed to analyze prompt");
      const { parsePromptToScene } = await import("@/lib/scene-utils");
      const scene = parsePromptToScene(originalPrompt);
      const generatedPrompt = buildPromptFromScene(scene);
      set({ currentScene: scene, generatedPrompt, isAnalyzing: false, isDirty: true });
    }
  },

  updateScene: (updates) => {
    const { currentScene } = get();
    const newScene = { ...currentScene, ...updates };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene), isDirty: true });
  },

  updateEnvironment: (env) => {
    const { currentScene } = get();
    const newScene = { ...currentScene, environment: { ...currentScene.environment, ...env } };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene), isDirty: true });
  },

  updateCamera: (cam) => {
    const { currentScene } = get();
    const newScene = { ...currentScene, camera: { ...currentScene.camera, ...cam } };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene), isDirty: true });
  },

  updateStyle: (style) => {
    const { currentScene } = get();
    const newScene = { ...currentScene, style: { ...currentScene.style, ...style } };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene), isDirty: true });
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
      visible: true,
      locked: false,
      importance: "medium",
    };
    const newScene = { ...currentScene, objects: [...currentScene.objects, newObj] };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene), isDirty: true, selectedObjectId: newObj.id });
  },

  updateObject: (id, updates) => {
    const { currentScene } = get();
    const obj = currentScene.objects.find(o => o.id === id);
    if (obj?.locked) return;
    const newScene = {
      ...currentScene,
      objects: currentScene.objects.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene), isDirty: true });
  },

  removeObject: (id) => {
    const { currentScene, selectedObjectId } = get();
    const newScene = { ...currentScene, objects: currentScene.objects.filter((o) => o.id !== id) };
    set({
      currentScene: newScene,
      generatedPrompt: buildPromptFromScene(newScene),
      isDirty: true,
      selectedObjectId: selectedObjectId === id ? null : selectedObjectId,
    });
  },

  duplicateObject: (id) => {
    const { currentScene } = get();
    const obj = currentScene.objects.find(o => o.id === id);
    if (!obj) return;
    const newObj = { ...obj, id: crypto.randomUUID(), type: `${obj.type} copy` };
    const newScene = { ...currentScene, objects: [...currentScene.objects, newObj] };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene), isDirty: true, selectedObjectId: newObj.id });
  },

  toggleObjectVisibility: (id) => {
    const { currentScene } = get();
    const newScene = {
      ...currentScene,
      objects: currentScene.objects.map(o => o.id === id ? { ...o, visible: !(o.visible ?? true) } : o),
    };
    set({ currentScene: newScene, generatedPrompt: buildPromptFromScene(newScene), isDirty: true });
  },

  toggleObjectLock: (id) => {
    const { currentScene } = get();
    const newScene = {
      ...currentScene,
      objects: currentScene.objects.map(o => o.id === id ? { ...o, locked: !(o.locked ?? false) } : o),
    };
    set({ currentScene: newScene, isDirty: true });
  },

  reorderObject: (id, direction) => {
    const { currentScene } = get();
    const objects = [...currentScene.objects];
    const idx = objects.findIndex(o => o.id === id);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= objects.length) return;
    [objects[idx], objects[newIdx]] = [objects[newIdx], objects[idx]];
    const newScene = { ...currentScene, objects };
    set({ currentScene: newScene, isDirty: true });
  },

  selectObject: (id) => set({ selectedObjectId: id }),

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
        set({ generatedImageUrl: data.image_url, isGenerating: false, previewTab: "image" });
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

  saveVersion: async (label?: string) => {
    const { currentScene, generatedPrompt, generatedImageUrl, originalPrompt, currentProjectId, currentSceneId, versions } = get();

    // Save locally
    const version: SceneVersion = {
      id: crypto.randomUUID(),
      scene_data: { ...currentScene },
      generated_prompt: generatedPrompt,
      source_prompt: originalPrompt,
      image_url: generatedImageUrl || undefined,
      version_label: label,
      created_at: new Date().toISOString(),
    };
    set({ versions: [version, ...versions], isDirty: false });

    // Persist to DB
    if (currentProjectId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Upsert scene
        let sceneId = currentSceneId;
        if (!sceneId) {
          const { data: sceneData } = await supabase.from("scenes").insert({
            project_id: currentProjectId,
            user_id: user.id,
            original_prompt: originalPrompt,
            generated_prompt: generatedPrompt,
            scene_json: currentScene as any,
            generated_image_url: generatedImageUrl,
          }).select("id").single();
          if (sceneData) {
            sceneId = sceneData.id;
            set({ currentSceneId: sceneId });
          }
        } else {
          await supabase.from("scenes").update({
            original_prompt: originalPrompt,
            generated_prompt: generatedPrompt,
            scene_json: currentScene as any,
            generated_image_url: generatedImageUrl,
          }).eq("id", sceneId);
        }

        // Save version
        if (sceneId) {
          await supabase.from("scene_versions").insert({
            scene_id: sceneId,
            user_id: user.id,
            scene_json: currentScene as any,
            generated_prompt: generatedPrompt,
            source_prompt: originalPrompt,
            image_url: generatedImageUrl,
            version_label: label || null,
            version_number: versions.length + 1,
          });
        }

        // Update project preview
        if (generatedImageUrl) {
          await supabase.from("projects").update({
            preview_image_url: generatedImageUrl,
          }).eq("id", currentProjectId);
        }
      } catch (err) {
        console.error("Failed to persist version:", err);
      }
    }
  },

  loadVersion: (version) => {
    set({
      currentScene: { ...version.scene_data },
      generatedPrompt: version.generated_prompt,
      generatedImageUrl: version.image_url || null,
      originalPrompt: version.source_prompt || "",
      isDirty: false,
    });
  },

  resetScene: () => {
    set({
      currentScene: { ...DEFAULT_SCENE, objects: [] },
      originalPrompt: "",
      generatedPrompt: "",
      generatedImageUrl: null,
      selectedObjectId: null,
      currentSceneId: null,
      isDirty: false,
      previewTab: "image",
    });
  },

  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setPreviewTab: (tab) => set({ previewTab: tab }),

  loadProjectScene: async (projectId: string) => {
    try {
      const { data: scenes } = await supabase
        .from("scenes")
        .select("*")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (scenes && scenes.length > 0) {
        const scene = scenes[0];
        const sceneData = scene.scene_json as unknown as SceneData;
        set({
          currentScene: sceneData,
          originalPrompt: scene.original_prompt || "",
          generatedPrompt: scene.generated_prompt || "",
          generatedImageUrl: scene.generated_image_url || null,
          currentSceneId: scene.id,
          currentProjectId: projectId,
          isDirty: false,
        });
      } else {
        set({
          currentScene: { ...DEFAULT_SCENE, objects: [] },
          originalPrompt: "",
          generatedPrompt: "",
          generatedImageUrl: null,
          currentSceneId: null,
          currentProjectId: projectId,
          isDirty: false,
        });
      }
    } catch (err) {
      console.error("Failed to load project scene:", err);
    }
  },

  loadVersionsFromDB: async (projectId: string) => {
    try {
      const { data: scenes } = await supabase
        .from("scenes")
        .select("id")
        .eq("project_id", projectId);

      if (!scenes || scenes.length === 0) {
        set({ versions: [] });
        return;
      }

      const sceneIds = scenes.map(s => s.id);
      const { data: dbVersions } = await supabase
        .from("scene_versions")
        .select("*")
        .in("scene_id", sceneIds)
        .order("created_at", { ascending: false });

      if (dbVersions) {
        const versions: SceneVersion[] = dbVersions.map(v => ({
          id: v.id,
          scene_data: v.scene_json as unknown as SceneData,
          generated_prompt: v.generated_prompt || "",
          source_prompt: (v as any).source_prompt || "",
          image_url: v.image_url || undefined,
          version_label: (v as any).version_label || undefined,
          model_info: (v as any).model_info || undefined,
          created_at: v.created_at,
        }));
        set({ versions });
      }
    } catch (err) {
      console.error("Failed to load versions:", err);
    }
  },
}));
