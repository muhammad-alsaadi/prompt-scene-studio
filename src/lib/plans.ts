// PromptScene Plan & Credit System
// Credits are INTERNAL COMPUTE UNITS, not "number of images"

export type PlanId = "free" | "pro" | "ultra" | "team";

export interface PlanFeatures {
  maxObjectsPerArtboard: number;
  maxArtboardsPerProject: number;
  maxProjects: number;
  dailyFreeUses: number;
  monthlyCredits: number;
  customFields: boolean;
  lockHideObjects: boolean;
  duplicateObjects: boolean;
  assetUpload: boolean;
  brandKit: boolean;
  saveAsTemplate: boolean;
  advancedExport: boolean;
  adCompositionMode: boolean;
  advancedLayeredMode: boolean;
  byoApiKeys: boolean;
  providerSelection: boolean;
  teamWorkspace: boolean;
  sharedAssets: boolean;
  sharedBrandKit: boolean;
  activityLog: boolean;
  advancedProviderRouting: boolean;
  premiumJobPriority: boolean;
  highResOutput: boolean;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: string;
  priceNote: string;
  credits: string;
  creditsNote: string;
  cta: string;
  ctaVariant: "outline" | "default" | "gradient";
  popular?: boolean;
  features: PlanFeatures;
  featureList: string[];
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    price: "$0",
    priceNote: "forever",
    credits: "3 uses/day",
    creditsNote: "Standard renders only",
    cta: "Get Started",
    ctaVariant: "outline",
    features: {
      maxObjectsPerArtboard: 5,
      maxArtboardsPerProject: 1,
      maxProjects: 3,
      dailyFreeUses: 3,
      monthlyCredits: 0,
      customFields: false,
      lockHideObjects: false,
      duplicateObjects: false,
      assetUpload: false,
      brandKit: false,
      saveAsTemplate: false,
      advancedExport: false,
      adCompositionMode: false,
      advancedLayeredMode: false,
      byoApiKeys: false,
      providerSelection: false,
      teamWorkspace: false,
      sharedAssets: false,
      sharedBrandKit: false,
      activityLog: false,
      advancedProviderRouting: false,
      premiumJobPriority: false,
      highResOutput: false,
    },
    featureList: [
      "3 standard renders/day",
      "Up to 3 projects",
      "5 objects per artboard",
      "Scene Mode only",
      "Basic templates",
      "720p export",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: "$13",
    priceNote: "/month",
    credits: "10,000",
    creditsNote: "compute units/month",
    cta: "Upgrade to Pro",
    ctaVariant: "gradient",
    popular: true,
    features: {
      maxObjectsPerArtboard: 50,
      maxArtboardsPerProject: 10,
      maxProjects: -1, // unlimited
      dailyFreeUses: -1,
      monthlyCredits: 10000,
      customFields: true,
      lockHideObjects: true,
      duplicateObjects: true,
      assetUpload: true,
      brandKit: true,
      saveAsTemplate: true,
      advancedExport: true,
      adCompositionMode: true,
      advancedLayeredMode: false,
      byoApiKeys: false,
      providerSelection: false,
      teamWorkspace: false,
      sharedAssets: false,
      sharedBrandKit: false,
      activityLog: false,
      advancedProviderRouting: false,
      premiumJobPriority: false,
      highResOutput: true,
    },
    featureList: [
      "10,000 compute units/month",
      "Unlimited projects",
      "Multi-artboard projects",
      "Scene + Ad Composition modes",
      "Brand kit & asset library",
      "Product image uploads",
      "Custom object fields",
      "Lock/hide/duplicate objects",
      "Save as template",
      "1080p+ export",
    ],
  },
  ultra: {
    id: "ultra",
    name: "Ultra",
    price: "$25",
    priceNote: "/month",
    credits: "10,000",
    creditsNote: "compute units/month",
    cta: "Go Ultra",
    ctaVariant: "default",
    features: {
      maxObjectsPerArtboard: 100,
      maxArtboardsPerProject: 50,
      maxProjects: -1,
      dailyFreeUses: -1,
      monthlyCredits: 10000,
      customFields: true,
      lockHideObjects: true,
      duplicateObjects: true,
      assetUpload: true,
      brandKit: true,
      saveAsTemplate: true,
      advancedExport: true,
      adCompositionMode: true,
      advancedLayeredMode: true,
      byoApiKeys: true,
      providerSelection: true,
      teamWorkspace: false,
      sharedAssets: false,
      sharedBrandKit: false,
      activityLog: false,
      advancedProviderRouting: true,
      premiumJobPriority: true,
      highResOutput: true,
    },
    featureList: [
      "Everything in Pro",
      "Advanced Layered Mode",
      "Bring your own API keys",
      "Choose provider/model",
      "Premium job priority",
      "4K export",
      "Advanced composition workflows",
      "Extended history & storage",
    ],
  },
  team: {
    id: "team",
    name: "Team",
    price: "$10",
    priceNote: "/seat/month",
    credits: "Shared pool",
    creditsNote: "Team credit pool",
    cta: "Contact Us",
    ctaVariant: "outline",
    features: {
      maxObjectsPerArtboard: 100,
      maxArtboardsPerProject: 50,
      maxProjects: -1,
      dailyFreeUses: -1,
      monthlyCredits: 10000,
      customFields: true,
      lockHideObjects: true,
      duplicateObjects: true,
      assetUpload: true,
      brandKit: true,
      saveAsTemplate: true,
      advancedExport: true,
      adCompositionMode: true,
      advancedLayeredMode: true,
      byoApiKeys: true,
      providerSelection: true,
      teamWorkspace: true,
      sharedAssets: true,
      sharedBrandKit: true,
      activityLog: true,
      advancedProviderRouting: true,
      premiumJobPriority: true,
      highResOutput: true,
    },
    featureList: [
      "Everything in Ultra",
      "Shared workspace",
      "Team roles & permissions",
      "Shared asset library",
      "Shared brand kit",
      "Activity log & audit trail",
      "Shared credit pool",
    ],
  },
};

// Credit cost calculation
export interface CreditCostFactors {
  generationMode: "scene" | "ad_composition" | "advanced_layered";
  provider: string;
  model: string;
  resolution: "720p" | "1080p" | "2k" | "4k";
  layerCount: number;
  backgroundRemoval: boolean;
  imageEditing: boolean;
  premiumRouting: boolean;
}

const BASE_COSTS: Record<string, number> = {
  scene: 100,
  ad_composition: 200,
  advanced_layered: 300,
};

const RESOLUTION_MULTIPLIERS: Record<string, number> = {
  "720p": 1,
  "1080p": 1.5,
  "2k": 2.5,
  "4k": 4,
};

export function calculateCreditCost(factors: CreditCostFactors): number {
  let cost = BASE_COSTS[factors.generationMode] || 100;
  cost *= RESOLUTION_MULTIPLIERS[factors.resolution] || 1;
  
  if (factors.layerCount > 1) {
    cost += (factors.layerCount - 1) * 50;
  }
  if (factors.backgroundRemoval) cost += 30;
  if (factors.imageEditing) cost += 50;
  if (factors.premiumRouting) cost *= 1.5;
  
  return Math.round(cost);
}

// Telegram payment/support link
export const TELEGRAM_SUPPORT_URL = "https://t.me/PromptSceneSupport";
export const TELEGRAM_PAYMENT_URL = "https://t.me/PromptScenePayment";
