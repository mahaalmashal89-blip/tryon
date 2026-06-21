import { NextRequest } from "next/server";

const FASHN_API = "https://api.fashn.ai/v1";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const key = process.env.FASHN_API_KEY;
  if (!key) {
    return Response.json({ error: "FASHN_API_KEY is not configured on the server." }, { status: 500 });
  }

  const { id } = await params;

  const fashnRes = await fetch(`${FASHN_API}/status/${id}`, {
    headers: { "Authorization": `Bearer ${key}` },
    cache: "no-store",
  });

  const data = await fashnRes.json();
  return Response.json(data, { status: fashnRes.ok ? 200 : fashnRes.status });
}
