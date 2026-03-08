import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_url } = await req.json();

    if (!image_url || typeof image_url !== "string") {
      return new Response(JSON.stringify({ error: "image_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    console.log("[remove-background] Processing image for user:", userId);

    // Use Gemini image editing to remove background
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Remove the background from this image completely. Make the background fully transparent. Keep only the main subject/object with clean edges. Output the result as a PNG with transparent background.",
              },
              {
                type: "image_url",
                image_url: { url: image_url },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[remove-background] AI error:", response.status, text);
      throw { status: 500, message: "Background removal failed" };
    }

    const data = await response.json();
    const resultImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!resultImage) {
      throw { status: 500, message: "No image returned from background removal" };
    }

    // Upload the transparent image
    const cleaned = resultImage.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));
    const fileName = `${userId}/${Date.now()}-transparent.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("generated-images")
      .upload(fileName, binaryData, { contentType: "image/png" });

    if (uploadError) {
      console.error("[remove-background] Upload error:", uploadError);
      // Return base64 as fallback
      return new Response(JSON.stringify({
        transparent_url: resultImage,
        is_base64: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from("generated-images")
      .getPublicUrl(fileName);

    console.log("[remove-background] Success, uploaded to:", publicUrl.publicUrl);

    return new Response(JSON.stringify({
      transparent_url: publicUrl.publicUrl,
      is_base64: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[remove-background] error:", e);
    return new Response(JSON.stringify({ error: e.message || "Background removal failed" }), {
      status: e.status || 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
