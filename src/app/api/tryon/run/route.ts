import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateImageInput } from "@/lib/validateImage";
import { logSecurityEvent, newRequestId } from "@/lib/securityLogger";

const FASHN_API = "https://api.fashn.ai/v1";
const VALID_CATEGORIES = new Set(["tops", "bottoms", "one-pieces", "auto"]);

// Server-side hard cap: 10 MB binary ≈ 13.4 MB base64. Applies to data URLs only;
// product URL strings are short and don't need this check.
const MAX_BASE64_CHARS = Math.ceil(10 * 1024 * 1024 * (4 / 3)) + 100;

function imageExceedsLimit(value: string): boolean {
  return value.startsWith("data:") && value.length > MAX_BASE64_CHARS;
}

export async function POST(req: NextRequest) {
  const requestId = newRequestId();
  const route = "POST /api/tryon/run";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    logSecurityEvent({ ts: new Date().toISOString(), requestId, event: "AUTH_FAILURE", route, userId: null });
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 try-ons per 10 minutes per user (testing phase)
  // To adjust per subscription tier, pass different p_max_requests here.
  const { data: rl } = await supabase.rpc("check_and_increment_tryon_rate_limit", {
    p_user_id: user.id,
    p_max_requests: 10,
    p_window_minutes: 10,
  });
  const limit = rl?.[0];
  if (!limit?.allowed) {
    const retryAfter = limit?.resets_at
      ? Math.ceil((new Date(limit.resets_at).getTime() - Date.now()) / 1000)
      : 600;
    logSecurityEvent({ ts: new Date().toISOString(), requestId, event: "RATE_LIMIT_EXCEEDED", route, userId: user.id, detail: `count=${limit?.current_count ?? "?"}` });
    return Response.json(
      { error: "Rate limit exceeded. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const key = process.env.FASHN_API_KEY;
  if (!key) {
    return Response.json({ error: "FASHN_API_KEY is not configured on the server." }, { status: 500 });
  }

  const body = await req.json();
  const { model_image, garment_image, category } = body;

  if (!model_image || !garment_image || !category) {
    return Response.json({ error: "model_image, garment_image, and category are required." }, { status: 400 });
  }

  if (!VALID_CATEGORIES.has(category)) {
    logSecurityEvent({ ts: new Date().toISOString(), requestId, event: "INVALID_CATEGORY", route, userId: user.id });
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!validateImageInput(model_image).ok || !validateImageInput(garment_image).ok) {
    logSecurityEvent({ ts: new Date().toISOString(), requestId, event: "INVALID_IMAGE_INPUT", route, userId: user.id });
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (imageExceedsLimit(model_image) || imageExceedsLimit(garment_image)) {
    logSecurityEvent({ ts: new Date().toISOString(), requestId, event: "INVALID_IMAGE_INPUT", route, userId: user.id, detail: "image_exceeds_10mb_server_cap" });
    return Response.json({ error: "Image is too large. Please use a smaller photo." }, { status: 413 });
  }

  const fashnRes = await fetch(`${FASHN_API}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model_name: "tryon-max",
      inputs: {
        model_image,
        product_image: garment_image,
        category,               // tell FASHN the exact garment type — prevents auto-detection splitting a dress into top+bottom
      },
    }),
  });

  const data = await fashnRes.json();

  if (!fashnRes.ok) {
    const detail = data.message ?? data.error ?? `status=${fashnRes.status}`;
    logSecurityEvent({ ts: new Date().toISOString(), requestId, event: "FASHN_API_ERROR", route, userId: user.id, detail: String(detail).slice(0, 200) });
    return Response.json({ error: "Try-on generation failed. Please try again." }, { status: 502 });
  }

  const { error: dbError } = await supabase
    .from("tryon_predictions")
    .insert({ prediction_id: data.id, user_id: user.id });

  if (dbError) {
    return Response.json({ error: "Failed to record prediction." }, { status: 500 });
  }

  return Response.json(data);
}
