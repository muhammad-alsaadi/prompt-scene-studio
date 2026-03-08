import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROVIDER_MODELS: Record<string, { gateway: string; model: string }> = {
  "gemini-flash-image": {
    gateway: "https://ai.gateway.lovable.dev/v1/chat/completions",
    model: "google/gemini-2.5-flash-image",
  },
  "gemini-pro-image": {
    gateway: "https://ai.gateway.lovable.dev/v1/chat/completions",
    model: "google/gemini-3-pro-image-preview",
  },
};

// ─── Mode-specific prompt builders ────────────────────────────────

function buildScenePrompt(prompt: string, sceneJson: any): string {
  const parts = [`Generate this scene as a single coherent image: ${prompt}`];
  if (sceneJson?.environment) {
    const e = sceneJson.environment;
    if (e.lighting) parts.push(`Lighting: ${e.lighting}.`);
    if (e.time_of_day) parts.push(`Time: ${e.time_of_day}.`);
  }
  if (sceneJson?.style) {
    const s = sceneJson.style;
    if (s.visual_style) parts.push(`Style: ${s.visual_style}.`);
    if (s.color_palette) parts.push(`Palette: ${s.color_palette}.`);
  }
  return parts.join(" ");
}

function buildAdCompositionPrompt(
  prompt: string,
  sceneJson: any,
  uploadedAssets: any[],
  brandKit: any,
): string {
  const parts = [
    "Create a professional advertising composition image.",
    `Scene concept: ${prompt}.`,
    "This must look like a polished marketing visual, commercial-quality, clean layout.",
  ];

  // Incorporate uploaded asset descriptions
  if (uploadedAssets && uploadedAssets.length > 0) {
    const assetDescs = uploadedAssets.map((a: any) => {
      const role = a.role || "reference";
      return `[${role} asset present]`;
    });
    parts.push(`Assets to incorporate: ${assetDescs.join(", ")}.`);
    parts.push("Place product/logo assets prominently in the composition.");
  }

  // Incorporate brand kit
  if (brandKit) {
    if (brandKit.colors && brandKit.colors.length > 0) {
      parts.push(`Brand colors: ${brandKit.colors.join(", ")}.`);
    }
    if (brandKit.fonts && brandKit.fonts.length > 0) {
      parts.push(`Brand typography style: ${brandKit.fonts.join(", ")}.`);
    }
    if (brandKit.style_notes) {
      parts.push(`Brand style direction: ${brandKit.style_notes}.`);
    }
  }

  // Use scene style if available
  if (sceneJson?.style?.visual_style) {
    parts.push(`Visual style: ${sceneJson.style.visual_style}.`);
  }

  parts.push("Output should be a single cohesive advertising image ready for marketing use.");
  return parts.join(" ");
}

function buildLayeredBackgroundPrompt(prompt: string, sceneJson: any): string {
  const parts = [
    "Generate ONLY the background/environment for this scene, with NO foreground subjects or main objects.",
    `Scene environment: ${prompt}.`,
  ];
  if (sceneJson?.environment) {
    const e = sceneJson.environment;
    if (e.location) parts.push(`Location: ${e.location}.`);
    if (e.lighting) parts.push(`Lighting: ${e.lighting}.`);
    if (e.weather) parts.push(`Weather: ${e.weather}.`);
  }
  if (sceneJson?.style?.visual_style) {
    parts.push(`Style: ${sceneJson.style.visual_style}.`);
  }
  parts.push("The image should be an empty environment/backdrop suitable for compositing foreground elements on top.");
  return parts.join(" ");
}

function buildLayeredElementPrompt(obj: any): string {
  const parts = [
    `Generate a single isolated element on a clean white background: ${obj.type || obj.name || "object"}.`,
  ];
  if (obj.material) parts.push(`Material: ${obj.material}.`);
  if (obj.color) parts.push(`Color: ${obj.color}.`);
  if (obj.size) parts.push(`Size: ${obj.size}.`);
  if (obj.style_description) parts.push(`Style: ${obj.style_description}.`);
  if (obj.pose_or_action) parts.push(`Pose/action: ${obj.pose_or_action}.`);
  parts.push("Render on a solid white background so it can be extracted as a layer.");
  return parts.join(" ");
}

// ─── Image generation call ────────────────────────────────────────

async function callImageGeneration(
  prompt: string,
  model: string,
  apiKey: string,
): Promise<string> {
  const route = PROVIDER_MODELS[model] || PROVIDER_MODELS["gemini-flash-image"];

  const response = await fetch(route.gateway, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: route.model,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw { status: 429, message: "Rate limit exceeded. Please try again." };
    if (response.status === 402) throw { status: 402, message: "AI credits exhausted. Please add credits." };
    const text = await response.text();
    console.error("Image generation error:", response.status, text);
    throw { status: 500, message: "Image generation failed" };
  }

  const data = await response.json();
  const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageData) throw { status: 500, message: "No image generated" };
  return imageData;
}

// ─── Upload helper ────────────────────────────────────────────────

async function uploadImage(
  base64Data: string,
  fileName: string,
  supabaseAdmin: any,
): Promise<string | null> {
  const cleaned = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const binaryData = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));

  const { error } = await supabaseAdmin.storage
    .from("generated-images")
    .upload(fileName, binaryData, { contentType: "image/png" });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data: publicUrl } = supabaseAdmin.storage
    .from("generated-images")
    .getPublicUrl(fileName);
  return publicUrl.publicUrl;
}

// ─── Main handler ─────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      prompt,
      mode = "scene",
      provider = "lovable-ai",
      model = "gemini-flash-image",
      resolution = "1080p",
      scene_json,
      uploaded_assets,
      brand_kit,
      brand_kit_id,
      layered = false,
      workspace_id,
      project_id,
      artboard_id,
    } = body;

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Setup Supabase for uploads
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user
    const authHeader = req.headers.get("authorization");
    let userId = "anonymous";
    if (authHeader) {
      const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) userId = user.id;
    }

    const timestamp = Date.now();

    // ─── MODE ROUTING ─────────────────────────────────────────

    if (mode === "ad_composition") {
      // ── AD COMPOSITION MODE ──
      console.log("[generate-image] Mode: ad_composition");

      // Fetch brand kit from DB if brand_kit_id provided and no inline brand_kit
      let effectiveBrandKit = brand_kit || null;
      if (!effectiveBrandKit && brand_kit_id) {
        const { data: bkData } = await supabaseAdmin
          .from("brand_kits")
          .select("colors, fonts, style_notes, logo_url")
          .eq("id", brand_kit_id)
          .single();
        if (bkData) effectiveBrandKit = bkData;
      }

      const adPrompt = buildAdCompositionPrompt(
        prompt,
        scene_json,
        uploaded_assets || [],
        effectiveBrandKit,
      );
      console.log("[generate-image] Ad prompt length:", adPrompt.length);

      const imageData = await callImageGeneration(adPrompt, model, LOVABLE_API_KEY);
      const fileName = `${userId}/${timestamp}-ad_composition.png`;
      const publicUrl = await uploadImage(imageData, fileName, supabaseAdmin);

      const baseCost = 200;
      const resMult: Record<string, number> = { "720p": 1, "1080p": 1.5, "2k": 2.5, "4k": 4 };
      const costUnits = Math.round(baseCost * (resMult[resolution] || 1));

      return new Response(JSON.stringify({
        image_url: publicUrl || imageData,
        cost_units: costUnits,
        provider,
        model,
        mode: "ad_composition",
        metadata: {
          resolution,
          brand_kit_applied: !!effectiveBrandKit,
          brand_kit_id: brand_kit_id || null,
          assets_used: (uploaded_assets || []).length,
          asset_roles: (uploaded_assets || []).map((a: any) => a.role),
          prompt_strategy: "ad_composition",
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (mode === "advanced_layered") {
      // ── ADVANCED LAYERED MODE ──
      console.log("[generate-image] Mode: advanced_layered");

      // Step 1: Generate background layer
      const bgPrompt = buildLayeredBackgroundPrompt(prompt, scene_json);
      console.log("[generate-image] Generating background layer...");
      const bgImageData = await callImageGeneration(bgPrompt, model, LOVABLE_API_KEY);
      const bgFileName = `${userId}/${timestamp}-layer_background.png`;
      const bgUrl = await uploadImage(bgImageData, bgFileName, supabaseAdmin);

      // Step 2: Generate foreground element layers for important objects
      const objects = scene_json?.objects || [];
      const importantObjects = objects
        .filter((o: any) => o.visible !== false && (o.importance === "high" || o.importance === "medium"))
        .slice(0, 3); // Cap at 3 element layers to control cost/time

      const layerOutputs: any[] = [];

      // Background layer
      layerOutputs.push({
        layerId: "background",
        layerType: "background",
        assetUrl: bgUrl || bgImageData,
        width: 1024,
        height: 1024,
        x: 0,
        y: 0,
        zIndex: 0,
      });

      // Generate element layers and remove backgrounds
      for (let i = 0; i < importantObjects.length; i++) {
        const obj = importantObjects[i];
        console.log(`[generate-image] Generating element layer ${i + 1}: ${obj.type || obj.name}`);
        try {
          const elemPrompt = buildLayeredElementPrompt(obj);
          const elemImageData = await callImageGeneration(elemPrompt, model, LOVABLE_API_KEY);
          const elemFileName = `${userId}/${timestamp}-layer_element_${i}.png`;
          const elemUrl = await uploadImage(elemImageData, elemFileName, supabaseAdmin);

          // Remove background to make element transparent
          let transparentUrl = elemUrl || elemImageData;
          try {
            console.log(`[generate-image] Removing background for element ${i}...`);
            const rbResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-image",
                messages: [{
                  role: "user",
                  content: [
                    { type: "text", text: "Remove the background completely. Make the background fully transparent. Keep only the main subject with clean edges. Output as PNG with transparent background." },
                    { type: "image_url", image_url: { url: elemUrl || elemImageData } },
                  ],
                }],
                modalities: ["image", "text"],
              }),
            });

            if (rbResponse.ok) {
              const rbData = await rbResponse.json();
              const rbImage = rbData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
              if (rbImage) {
                const trFileName = `${userId}/${timestamp}-layer_element_${i}_transparent.png`;
                const trUrl = await uploadImage(rbImage, trFileName, supabaseAdmin);
                if (trUrl) transparentUrl = trUrl;
              }
            }
          } catch (rbErr) {
            console.error(`[generate-image] Background removal failed for element ${i}, using original:`, rbErr);
          }

          layerOutputs.push({
            layerId: obj.id || `element_${i}`,
            layerType: "element",
            objectType: obj.type || obj.name,
            assetUrl: transparentUrl,
            width: obj.width || 256,
            height: obj.height || 256,
            x: obj.x || (200 + i * 150),
            y: obj.y || 200,
            zIndex: i + 1,
          });
        } catch (elemErr) {
          console.error(`[generate-image] Failed to generate element layer ${i}:`, elemErr);
        }
      }

      // Cost: base + per-layer
      const baseCost = 300;
      const layerCost = layerOutputs.length * 100;
      const resMult: Record<string, number> = { "720p": 1, "1080p": 1.5, "2k": 2.5, "4k": 4 };
      const costUnits = Math.round((baseCost + layerCost) * (resMult[resolution] || 1));

      return new Response(JSON.stringify({
        image_url: bgUrl || bgImageData, // Primary image is the background
        cost_units: costUnits,
        provider,
        model,
        mode: "advanced_layered",
        layer_outputs: layerOutputs,
        metadata: {
          resolution,
          layered: true,
          total_layers: layerOutputs.length,
          background_generated: true,
          element_layers_generated: layerOutputs.length - 1,
          element_types: importantObjects.map((o: any) => o.type || o.name),
          prompt_strategy: "layered_multi_pass",
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      // ── SCENE MODE (default) ──
      console.log("[generate-image] Mode: scene");

      const scenePrompt = buildScenePrompt(prompt, scene_json);
      const imageData = await callImageGeneration(scenePrompt, model, LOVABLE_API_KEY);
      const fileName = `${userId}/${timestamp}-scene.png`;
      const publicUrl = await uploadImage(imageData, fileName, supabaseAdmin);

      const baseCost = 100;
      const resMult: Record<string, number> = { "720p": 1, "1080p": 1.5, "2k": 2.5, "4k": 4 };
      const costUnits = Math.round(baseCost * (resMult[resolution] || 1));

      return new Response(JSON.stringify({
        image_url: publicUrl || imageData,
        cost_units: costUnits,
        provider,
        model,
        mode: "scene",
        metadata: {
          resolution,
          layered: false,
          prompt_strategy: "scene_single_pass",
          scene_title: scene_json?.scene_title,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e: any) {
    console.error("generate-image error:", e);
    const status = e.status || 500;
    const message = e.message || (e instanceof Error ? e.message : "Unknown error");
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
