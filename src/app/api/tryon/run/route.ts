import { NextRequest } from "next/server";

const FASHN_API = "https://api.fashn.ai/v1";

export async function POST(req: NextRequest) {
  const key = process.env.FASHN_API_KEY;
  if (!key) {
    return Response.json({ error: "FASHN_API_KEY is not configured on the server." }, { status: 500 });
  }

  const body = await req.json();
  const { model_image, garment_image, category } = body;

  if (!model_image || !garment_image || !category) {
    return Response.json({ error: "model_image, garment_image, and category are required." }, { status: 400 });
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

  return Response.json(data);
}
