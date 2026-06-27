import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent, newRequestId } from "@/lib/securityLogger";

const FASHN_API = "https://api.fashn.ai/v1";

// Only allow FASHN CDN result URLs — prevents SSRF to arbitrary hosts.
function isFashnResultUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "cdn.fashn.ai";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const requestId = newRequestId();
  const route = "POST /api/tryon/background-remove";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    logSecurityEvent({ ts: new Date().toISOString(), requestId, event: "AUTH_FAILURE", route, userId: null });
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.FASHN_API_KEY;
  if (!key) {
    return Response.json({ error: "FASHN_API_KEY is not configured on the server." }, { status: 500 });
  }

  const body = await req.json();
  const { result_url } = body;

  if (!result_url || !isFashnResultUrl(result_url)) {
    logSecurityEvent({ ts: new Date().toISOString(), requestId, event: "INVALID_IMAGE_INPUT", route, userId: user.id });
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const fashnRes = await fetch(`${FASHN_API}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model_name: "background-remove",
      inputs: { image: result_url },
    }),
  });

  const data = await fashnRes.json();

  if (!fashnRes.ok) {
    const detail = data.message ?? data.error ?? `status=${fashnRes.status}`;
    logSecurityEvent({ ts: new Date().toISOString(), requestId, event: "FASHN_API_ERROR", route, userId: user.id, detail: String(detail).slice(0, 200) });
    return Response.json({ error: "Background removal failed." }, { status: 502 });
  }

  // Record so the ownership check in /api/tryon/status/:id passes when polling.
  await supabase.from("tryon_predictions").insert({ prediction_id: data.id, user_id: user.id });

  return Response.json(data);
}
