import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Provider routing map
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

    // Enhance prompt based on mode
    let enhancedPrompt = prompt;
    if (mode === "ad_composition") {
      enhancedPrompt = `Professional advertising composition. ${prompt}. Clean, commercial quality, marketing-ready output.`;
    } else if (mode === "advanced_layered") {
      enhancedPrompt = `Generate as isolated visual elements. ${prompt}. Each major element should be clearly defined.`;
    }

    // Resolve provider/model route
    const route = PROVIDER_MODELS[model] || PROVIDER_MODELS["gemini-flash-image"];

    const response = await fetch(route.gateway, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: route.model,
        messages: [
          { role: "user", content: `Generate this image: ${enhancedPrompt}` },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("Image generation error:", response.status, text);
      throw new Error("Image generation failed");
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      throw new Error("No image generated");
    }

    // Upload to Storage
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

    // Decode and upload
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const fileName = `${userId}/${Date.now()}-${mode}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("generated-images")
      .upload(fileName, binaryData, { contentType: "image/png" });

    let imageUrl = imageData; // fallback to base64
    if (!uploadError) {
      const { data: publicUrl } = supabaseAdmin.storage
        .from("generated-images")
        .getPublicUrl(fileName);
      imageUrl = publicUrl.publicUrl;
    } else {
      console.error("Upload error:", uploadError);
    }

    // Calculate cost units based on mode/model/resolution
    const baseCosts: Record<string, number> = {
      scene: 100,
      ad_composition: 200,
      advanced_layered: 300,
    };
    const resMult: Record<string, number> = {
      "720p": 1,
      "1080p": 1.5,
      "2k": 2.5,
      "4k": 4,
    };
    const costUnits = Math.round((baseCosts[mode] || 100) * (resMult[resolution] || 1));

    return new Response(JSON.stringify({
      image_url: imageUrl,
      cost_units: costUnits,
      provider,
      model,
      mode,
      metadata: {
        resolution,
        layered,
        scene_title: scene_json?.scene_title,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
