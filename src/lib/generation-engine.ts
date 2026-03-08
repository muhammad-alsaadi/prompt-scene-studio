// PromptScene Generation Engine
// Orchestrates mode routing, provider selection, cost calculation, and job lifecycle

import { SceneData } from "@/types/scene";
import { GenerationMode, PROVIDERS, GENERATION_MODES, ProviderDefinition, ProviderModel } from "@/lib/providers";
import { PlanId, calculateCreditCost, CreditCostFactors } from "@/lib/plans";

// ─── Generation Job ──────────────────────────────────────────────

export interface GenerationJob {
  id?: string;
  workspaceId?: string;
  projectId?: string;
  artboardId?: string;
  userId: string;
  mode: GenerationMode;
  provider: string;
  model: string;
  plan: PlanId;
  inputPrompt: string;
  structuredScene: SceneData;
  uploadedAssets: UploadedAssetRef[];
  brandKitId?: string;
  layeredGeneration: boolean;
  resolution: "720p" | "1080p" | "2k" | "4k";
  costUnits: number;
  status: "pending" | "running" | "completed" | "failed";
  outputUrls: string[];
  layerOutputs: LayerOutput[];
  metadata: Record<string, unknown>;
  errorMessage?: string;
}

export interface UploadedAssetRef {
  assetId: string;
  url: string;
  role: "product" | "logo" | "reference" | "background" | "other";
}

export interface LayerOutput {
  layerId: string;
  assetUrl: string;
  nativeWidth: number;
  nativeHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
}

// ─── Provider Resolution ─────────────────────────────────────────

export function resolveProvider(
  plan: PlanId,
  mode: GenerationMode,
  preferredProvider?: string,
): { provider: ProviderDefinition; model: ProviderModel } {
  const available = PROVIDERS.filter(p =>
    p.availableOnPlans.includes(plan)
  );

  // If user has a preference and it's available, use it
  if (preferredProvider) {
    const pref = available.find(p => p.id === preferredProvider);
    if (pref && pref.models.length > 0) {
      return { provider: pref, model: pref.models[0] };
    }
  }

  // Default: use lovable-ai
  const defaultProvider = available.find(p => p.id === "lovable-ai") || available[0];
  if (!defaultProvider) {
    throw new Error("No provider available for this plan");
  }

  return { provider: defaultProvider, model: defaultProvider.models[0] };
}

export function resolveModel(
  provider: ProviderDefinition,
  preferredModel?: string,
): ProviderModel {
  if (preferredModel) {
    const m = provider.models.find(m => m.id === preferredModel);
    if (m) return m;
  }
  return provider.models[0];
}

// ─── Mode Validation ─────────────────────────────────────────────

export function validateModeAccess(plan: PlanId, mode: GenerationMode): { allowed: boolean; reason?: string } {
  const modeDef = GENERATION_MODES.find(m => m.id === mode);
  if (!modeDef) return { allowed: false, reason: "Unknown generation mode" };
  if (!modeDef.availableOnPlans.includes(plan)) {
    return { allowed: false, reason: `${modeDef.name} requires a plan upgrade` };
  }
  return { allowed: true };
}

// ─── Cost Calculation ────────────────────────────────────────────

export function calculateJobCost(job: Partial<GenerationJob>): number {
  const factors: CreditCostFactors = {
    generationMode: job.mode || "scene",
    provider: job.provider || "lovable-ai",
    model: job.model || "gemini-flash-image",
    resolution: job.resolution || "1080p",
    layerCount: job.layeredGeneration ? Math.max(1, (job.layerOutputs?.length || 0) + 1) : 1,
    backgroundRemoval: false, // determined at generation time
    imageEditing: false,
    premiumRouting: job.plan === "ultra" || job.plan === "team",
  };

  // Apply provider cost multiplier
  const providerDef = PROVIDERS.find(p => p.id === job.provider);
  let cost = calculateCreditCost(factors);
  if (providerDef) {
    cost = Math.round(cost * providerDef.baseCostMultiplier);
  }

  return cost;
}

// ─── Job Builder ─────────────────────────────────────────────────

export function buildGenerationJob(params: {
  userId: string;
  plan: PlanId;
  mode: GenerationMode;
  scene: SceneData;
  prompt: string;
  workspaceId?: string;
  projectId?: string;
  artboardId?: string;
  preferredProvider?: string;
  preferredModel?: string;
  resolution?: "720p" | "1080p" | "2k" | "4k";
  uploadedAssets?: UploadedAssetRef[];
  brandKitId?: string;
}): GenerationJob {
  const { provider, model } = resolveProvider(params.plan, params.mode, params.preferredProvider);
  const resolvedModel = resolveModel(provider, params.preferredModel);
  const isLayered = params.mode === "advanced_layered";

  const job: GenerationJob = {
    userId: params.userId,
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    artboardId: params.artboardId,
    mode: params.mode,
    provider: provider.id,
    model: resolvedModel.id,
    plan: params.plan,
    inputPrompt: params.prompt,
    structuredScene: params.scene,
    uploadedAssets: params.uploadedAssets || [],
    brandKitId: params.brandKitId,
    layeredGeneration: isLayered,
    resolution: params.resolution || "1080p",
    costUnits: 0,
    status: "pending",
    outputUrls: [],
    layerOutputs: [],
    metadata: {
      providerName: provider.name,
      modelName: resolvedModel.name,
      modeName: GENERATION_MODES.find(m => m.id === params.mode)?.name || params.mode,
    },
  };

  job.costUnits = calculateJobCost(job);
  return job;
}

// ─── Prompt Enhancement by Mode ──────────────────────────────────

export function enhancePromptForMode(prompt: string, mode: GenerationMode, scene: SceneData, assets?: UploadedAssetRef[]): string {
  switch (mode) {
    case "ad_composition": {
      const assetDescs = (assets || []).map(a => `[${a.role}: uploaded asset]`).join(", ");
      return `Professional advertising composition. ${prompt}. ${assetDescs ? `Incorporate these elements: ${assetDescs}.` : ""} Clean, commercial quality, marketing-ready output.`;
    }
    case "advanced_layered": {
      return `Generate as isolated layer assets on transparent background where possible. ${prompt}. Each major element should be clearly separable.`;
    }
    default:
      return prompt;
  }
}

// ─── Error Types ─────────────────────────────────────────────────

export type GenerationErrorCode =
  | "PROVIDER_FAILURE"
  | "INVALID_API_KEY"
  | "UNSUPPORTED_MODE"
  | "TRANSPARENCY_FAILURE"
  | "INSUFFICIENT_CREDITS"
  | "MALFORMED_SCENE"
  | "MISSING_ASSET"
  | "RATE_LIMITED"
  | "QUOTA_EXHAUSTED"
  | "UNKNOWN";

export class GenerationError extends Error {
  constructor(
    public code: GenerationErrorCode,
    message: string,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = "GenerationError";
  }
}
