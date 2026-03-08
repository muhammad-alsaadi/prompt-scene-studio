// Provider Connector System
// Abstraction layer for multiple AI image generation providers

export interface ProviderCapabilities {
  textToImage: boolean;
  imageToImage: boolean;
  nativeTransparency: boolean;
  backgroundRemoval: boolean;
  supportsUploadedReference: boolean;
  supportsEditing: boolean;
  maxResolution: number;
  supportsByoKey: boolean;
  pricingStrategy: "per_request" | "per_pixel" | "per_second" | "flat";
}

export interface ProviderDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  capabilities: ProviderCapabilities;
  models: ProviderModel[];
  availableOnPlans: ("free" | "pro" | "ultra" | "team")[];
  requiresApiKey: boolean;
  apiKeyConfigField?: string;
  baseCostMultiplier: number;
}

export interface ProviderModel {
  id: string;
  name: string;
  description: string;
  quality: "draft" | "standard" | "high" | "ultra";
  speed: "fast" | "medium" | "slow";
  costMultiplier: number;
  maxWidth: number;
  maxHeight: number;
  supportsTransparency: boolean;
}

export type GenerationMode = "scene" | "ad_composition" | "advanced_layered";

export interface GenerationModeDefinition {
  id: GenerationMode;
  name: string;
  description: string;
  icon: string;
  availableOnPlans: ("free" | "pro" | "ultra" | "team")[];
  defaultProvider: string;
}

export const GENERATION_MODES: GenerationModeDefinition[] = [
  {
    id: "scene",
    name: "Scene Mode",
    description: "Generate the full scene as a single coherent image. Best for natural scenes and standard compositions.",
    icon: "image",
    availableOnPlans: ["free", "pro", "ultra", "team"],
    defaultProvider: "lovable-ai",
  },
  {
    id: "ad_composition",
    name: "Ad Composition",
    description: "Create marketing compositions with uploaded product assets, logos, and structured ad layouts.",
    icon: "layout",
    availableOnPlans: ["pro", "ultra", "team"],
    defaultProvider: "lovable-ai",
  },
  {
    id: "advanced_layered",
    name: "Advanced Layered",
    description: "Generate background and elements as separate layers for maximum creative control.",
    icon: "layers",
    availableOnPlans: ["ultra", "team"],
    defaultProvider: "lovable-ai",
  },
];

export const PROVIDERS: ProviderDefinition[] = [
  {
    id: "lovable-ai",
    name: "PromptScene AI",
    description: "Built-in AI engine powered by curated models. No API key needed.",
    capabilities: {
      textToImage: true,
      imageToImage: false,
      nativeTransparency: false,
      backgroundRemoval: false,
      supportsUploadedReference: false,
      supportsEditing: false,
      maxResolution: 2048,
      supportsByoKey: false,
      pricingStrategy: "per_request",
    },
    models: [
      {
        id: "gemini-flash-image",
        name: "Flash",
        description: "Fast generation, good quality",
        quality: "standard",
        speed: "fast",
        costMultiplier: 1,
        maxWidth: 1024,
        maxHeight: 1024,
        supportsTransparency: false,
      },
      {
        id: "gemini-pro-image",
        name: "Pro",
        description: "Higher quality, more detailed",
        quality: "high",
        speed: "medium",
        costMultiplier: 1.5,
        maxWidth: 2048,
        maxHeight: 2048,
        supportsTransparency: false,
      },
    ],
    availableOnPlans: ["free", "pro", "ultra", "team"],
    requiresApiKey: false,
    baseCostMultiplier: 1,
  },
  {
    id: "openai",
    name: "OpenAI DALL-E",
    description: "OpenAI's image generation models. Requires your own API key.",
    capabilities: {
      textToImage: true,
      imageToImage: true,
      nativeTransparency: false,
      backgroundRemoval: false,
      supportsUploadedReference: true,
      supportsEditing: true,
      maxResolution: 4096,
      supportsByoKey: true,
      pricingStrategy: "per_request",
    },
    models: [
      {
        id: "dall-e-3",
        name: "DALL·E 3",
        description: "High quality image generation",
        quality: "high",
        speed: "medium",
        costMultiplier: 2,
        maxWidth: 1792,
        maxHeight: 1024,
        supportsTransparency: false,
      },
    ],
    availableOnPlans: ["ultra", "team"],
    requiresApiKey: true,
    apiKeyConfigField: "openai_api_key",
    baseCostMultiplier: 2,
  },
  {
    id: "stability",
    name: "Stability AI",
    description: "Stable Diffusion models. Requires your own API key.",
    capabilities: {
      textToImage: true,
      imageToImage: true,
      nativeTransparency: false,
      backgroundRemoval: true,
      supportsUploadedReference: true,
      supportsEditing: true,
      maxResolution: 4096,
      supportsByoKey: true,
      pricingStrategy: "per_pixel",
    },
    models: [
      {
        id: "sd3-medium",
        name: "SD3 Medium",
        description: "Fast, balanced quality",
        quality: "standard",
        speed: "fast",
        costMultiplier: 1,
        maxWidth: 2048,
        maxHeight: 2048,
        supportsTransparency: false,
      },
      {
        id: "sd3-large",
        name: "SD3 Large",
        description: "Maximum quality",
        quality: "ultra",
        speed: "slow",
        costMultiplier: 3,
        maxWidth: 4096,
        maxHeight: 4096,
        supportsTransparency: false,
      },
    ],
    availableOnPlans: ["ultra", "team"],
    requiresApiKey: true,
    apiKeyConfigField: "stability_api_key",
    baseCostMultiplier: 1.5,
  },
  {
    id: "fal",
    name: "fal.ai",
    description: "Fast inference with multiple models. Requires your own API key.",
    capabilities: {
      textToImage: true,
      imageToImage: true,
      nativeTransparency: true,
      backgroundRemoval: true,
      supportsUploadedReference: true,
      supportsEditing: true,
      maxResolution: 4096,
      supportsByoKey: true,
      pricingStrategy: "per_second",
    },
    models: [
      {
        id: "flux-pro",
        name: "FLUX Pro",
        description: "Highest quality FLUX model",
        quality: "ultra",
        speed: "medium",
        costMultiplier: 2,
        maxWidth: 2048,
        maxHeight: 2048,
        supportsTransparency: true,
      },
    ],
    availableOnPlans: ["ultra", "team"],
    requiresApiKey: true,
    apiKeyConfigField: "fal_api_key",
    baseCostMultiplier: 1.2,
  },
];

// Get providers available for a plan
export function getProvidersForPlan(plan: string): ProviderDefinition[] {
  return PROVIDERS.filter(p => p.availableOnPlans.includes(plan as any));
}

// Get generation modes available for a plan
export function getModesForPlan(plan: string): GenerationModeDefinition[] {
  return GENERATION_MODES.filter(m => m.availableOnPlans.includes(plan as any));
}
