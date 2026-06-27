import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only proxy images from FASHN's CDN — blocks SSRF to any other host.
function isFashnImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return parsed.hostname === "fashn.ai" || parsed.hostname.endsWith(".fashn.ai");
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = req.nextUrl.searchParams.get("url") ?? "";
  if (!url || !isFashnImageUrl(url)) {
    return Response.json({ error: "Invalid image URL." }, { status: 400 });
  }

  const imageRes = await fetch(url, { cache: "no-store" });
  if (!imageRes.ok) {
    return Response.json({ error: "Could not fetch image." }, { status: 502 });
  }

  const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
  const ext = contentType.includes("png") ? "png" : "jpg";
  const buffer = await imageRes.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="tryon-result.${ext}"`,
      "Cache-Control": "no-store",
    },
  });
}
