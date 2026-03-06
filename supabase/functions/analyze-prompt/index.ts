import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a scene analysis AI. Given a natural language image prompt, extract structured scene data as JSON.

Return ONLY a valid JSON object with this exact structure:
{
  "scene_title": "short title",
  "environment": {
    "location": "description of location",
    "time_of_day": "one of: dawn, morning, day, afternoon, sunset, dusk, night, midnight",
    "weather": "one of: clear, cloudy, rainy, stormy, foggy, snowy, windy",
    "lighting": "one of: natural, dramatic, soft, harsh, backlit, neon, warm, cool, golden hour"
  },
  "camera": {
    "shot_type": "one of: wide, medium, close-up, extreme close-up, aerial, panoramic",
    "angle": "one of: eye-level, low-angle, high-angle, bird's eye, worm's eye, dutch angle",
    "lens": "one of: 14mm, 24mm, 35mm, 50mm, 85mm, 135mm, 200mm"
  },
  "style": {
    "visual_style": "one of: photorealistic, cinematic, illustration, watercolor, oil painting, anime, 3D render, pixel art",
    "quality": "one of: draft, standard, high, ultra, masterpiece",
    "color_palette": "one of: natural, warm, cool, muted, vibrant, pastel, monochrome, neon"
  },
  "objects": [
    {
      "id": "unique-id",
      "type": "object type",
      "material": "material",
      "color": "color",
      "size": "one of: tiny, small, medium, large, huge",
      "position": "one of: left, center, right, foreground, background",
      "depth_layer": "one of: foreground, midground, background",
      "attributes": []
    }
  ]
}

Be thorough in extracting all objects mentioned. Generate unique IDs for each object.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this image prompt and extract the scene structure:\n\n"${prompt}"` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_scene",
              description: "Extract structured scene data from a prompt",
              parameters: {
                type: "object",
                properties: {
                  scene_title: { type: "string" },
                  environment: {
                    type: "object",
                    properties: {
                      location: { type: "string" },
                      time_of_day: { type: "string" },
                      weather: { type: "string" },
                      lighting: { type: "string" },
                    },
                    required: ["location", "time_of_day", "weather", "lighting"],
                    additionalProperties: false,
                  },
                  camera: {
                    type: "object",
                    properties: {
                      shot_type: { type: "string" },
                      angle: { type: "string" },
                      lens: { type: "string" },
                    },
                    required: ["shot_type", "angle", "lens"],
                    additionalProperties: false,
                  },
                  style: {
                    type: "object",
                    properties: {
                      visual_style: { type: "string" },
                      quality: { type: "string" },
                      color_palette: { type: "string" },
                    },
                    required: ["visual_style", "quality", "color_palette"],
                    additionalProperties: false,
                  },
                  objects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        type: { type: "string" },
                        material: { type: "string" },
                        color: { type: "string" },
                        size: { type: "string" },
                        position: { type: "string" },
                        depth_layer: { type: "string" },
                        attributes: { type: "array", items: { type: "string" } },
                      },
                      required: ["id", "type", "material", "color", "size", "position", "depth_layer", "attributes"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["scene_title", "environment", "camera", "style", "objects"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_scene" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
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
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const sceneData = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ scene: sceneData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse content as JSON
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const sceneData = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify({ scene: sceneData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Could not parse AI response");
  } catch (e) {
    console.error("analyze-prompt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
