// Client-side generation orchestrator
// Calls the generate-image edge function with structured job data

import { supabase } from "@/integrations/supabase/client";
import { GenerationJob, GenerationError } from "@/lib/generation-engine";
import type { GenerationMode } from "@/lib/providers";

export interface GenerateRequest {
  prompt: string;
  mode: GenerationMode;
  provider: string;
  model: string;
  resolution: string;
  sceneJson: Record<string, unknown>;
  uploadedAssets?: Array<{ assetId: string; url: string; role: string }>;
  brandKit?: { colors?: string[]; fonts?: string[]; style_notes?: string; logo_url?: string } | null;
  brandKitId?: string;
  layered?: boolean;
  workspaceId?: string;
  projectId?: string;
  artboardId?: string;
}

export interface LayerOutputData {
  layerId: string;
  layerType: "background" | "element";
  objectType?: string;
  assetUrl: string;
  width: number;
  height: number;
  x: number;
  y: number;
  zIndex: number;
}

export interface GenerateResponse {
  image_url: string;
  job_id?: string;
  cost_units: number;
  provider: string;
  model: string;
  mode: string;
  layer_outputs?: LayerOutputData[];
  metadata?: Record<string, unknown>;
}

export async function invokeGeneration(request: GenerateRequest): Promise<GenerateResponse> {
  const { data, error } = await supabase.functions.invoke("generate-image", {
    body: {
      prompt: request.prompt,
      mode: request.mode,
      provider: request.provider,
      model: request.model,
      resolution: request.resolution,
      scene_json: request.sceneJson,
      uploaded_assets: request.uploadedAssets,
      brand_kit: request.brandKit || undefined,
      brand_kit_id: request.brandKitId,
      layered: request.layered,
      workspace_id: request.workspaceId,
      project_id: request.projectId,
      artboard_id: request.artboardId,
    },
  });

  if (error) {
    const msg = error.message || "Generation failed";
    if (msg.includes("Rate limit")) {
      throw new GenerationError("RATE_LIMITED", msg, true);
    }
    if (msg.includes("credits")) {
      throw new GenerationError("INSUFFICIENT_CREDITS", msg, false);
    }
    throw new GenerationError("PROVIDER_FAILURE", msg, true);
  }

  if (data?.error) {
    throw new GenerationError("PROVIDER_FAILURE", data.error, true);
  }

  if (!data?.image_url) {
    throw new GenerationError("PROVIDER_FAILURE", "No image returned from generation", true);
  }

  return {
    image_url: data.image_url,
    job_id: data.job_id,
    cost_units: data.cost_units || 0,
    provider: data.provider || request.provider,
    model: data.model || request.model,
    mode: data.mode || request.mode,
    layer_outputs: data.layer_outputs,
    metadata: data.metadata,
  };
}

// Persist a generation job record client-side
export async function persistGenerationJob(job: GenerationJob): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("generation_jobs").insert({
    workspace_id: job.workspaceId || null,
    project_id: job.projectId || null,
    artboard_id: job.artboardId || null,
    user_id: user.id,
    generation_mode: job.mode,
    provider: job.provider,
    model: job.model,
    plan: job.plan,
    input_prompt: job.inputPrompt,
    structured_scene_json: job.structuredScene as any,
    uploaded_assets_used: job.uploadedAssets as any,
    brand_kit_id: job.brandKitId || null,
    layered_generation: job.layeredGeneration,
    cost_units: job.costUnits,
    output_urls: job.outputUrls as any,
    layer_outputs: job.layerOutputs as any,
    metadata: job.metadata as any,
    status: job.status,
    error_message: job.errorMessage || null,
    started_at: new Date().toISOString(),
  } as any).select("id").single();

  if (error) {
    console.error("Failed to persist generation job:", error);
    return null;
  }

  return data?.id || null;
}

export async function updateGenerationJob(
  jobId: string,
  updates: { status: string; outputUrls?: string[]; errorMessage?: string; costUnits?: number; layerOutputs?: any[] },
): Promise<void> {
  await supabase.from("generation_jobs").update({
    status: updates.status,
    output_urls: updates.outputUrls as any,
    layer_outputs: updates.layerOutputs as any,
    error_message: updates.errorMessage || null,
    cost_units: updates.costUnits,
    completed_at: new Date().toISOString(),
  } as any).eq("id", jobId);
}
