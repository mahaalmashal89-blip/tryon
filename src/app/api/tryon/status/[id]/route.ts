import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent, newRequestId } from "@/lib/securityLogger";

const FASHN_API = "https://api.fashn.ai/v1";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = newRequestId();
  const route = "GET /api/tryon/status";

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

  const { id } = await params;

  const { data: prediction } = await supabase
    .from("tryon_predictions")
    .select("id")
    .eq("prediction_id", id)
    .eq("user_id", user.id)
    .single();

  if (!prediction) {
    logSecurityEvent({ ts: new Date().toISOString(), requestId, event: "UNAUTHORIZED_POLL", route, userId: user.id });
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const fashnRes = await fetch(`${FASHN_API}/status/${id}`, {
    headers: { "Authorization": `Bearer ${key}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  const data = await fashnRes.json();
  return Response.json(data, { status: fashnRes.ok ? 200 : fashnRes.status });
}
