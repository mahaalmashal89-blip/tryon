import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FASHN_API = "https://api.fashn.ai/v1";
const VALID_CATEGORIES = new Set(["tops", "bottoms", "one-pieces", "auto"]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
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
    return Response.json({ error: "Invalid request." }, { status: 400 });
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
    const msg = data.message ?? data.error ?? `FASHN API error (${fashnRes.status})`;
    return Response.json({ error: msg }, { status: fashnRes.status });
  }

  const { error: dbError } = await supabase
    .from("tryon_predictions")
    .insert({ prediction_id: data.id, user_id: user.id });

  if (dbError) {
    return Response.json({ error: "Failed to record prediction." }, { status: 500 });
  }

  return Response.json(data);
}
